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

type CccdStatus = "idle" | "valid" | "invalid" | "blurred" | "nearer" | "framing";

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectorWindow extends Window {
  BarcodeDetector?: new (options?: { formats?: string[] }) => {
    detect(source: CanvasImageSource): Promise<Array<{ boundingBox?: DOMRectReadOnly }>>;
  };
  TextDetector?: new () => {
    detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string; text?: string }>>;
  };
}

const cardRatio = 85.6 / 53.98;

const statusText: Record<CccdStatus, string> = {
  idle: "Chưa phát hiện CCCD",
  valid: "CCCD hợp lệ",
  invalid: "Không phát hiện CCCD hợp lệ",
  blurred: "Ảnh quá mờ",
  nearer: "Đưa gần hơn",
  framing: "Đưa đúng khung",
};

const statusHelp: Record<CccdStatus, string> = {
  idle: "Chụp hoặc tải ảnh mặt trước CCCD để tiếp tục.",
  valid: "Ảnh CCCD đã được lưu tạm cho phiên đăng nhập này.",
  invalid: "Ảnh không có đủ dấu hiệu CCCD Việt Nam: tỉ lệ thẻ, QR góc phải trên và tiêu đề căn cước.",
  blurred: "Ảnh quá mờ, vui lòng chụp hoặc tải ảnh rõ hơn.",
  nearer: "Đặt thẻ chiếm nhiều khung hơn rồi chụp lại.",
  framing: "Căn mặt trước CCCD nằm gọn trong khung rồi chụp lại.",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .toUpperCase();
}

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

function getRegionColorSignals(
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
  let darkPixels = 0;
  let lightPixels = 0;
  let redDominantPixels = 0;
  let blueGreenPixels = 0;
  let totalPixels = 0;
  let transitions = 0;

  for (let y = startY; y < endY; y += 3) {
    let previousIsDark = false;

    for (let x = startX; x < endX; x += 3) {
      const offset = (y * canvasWidth + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
      const isDark = luminance < 72;

      if (isDark) {
        darkPixels += 1;
      }

      if (luminance > 188) {
        lightPixels += 1;
      }

      if (red > green + 26 && red > blue + 26 && red > 120) {
        redDominantPixels += 1;
      }

      if (green > 110 && blue > 110 && red < 190) {
        blueGreenPixels += 1;
      }

      if (x > startX && isDark !== previousIsDark) {
        transitions += 1;
      }

      previousIsDark = isDark;
      totalPixels += 1;
    }
  }

  return {
    blueGreenRatio: blueGreenPixels / Math.max(1, totalPixels),
    darkRatio: darkPixels / Math.max(1, totalPixels),
    lightRatio: lightPixels / Math.max(1, totalPixels),
    redRatio: redDominantPixels / Math.max(1, totalPixels),
    transitions: transitions / Math.max(1, totalPixels),
  };
}

async function detectQrByBrowser(canvas: HTMLCanvasElement) {
  const detectorWindow = window as DetectorWindow;

  if (!detectorWindow.BarcodeDetector) {
    return false;
  }

  try {
    const detector = new detectorWindow.BarcodeDetector({ formats: ["qr_code"] });
    const detectedCodes = await detector.detect(canvas);

    return detectedCodes.some((code) => {
      if (!code.boundingBox) {
        return true;
      }

      const centerX = (code.boundingBox.x + code.boundingBox.width / 2) / canvas.width;
      const centerY = (code.boundingBox.y + code.boundingBox.height / 2) / canvas.height;

      return centerX > 0.68 && centerY < 0.36;
    });
  } catch {
    return false;
  }
}

async function detectCccdTitleByBrowser(canvas: HTMLCanvasElement) {
  const detectorWindow = window as DetectorWindow;

  if (!detectorWindow.TextDetector) {
    return null;
  }

  try {
    const detector = new detectorWindow.TextDetector();
    const detectedText = await detector.detect(canvas);
    const text = normalizeText(
      detectedText.map((item) => item.rawValue || item.text || "").join(" "),
    );

    return /CAN\s*CUOC(?:\s*CONG\s*DAN)?/.test(text);
  } catch {
    return null;
  }
}

async function analyzeCccdImage(canvas: HTMLCanvasElement, sourceRatio: number) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return "invalid" satisfies CccdStatus;
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
  const qrZone = getRegionStats(imageData, canvas.width, canvas.height, {
    x: 0.78,
    y: 0.08,
    width: 0.16,
    height: 0.26,
  });
  const qrSignals = getRegionColorSignals(imageData, canvas.width, canvas.height, {
    x: 0.78,
    y: 0.08,
    width: 0.16,
    height: 0.26,
  });
  const titleSignals = getRegionColorSignals(imageData, canvas.width, canvas.height, {
    x: 0.34,
    y: 0.22,
    width: 0.42,
    height: 0.17,
  });
  const cardBackgroundSignals = getRegionColorSignals(imageData, canvas.width, canvas.height, {
    x: 0.1,
    y: 0.08,
    width: 0.82,
    height: 0.76,
  });
  const ratioDelta = Math.abs(sourceRatio - cardRatio);
  const hasCardRatio = ratioDelta < 0.28;
  const hasQrByShape =
    qrZone.contrast > 46 &&
    qrZone.edges > 13 &&
    qrSignals.darkRatio > 0.08 &&
    qrSignals.lightRatio > 0.18 &&
    qrSignals.transitions > 0.18;
  const hasQr = hasQrByShape || (await detectQrByBrowser(canvas));
  const hasOcrTitle = await detectCccdTitleByBrowser(canvas);
  const hasVisualTitle = titleSignals.redRatio > 0.035 && textZone.edges > 5.8;
  const hasCccdTitle = hasOcrTitle === true || (hasOcrTitle === null && hasVisualTitle);
  const hasCardLayout =
    portraitZone.contrast > 9 &&
    textZone.contrast > 13 &&
    textZone.edges > 6.2 &&
    cardBackgroundSignals.blueGreenRatio > 0.08;

  if (canvas.width < 720 || canvas.height < 430) {
    return "nearer" satisfies CccdStatus;
  }

  if (fullCard.contrast < 13 || fullCard.edges < 3.8) {
    return "blurred" satisfies CccdStatus;
  }

  if (!hasCardRatio) {
    return "framing" satisfies CccdStatus;
  }

  if (!hasQr || !hasCccdTitle || !hasCardLayout) {
    return "invalid" satisfies CccdStatus;
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [status, setStatus] = useState<CccdStatus>("idle");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

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

  async function handleAnalyzedImage(canvas: HTMLCanvasElement, sourceRatio: number) {
    const nextImage = canvas.toDataURL("image/jpeg", 0.84);

    setIsAnalyzing(true);
    setPreviewImage(nextImage);
    setStatus("idle");

    try {
      const nextStatus = await analyzeCccdImage(canvas, sourceRatio);
      setStatus(nextStatus);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function openCamera() {
    if (!isSignedIn) {
      return false;
    }

    if (streamRef.current && cameraReady) {
      return true;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Thiết bị không hỗ trợ mở camera trong trình duyệt này.");
      setCameraReady(false);
      return false;
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

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
      setCameraError("");
      return true;
    } catch {
      setCameraReady(false);
      setCameraError("Không thể mở camera. Bạn vẫn có thể tải ảnh CCCD lên.");
      return false;
    }
  }

  async function handleCapture() {
    if (!cameraReady) {
      await openCamera();
      return;
    }

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
    void handleAnalyzedImage(canvas, cardRatio);
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
        void handleAnalyzedImage(canvas, sourceRatio);
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
              className={previewImage || !cameraReady ? "is-muted" : ""}
            />
            {!previewImage && !cameraReady ? (
              <>
                <div className="cccd-sample-card" aria-hidden="true">
                  <span className="cccd-sample-pattern" />
                  <span className="cccd-sample-emblem" />
                  <span className="cccd-sample-map" />
                  <span className="cccd-sample-qr" />
                  <div className="cccd-sample-header">
                    <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                    <small>Độc lập - Tự do - Hạnh phúc</small>
                    <strong>CĂN CƯỚC CÔNG DÂN</strong>
                    <em>Citizen Identity Card</em>
                  </div>
                  <span className="cccd-sample-photo" />
                  <div className="cccd-sample-lines">
                    <span>Số / No.</span>
                    <span>Họ và tên / Full name</span>
                    <span>Ngày sinh / Date of birth</span>
                    <span>Giới tính / Sex &nbsp;&nbsp;&nbsp; Quốc tịch / Nationality</span>
                    <span>Quê quán / Place of origin</span>
                    <span>Nơi thường trú / Place of residence</span>
                  </div>
                  <span className="cccd-sample-chip" />
                </div>
                <div className="cccd-sample-hint">Chụp hoặc tải lên mặt trước CCCD</div>
              </>
            ) : null}
            {previewImage ? <img src={previewImage} alt="Ảnh CCCD đã chụp" /> : null}
            <div className="scan-overlay" aria-hidden="true">
              <div className="cccd-frame">
                <span className="frame-corner frame-corner-top-left" />
                <span className="frame-corner frame-corner-top-right" />
                <span className="frame-corner frame-corner-bottom-left" />
                <span className="frame-corner frame-corner-bottom-right" />
                <span className="scan-line" />
                <span className="cccd-card-guide" />
              </div>
            </div>
          </div>

          <div className={`scan-status scan-status-${status}`}>
            <span className="scan-status-dot" aria-hidden="true" />
            <div>
              <strong>{isAnalyzing ? "Đang kiểm tra CCCD" : statusText[status]}</strong>
              <span>
                {cameraError ||
                  (isAnalyzing
                    ? "Đang kiểm tra tỉ lệ thẻ, vùng QR và bố cục căn cước."
                    : statusHelp[status])}
              </span>
            </div>
          </div>

          <div className="identity-actions">
            <Button disabled={isAnalyzing} onClick={handleCapture} type="button">
              Chụp CCCD
            </Button>
            <label className="btn btn-secondary identity-upload-button">
              Tải ảnh lên
              <input accept="image/*" onChange={handleUpload} type="file" />
            </label>
            <Button
              disabled={isAnalyzing || status !== "valid"}
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
