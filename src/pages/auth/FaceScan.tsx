import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import {
  getIdentityVerificationState,
  saveIdentityVerificationState,
} from "../../utils/identityVerification";

type FaceScanTone = "idle" | "warning" | "danger" | "scanning" | "verifying" | "success";

type FaceIssue =
  | "none"
  | "no-face"
  | "off-center"
  | "too-close"
  | "too-far"
  | "turned"
  | "too-dark"
  | "multiple";

interface FaceAnalysisResult {
  issue: FaceIssue;
  message: string;
  tone: FaceScanTone;
}

interface FaceSignature {
  brightness: number;
  centerX: number;
  centerY: number;
  faceHeightRatio: number;
  faceWidthRatio: number;
  red: number;
  green: number;
  blue: number;
  skinRatio: number;
}

const analysisWidth = 180;
const analysisHeight = 135;
const faceMatchThreshold = 62;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSkinScore(red: number, green: number, blue: number) {
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const chroma = maxChannel - minChannel;

  if (
    red > 58 &&
    green > 38 &&
    blue > 24 &&
    red > blue + 10 &&
    red >= green - 8 &&
    chroma > 18 &&
    maxChannel < 248
  ) {
    return 1;
  }

  return 0;
}

function getFaceSignatureFromCanvas(
  canvas: HTMLCanvasElement,
  options: { ovalOnly?: boolean } = {},
): FaceSignature | null {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context || !canvas.width || !canvas.height) {
    return null;
  }

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let skinPixels = 0;
  let sampledPixels = 0;
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let brightnessTotal = 0;
  let minX = canvas.width;
  let maxX = 0;
  let minY = canvas.height;
  let maxY = 0;
  let centerTotalX = 0;
  let centerTotalY = 0;

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      if (options.ovalOnly) {
        const normalizedX = (x - canvas.width / 2) / (canvas.width * 0.32);
        const normalizedY = (y - canvas.height / 2) / (canvas.height * 0.42);

        if (normalizedX * normalizedX + normalizedY * normalizedY > 1.15) {
          continue;
        }
      }

      const offset = (y * canvas.width + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
      const isSkin = getSkinScore(red, green, blue);

      sampledPixels += 1;

      if (!isSkin) {
        continue;
      }

      skinPixels += 1;
      redTotal += red;
      greenTotal += green;
      blueTotal += blue;
      brightnessTotal += brightness;
      centerTotalX += x;
      centerTotalY += y;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  if (skinPixels < Math.max(12, sampledPixels * 0.025)) {
    return null;
  }

  return {
    brightness: brightnessTotal / skinPixels,
    centerX: centerTotalX / skinPixels / canvas.width,
    centerY: centerTotalY / skinPixels / canvas.height,
    faceHeightRatio: (maxY - minY) / canvas.height,
    faceWidthRatio: (maxX - minX) / canvas.width,
    red: redTotal / skinPixels,
    green: greenTotal / skinPixels,
    blue: blueTotal / skinPixels,
    skinRatio: skinPixels / Math.max(1, sampledPixels),
  };
}

function compareFaceSignatures(cccdFace: FaceSignature, liveFace: FaceSignature) {
  const colorDistance =
    Math.abs(cccdFace.red - liveFace.red) * 0.32 +
    Math.abs(cccdFace.green - liveFace.green) * 0.32 +
    Math.abs(cccdFace.blue - liveFace.blue) * 0.32;
  const brightnessDistance = Math.abs(cccdFace.brightness - liveFace.brightness) * 0.22;
  const shapeDistance =
    Math.abs(cccdFace.faceWidthRatio - liveFace.faceWidthRatio) * 55 +
    Math.abs(cccdFace.faceHeightRatio - liveFace.faceHeightRatio) * 45;
  const centerPenalty =
    Math.max(0, Math.abs(liveFace.centerX - 0.5) - 0.08) * 90 +
    Math.max(0, Math.abs(liveFace.centerY - 0.5) - 0.12) * 70;
  const skinPenalty = Math.abs(cccdFace.skinRatio - liveFace.skinRatio) * 28;

  return clampScore(100 - colorDistance - brightnessDistance - shapeDistance - centerPenalty - skinPenalty);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function getCccdFaceSignature(cccdImage: string) {
  const image = await loadImage(cccdImage);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = 180;
  canvas.height = 240;

  if (!context) {
    return null;
  }

  context.drawImage(
    image,
    image.naturalWidth * 0.05,
    image.naturalHeight * 0.28,
    image.naturalWidth * 0.28,
    image.naturalHeight * 0.58,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return getFaceSignatureFromCanvas(canvas);
}

function analyzeFaceFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): FaceAnalysisResult {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context || !video.videoWidth || !video.videoHeight) {
    return {
      issue: "no-face",
      message: "Không phát hiện khuôn mặt",
      tone: "idle",
    };
  }

  canvas.width = analysisWidth;
  canvas.height = analysisHeight;
  context.drawImage(video, 0, 0, analysisWidth, analysisHeight);

  const { data } = context.getImageData(0, 0, analysisWidth, analysisHeight);
  let skinPixels = 0;
  let ovalPixels = 0;
  let brightnessTotal = 0;
  let leftSkin = 0;
  let rightSkin = 0;
  let minX = analysisWidth;
  let maxX = 0;
  let minY = analysisHeight;
  let maxY = 0;
  let centerTotalX = 0;
  let centerTotalY = 0;

  for (let y = 0; y < analysisHeight; y += 2) {
    for (let x = 0; x < analysisWidth; x += 2) {
      const normalizedX = (x - analysisWidth / 2) / (analysisWidth * 0.29);
      const normalizedY = (y - analysisHeight / 2) / (analysisHeight * 0.39);

      if (normalizedX * normalizedX + normalizedY * normalizedY > 1.2) {
        continue;
      }

      const offset = (y * analysisWidth + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
      const skinScore = getSkinScore(red, green, blue);

      brightnessTotal += brightness;
      ovalPixels += 1;

      if (skinScore) {
        skinPixels += 1;
        centerTotalX += x;
        centerTotalY += y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        if (x < analysisWidth / 2) {
          leftSkin += 1;
        } else {
          rightSkin += 1;
        }
      }
    }
  }

  const skinRatio = skinPixels / Math.max(1, ovalPixels);
  const brightness = brightnessTotal / Math.max(1, ovalPixels);

  if (skinRatio < 0.035) {
    return {
      issue: "no-face",
      message: "Không phát hiện khuôn mặt",
      tone: "idle",
    };
  }

  const centerX = centerTotalX / Math.max(1, skinPixels);
  const centerY = centerTotalY / Math.max(1, skinPixels);
  const centerOffsetX = Math.abs(centerX / analysisWidth - 0.5);
  const centerOffsetY = Math.abs(centerY / analysisHeight - 0.52);
  const faceWidthRatio = (maxX - minX) / analysisWidth;
  const faceHeightRatio = (maxY - minY) / analysisHeight;
  const sideBalance =
    Math.abs(leftSkin - rightSkin) / Math.max(1, Math.max(leftSkin, rightSkin));

  const isCenteredInOval = centerOffsetX <= 0.14 && centerOffsetY <= 0.16;
  const clearlyOverfillsOval =
    faceWidthRatio > 0.72 || faceHeightRatio > 0.88 || (faceWidthRatio > 0.66 && faceHeightRatio > 0.8);

  if (clearlyOverfillsOval && !isCenteredInOval) {
    return {
      issue: "too-close",
      message: "Đưa mặt ra xa",
      tone: "warning",
    };
  }

  if (skinRatio < 0.055 || faceWidthRatio < 0.14 || faceHeightRatio < 0.18) {
    return {
      issue: "too-far",
      message: "Đưa mặt lại gần",
      tone: "warning",
    };
  }

  if (centerOffsetX > 0.16 || centerOffsetY > 0.18) {
    return {
      issue: "off-center",
      message: "Đưa khuôn mặt vào giữa khung",
      tone: "warning",
    };
  }

  if (sideBalance > 0.78 && !isCenteredInOval) {
    return {
      issue: "turned",
      message: "Hãy giữ khuôn mặt thẳng",
      tone: "warning",
    };
  }

  if (brightness < 46) {
    return {
      issue: "too-dark",
      message: "Giữ khuôn mặt đủ sáng",
      tone: "warning",
    };
  }

  if (skinRatio > 0.28 && faceWidthRatio > 0.5 && sideBalance < 0.16) {
    return {
      issue: "multiple",
      message: "Đưa một khuôn mặt vào giữa khung",
      tone: "danger",
    };
  }

  return {
    issue: "none",
    message: "Đang đối chiếu khuôn mặt...",
    tone: "scanning",
  };
}

function FaceScan() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = user?.id;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scoreRef = useRef(0);
  const stableFramesRef = useRef(0);
  const hadStrongSignalRef = useRef(false);
  const lastIssueRef = useRef<FaceIssue>("no-face");
  const repeatedIssueFramesRef = useRef(0);
  const verificationStartedRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanReady, setScanReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [matchScore, setMatchScore] = useState(0);
  const [scanTone, setScanTone] = useState<FaceScanTone>("idle");
  const [scanMessage, setScanMessage] = useState("Không phát hiện khuôn mặt");
  const [capturedFaceImage, setCapturedFaceImage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!isSignedIn) {
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Thiết bị không hỗ trợ mở camera trong trình duyệt này.");
        setCameraReady(false);
        setScanReady(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 960 },
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
        setScanMessage("Đưa khuôn mặt vào giữa khung");
        setScanTone("idle");
      } catch {
        if (isMounted) {
          setCameraReady(false);
          setScanReady(false);
          setCameraError("Không thể mở camera");
          setScanTone("danger");
          setScanMessage("Không thể mở camera");
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

  useEffect(() => {
    scoreRef.current = matchScore;
  }, [matchScore]);

  async function captureAndVerifyFace() {
    const video = videoRef.current;

    if (!video || verificationStartedRef.current || !currentUserId) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(640, video.videoWidth || 640);
    canvas.height = Math.round(canvas.width * ((video.videoHeight || 480) / (video.videoWidth || 640)));
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const faceImage = canvas.toDataURL("image/jpeg", 0.84);
    const identityState = getIdentityVerificationState(currentUserId);

    verificationStartedRef.current = true;
    setCapturedFaceImage(faceImage);
    setIsVerifying(true);
    setScanTone("verifying");
    setScanMessage("Đang so khớp với ảnh trên CCCD...");

    try {
      if (!identityState.cccdImage) {
        throw new Error("Missing CCCD image");
      }

      const cccdFaceSignature = await getCccdFaceSignature(identityState.cccdImage);
      const liveFaceSignature = getFaceSignatureFromCanvas(canvas, { ovalOnly: true });

      if (!cccdFaceSignature || !liveFaceSignature) {
        throw new Error("Cannot read face signature");
      }

      const faceMatchScore = compareFaceSignatures(cccdFaceSignature, liveFaceSignature);
      setMatchScore(faceMatchScore);

      if (faceMatchScore < faceMatchThreshold) {
        verificationStartedRef.current = false;
        stableFramesRef.current = 0;
        hadStrongSignalRef.current = false;
        setCapturedFaceImage("");
        setIsVerifying(false);
        setScanTone("danger");
        setScanReady(false);
        setScanMessage("Khuôn mặt không khớp với ảnh trên CCCD");
        return;
      }

      saveIdentityVerificationState(currentUserId, {
        faceImage,
      });
      setMatchScore((currentScore) => Math.max(currentScore, faceMatchScore));
      setScanReady(true);
      setIsVerifying(false);
      setScanTone("success");
      setScanMessage("Khuôn mặt khớp với CCCD");
    } catch {
      verificationStartedRef.current = false;
      stableFramesRef.current = 0;
      setCapturedFaceImage("");
      setIsVerifying(false);
      setScanTone("danger");
      setScanReady(false);
      setScanMessage("Không thể đọc ảnh khuôn mặt trên CCCD");
    }
  }

  useEffect(() => {
    if (!cameraReady || cameraError || scanReady || isVerifying) {
      return undefined;
    }

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
    }

    const intervalId = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;

      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      const analysis = analyzeFaceFrame(video, canvas);
      if (analysis.issue === lastIssueRef.current) {
        repeatedIssueFramesRef.current += 1;
      } else {
        lastIssueRef.current = analysis.issue;
        repeatedIssueFramesRef.current = 1;
      }

      const isTransientDistanceWarning =
        (analysis.issue === "too-close" || analysis.issue === "too-far" || analysis.issue === "turned") &&
        repeatedIssueFramesRef.current < 3;
      const effectiveAnalysis = isTransientDistanceWarning
        ? ({
            issue: "none",
            message: "Đang đối chiếu khuôn mặt...",
            tone: "scanning",
          } satisfies FaceAnalysisResult)
        : analysis;
      const isStable = effectiveAnalysis.issue === "none";
      const previousScore = scoreRef.current;
      const nextScore = clampScore(previousScore + (isStable ? 7 : -8));

      stableFramesRef.current = isStable ? stableFramesRef.current + 1 : 0;

      if (nextScore > 56) {
        hadStrongSignalRef.current = true;
      }

      if (!isStable && hadStrongSignalRef.current && nextScore < 45) {
        setScanMessage("Khuôn mặt không khớp với CCCD");
        setScanTone("danger");
      } else {
        setScanMessage(effectiveAnalysis.message);
        setScanTone(effectiveAnalysis.tone);
      }

      setMatchScore(nextScore);

      if (stableFramesRef.current >= 5 && nextScore >= 85) {
        void captureAndVerifyFace();
      }
    }, 360);

    return () => window.clearInterval(intervalId);
  }, [cameraError, cameraReady, isVerifying, scanReady]);

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user || !currentUserId) {
    return <Navigate to="/login" replace />;
  }

  const verifiedUserId = user.id;
  const identityState = getIdentityVerificationState(verifiedUserId);

  if (!identityState.cccdVerified) {
    return <Navigate to="/verify-cccd" replace />;
  }

  if (identityState.faceScanned) {
    return <Navigate to="/select-role" replace />;
  }

  const canContinue = scanReady;
  const scoreTone =
    scanTone === "success" || matchScore >= 85
      ? "high"
      : scanTone === "danger" || matchScore < 45
        ? "low"
        : "medium";

  function continueToRole(skipped: boolean) {
    saveIdentityVerificationState(verifiedUserId, {
      faceImage: skipped ? undefined : capturedFaceImage || identityState.faceImage,
      faceScanned: true,
      faceSkipped: skipped,
    });
    navigate("/select-role", { replace: true });
  }

  function returnToCccd() {
    saveIdentityVerificationState(verifiedUserId, {
      cccdImage: undefined,
      cccdSkipped: false,
      cccdVerified: false,
      faceImage: undefined,
      faceScanned: false,
      faceSkipped: false,
    });
    navigate("/verify-cccd", { replace: true });
  }

  return (
    <main className="identity-page">
      <VietnameseDecor variant="auth" />
      <section className="identity-shell">
        <div className="identity-copy">
          <span className="eyebrow">Xác thực demo</span>
          <h1>Quét khuôn mặt</h1>
          <p>Đưa khuôn mặt vào giữa khung</p>
          <div className="identity-progress" aria-label="Tiến trình xác thực">
            <span>CCCD</span>
            <span className="is-active">Quét mặt</span>
            <span>Vai trò</span>
          </div>
        </div>

        <section className="identity-panel" aria-label="Quét khuôn mặt">
          <div className="face-scan-layout">
            <aside className="cccd-reference-panel" aria-label="Ảnh trên CCCD">
              <h2>Ảnh trên CCCD</h2>
              <div className="cccd-reference-thumb">
                {identityState.cccdImage ? (
                  <img src={identityState.cccdImage} alt="Ảnh CCCD đã lưu" />
                ) : (
                  <div className="cccd-reference-placeholder">
                    <span>Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <p>So sánh khuôn mặt hiện tại với ảnh trên CCCD</p>
            </aside>

            <div className="face-camera-column">
              <div className={`scan-preview face-preview face-preview-${scanTone}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={capturedFaceImage ? "is-muted" : ""}
                />
                {capturedFaceImage ? (
                  <img
                    className="face-capture-image"
                    src={capturedFaceImage}
                    alt="Ảnh khuôn mặt vừa chụp"
                  />
                ) : null}
                <div className="scan-overlay" aria-hidden="true">
                  <div className="face-frame">
                    <span className="face-ring" />
                    <span className="scan-line" />
                  </div>
                </div>
                {isVerifying ? <span className="face-verifying-badge">Đang xác minh...</span> : null}
              </div>

              <div className={`face-feedback face-feedback-${scanTone}`}>
                <div className="face-feedback-copy">
                  <strong>{cameraError || scanMessage}</strong>
                  <span>Giữ khuôn mặt ổn định trong khung oval để tăng độ khớp.</span>
                </div>
                <strong className={`face-match-score face-match-score-${scoreTone}`}>
                  {matchScore}%
                </strong>
                <div className="face-match-meter" aria-hidden="true">
                  <span
                    className={`face-match-meter-fill face-match-meter-${scoreTone}`}
                    style={{ width: `${matchScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`scan-status ${
              cameraError ? "scan-status-invalid" : scanReady ? "scan-status-valid" : "scan-status-idle"
            }`}
          >
            <span className="scan-status-dot" aria-hidden="true" />
            <div>
              <strong>
                {cameraError
                  ? "Không thể mở camera"
                  : scanReady
                    ? "Xác thực khuôn mặt thành công"
                    : isVerifying
                      ? "Đang xác minh..."
                      : "Đang quét khuôn mặt"}
              </strong>
              <span>
                {cameraError ||
                  "Đây là mô phỏng đối chiếu khuôn mặt bằng tín hiệu camera trên trình duyệt."}
              </span>
            </div>
          </div>

          <div className="identity-actions identity-actions-face">
            <Button
              disabled={!canContinue}
              onClick={() => continueToRole(false)}
              type="button"
            >
              Tiếp tục
            </Button>
            <Button onClick={returnToCccd} type="button" variant="secondary">
              Quay lại CCCD
            </Button>
            <Button disabled type="button" variant="ghost">
              Bỏ qua
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default FaceScan;
