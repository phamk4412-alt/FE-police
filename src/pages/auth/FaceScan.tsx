import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import {
  getIdentityVerificationState,
  saveIdentityVerificationState,
} from "../../utils/identityVerification";

function FaceScan() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanReady, setScanReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

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
        window.setTimeout(() => {
          if (isMounted) {
            setScanReady(true);
          }
        }, 1200);
      } catch {
        if (isMounted) {
          setCameraError("Không thể mở camera. Bạn có thể bỏ qua bước demo này.");
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

  if (!identityState.cccdVerified) {
    return <Navigate to="/verify-cccd" replace />;
  }

  if (identityState.faceScanned) {
    return <Navigate to="/select-role" replace />;
  }

  const currentUserId = user.id;

  function continueToRole(skipped: boolean) {
    saveIdentityVerificationState(currentUserId, {
      faceScanned: true,
      faceSkipped: skipped,
    });
    navigate("/select-role", { replace: true });
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
          <div className="scan-preview face-preview">
            <video ref={videoRef} autoPlay muted playsInline />
            <div className="scan-overlay" aria-hidden="true">
              <div className="face-frame">
                <span className="face-ring" />
                <span className="scan-line" />
              </div>
            </div>
          </div>

          <div className={`scan-status ${scanReady ? "scan-status-valid" : "scan-status-idle"}`}>
            <span className="scan-status-dot" aria-hidden="true" />
            <div>
              <strong>{scanReady ? "Đã nhận khuôn mặt trong khung" : "Đang mở camera"}</strong>
              <span>{cameraError || "Giữ khuôn mặt ở giữa khung quét."}</span>
            </div>
          </div>

          <div className="identity-actions identity-actions-face">
            <Button
              disabled={!cameraReady || !scanReady}
              onClick={() => continueToRole(false)}
              type="button"
            >
              Tiếp tục
            </Button>
            <Button onClick={() => continueToRole(true)} type="button" variant="ghost">
              Bỏ qua
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default FaceScan;
