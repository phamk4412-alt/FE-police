import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import {
  getIdentityVerificationState,
  saveIdentityVerificationState,
} from "../../utils/identityVerification";

type CccdStatus = "idle" | "valid" | "blurred" | "nearer" | "framing";

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

const cardRatio = 85.6 / 53.98;

const statusText: Record<CccdStatus, string> = {
  idle: "Chưa phát hiện CCCD",
  valid: "CCCD hợp lệ",
  blurred: "Ảnh quá mờ",
  nearer: "Đưa gần hơn",
  framing: "Đưa đúng khung",
};

const statusHelp: Record<CccdStatus, string> = {
  idle: "Chụp hoặc tải ảnh mặt trước CCCD để tiếp tục.",
  valid: "Ảnh CCCD đã được lưu tạm cho phiên đăng nhập này.",
  blurred: "Ảnh đã nhận, nên chụp lại nếu cần bản rõ hơn.",
  nearer: "Ảnh đã nhận, đặt thẻ chiếm nhiều khung hơn nếu chụp lại.",
  framing: "Ảnh đã nhận, căn thẻ nằm gọn trong khung nếu chụp lại.",
};

function getRegionStats(
  imageData: ImageData,
  canvasWidth: number,
  canvasHeight: number,
  region: Region,
) {
  const { data } = imageData;
  const startX = Math.max(0, Math.floor(region.x * canvasWidth));
  const endX = Math.min(canvasWidth, Math.floor((region.x + region.width) * canvasWidth));
  const startY = Math.max(0, Math.floor(region.y * canvasHeight));
  const endY = Math.min(canvasHeight, Math.floor((region.y + region.height) * canvasHeight));
  const luminanceValues: number[] = [];
  let colorTotal = 0;
  let edgeTotal = 0;

  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const offset = (y * canvasWidth + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
      const maxChannel = Math.max(red, green, blue);
      const minChannel = Math.min(red, green, blue);

      luminanceValues.push(luminance);
      colorTotal += maxChannel - minChannel;

      if (x + 4 < endX) {
        const nextOffset = (y * canvasWidth + x + 4) * 4;
        const nextLuminance =
          0.299 * data[nextOffset] +
          0.587 * data[nextOffset + 1] +
          0.114 * data[nextOffset + 2];

        edgeTotal += Math.abs(luminance - nextLuminance);
      }
    }
  }

  const sampleCount = Math.max(1, luminanceValues.length);
  const brightness =
    luminanceValues.reduce((total, value) => total + value, 0) / sampleCount;
  const variance =
    luminanceValues.reduce((total, value) => total + (value - brightness) ** 2, 0) /
    sampleCount;

  return {
    brightness,
    contrast: Math.sqrt(variance),
    edges: edgeTotal / sampleCount,
    saturation: colorTotal / sampleCount,
  };
}

function analyzeCccdImage(canvas: HTMLCanvasElement, sourceRatio: number) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return "valid" satisfies CccdStatus;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const fullCard = getRegionStats(imageData, canvas.width, canvas.height, {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
  const portraitZone = getRegionStats(imageData, canvas.width, canvas.height, {
    x: 0.05,
    y: 0.32,
    width: 0.25,
    height: 0.52,
  });
  const textZone = getRegionStats(imageData, canvas.width, canvas.height, {
    x: 0.36,
    y: 0.22,
    width: 0.42,
    height: 0.54,
  });
  const chipZone = getRegionStats(imageData, canvas.width, canvas.height, {
    x: 0.78,
    y: 0.33,
    width: 0.17,
    height: 0.3,
  });
  const ratioDelta = Math.abs(sourceRatio - cardRatio);
  const hasCardRatio = ratioDelta < 0.58;
  const hasEnoughDetail =
    fullCard.edges > 5.2 && (portraitZone.contrast > 7 || textZone.edges > 6.8);
  const hasLayoutSignals =
    portraitZone.saturation > 8 || textZone.contrast > 10 || chipZone.contrast > 8;

  if (canvas.width < 720 || canvas.height < 430) {
    return "nearer" satisfies CccdStatus;
  }

  if (fullCard.contrast < 13 || fullCard.edges < 3.8) {
    return "blurred" satisfies CccdStatus;
  }

  if (!hasCardRatio || !hasEnoughDetail || !hasLayoutSignals) {
    return "framing" satisfies CccdStatus;
  }

  return "valid" satisfies CccdStatus;
}

function createCccdCanvas(width: number) {
  const canvas = document.createElement("canvas");
  const targetWidth = Math.min(1280, width);
  const targetHeight = Math.round(targetWidth / cardRatio);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  return canvas;
}

function VerifyCccd() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [status, setStatus] = useState<CccdStatus>("idle");

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!isSignedIn) {
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Thiết bị không hỗ trợ mở camera trong trình duyệt này.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraReady(true);
        setCameraError("");
      } catch {
        if (isMounted) {
          setCameraError("Không thể mở camera. Bạn vẫn có thể tải ảnh CCCD lên.");
        }
      }
    }

    void startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isSignedIn]);

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  const identityState = getIdentityVerificationState(user.id);

  if (identityState.cccdVerified) {
    return <Navigate to="/face-scan" replace />;
  }

  const currentUserId = user.id;

  function handleAnalyzedImage(canvas: HTMLCanvasElement, sourceRatio: number) {
    const nextImage = canvas.toDataURL("image/jpeg", 0.84);
    const nextStatus = analyzeCccdImage(canvas, sourceRatio);

    setPreviewImage(nextImage);
    setStatus(nextStatus);
  }

  function handleCapture() {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setStatus("idle");
      return;
    }

    const cropWidth = Math.min(video.videoWidth * 0.84, video.videoHeight * 0.78 * cardRatio);
    const cropHeight = cropWidth / cardRatio;
    const sourceX = (video.videoWidth - cropWidth) / 2;
    const sourceY = (video.videoHeight - cropHeight) / 2;
    const canvas = createCccdCanvas(cropWidth);
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      video,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    handleAnalyzedImage(canvas, cardRatio);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const sourceRatio = image.naturalWidth / image.naturalHeight;
        const canvas = createCccdCanvas(image.naturalWidth);
        const context = canvas.getContext("2d");

        if (!context) {
          return;
        }

        const cropRatio = canvas.width / canvas.height;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;
        let sourceX = 0;
        let sourceY = 0;

        if (sourceRatio > cropRatio) {
          sourceWidth = image.naturalHeight * cropRatio;
          sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
          sourceHeight = image.naturalWidth / cropRatio;
          sourceY = (image.naturalHeight - sourceHeight) / 2;
        }

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        handleAnalyzedImage(canvas, sourceRatio);
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function continueToFaceScan(skipped: boolean) {
    saveIdentityVerificationState(currentUserId, {
      cccdImage: skipped ? undefined : previewImage,
      cccdSkipped: skipped,
      cccdVerified: true,
    });
    navigate("/face-scan", { replace: true });
  }

  return (
    <main className="identity-page">
      <VietnameseDecor variant="auth" />
      <section className="identity-shell">
        <div className="identity-copy">
          <span className="eyebrow">Xác thực demo</span>
          <h1>Xác thực CCCD</h1>
          <p>Đưa mặt trước CCCD vào khung</p>
          <div className="identity-progress" aria-label="Tiến trình xác thực">
            <span className="is-active">CCCD</span>
            <span>Quét mặt</span>
            <span>Vai trò</span>
          </div>
        </div>

        <section className="identity-panel" aria-label="Xác thực căn cước công dân">
          <div className="scan-preview cccd-preview">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={previewImage ? "is-muted" : ""}
            />
            {previewImage ? <img src={previewImage} alt="Ảnh CCCD đã chụp" /> : null}
            <div className="scan-overlay" aria-hidden="true">
              <div className="cccd-frame">
                <span className="frame-corner frame-corner-top-left" />
                <span className="frame-corner frame-corner-top-right" />
                <span className="frame-corner frame-corner-bottom-left" />
                <span className="frame-corner frame-corner-bottom-right" />
                <span className="scan-line" />
                <span className="cccd-photo-zone" />
                <span className="cccd-text-zone" />
                <span className="cccd-chip-zone" />
              </div>
            </div>
          </div>

          <div className={`scan-status scan-status-${status}`}>
            <span className="scan-status-dot" aria-hidden="true" />
            <div>
              <strong>{statusText[status]}</strong>
              <span>{cameraError || statusHelp[status]}</span>
            </div>
          </div>

          <div className="identity-actions">
            <Button disabled={!cameraReady} onClick={handleCapture} type="button">
              Chụp CCCD
            </Button>
            <label className="btn btn-secondary identity-upload-button">
              Tải ảnh lên
              <input accept="image/*" onChange={handleUpload} type="file" />
            </label>
            <Button
              disabled={!previewImage}
              onClick={() => continueToFaceScan(false)}
              type="button"
            >
              Tiếp tục
            </Button>
            <Button onClick={() => continueToFaceScan(true)} type="button" variant="ghost">
              Bỏ qua
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default VerifyCccd;
