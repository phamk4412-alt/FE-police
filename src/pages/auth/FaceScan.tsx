import { useCallback, useEffect, useMemo, useState } from "react";
import type { SyntheticEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import useIdentityVerificationState from "../../hooks/useIdentityVerificationState";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { apiFetch } from "../../services/api";
import {
  resetIdentityVerificationState,
  saveFaceVerificationState,
} from "../../utils/identityVerification";

interface DiditSessionResponse {
  SessionId: string;
  Url: string;
}

interface DiditDecisionResponse {
  SessionId: string;
  Status: string;
  IsApproved: boolean;
  Detail?: string;
}

type DiditStatusTone = "idle" | "loading" | "success" | "danger";

interface EmbeddedDiditSession {
  sessionId: string;
  url: string;
}

function resolveDiditSessionId(searchParams: URLSearchParams) {
  return (
    searchParams.get("verificationSessionId") ||
    searchParams.get("session_id") ||
    searchParams.get("sessionId") ||
    searchParams.get("id") ||
    ""
  );
}

function FaceScan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const {
    identityState,
    isLoading: isIdentityLoading,
    refreshIdentityState,
  } = useIdentityVerificationState(isLoaded && isSignedIn);
  const [statusTone, setStatusTone] = useState<DiditStatusTone>("idle");
  const [statusMessage, setStatusMessage] = useState("Dùng Didit để quét mặt và xác minh sinh trắc học.");
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [embeddedDiditSession, setEmbeddedDiditSession] = useState<EmbeddedDiditSession | null>(null);
  const diditSessionId = useMemo(() => resolveDiditSessionId(searchParams), [searchParams]);

  const completeDiditSession = useCallback(async (sessionId: string) => {
    if (!sessionId || isCompleting) {
      return;
    }

    setIsCompleting(true);
    setStatusTone("loading");
    setStatusMessage("Đang kiểm tra kết quả xác minh từ Didit...");

    try {
      const result = await apiFetch<DiditDecisionResponse>(
        `/api/identity/didit/session/${encodeURIComponent(sessionId)}/complete`,
        { method: "POST" },
      );

      if (!result.IsApproved) {
        setStatusTone("danger");
        setStatusMessage(`Didit chưa xác minh thành công (${result.Status}). Vui lòng thử lại.`);
        return;
      }

      await refreshIdentityState();
      setStatusTone("success");
      setStatusMessage("Didit đã xác minh khuôn mặt thành công.");
      navigate("/select-role", { replace: true });
    } catch (error) {
      setStatusTone("danger");
      setStatusMessage(error instanceof Error ? error.message : "Không thể đọc kết quả Didit.");
    } finally {
      setIsCompleting(false);
      setIsStarting(false);
    }
  }, [isCompleting, navigate, refreshIdentityState]);

  useEffect(() => {
    if (!diditSessionId || !isSignedIn || identityState.FaceScanned || isCompleting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void completeDiditSession(diditSessionId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [completeDiditSession, diditSessionId, identityState.FaceScanned, isCompleting, isSignedIn]);

  if (!isLoaded || isIdentityLoading) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!identityState.CccdVerified) {
    return <Navigate to="/verify-cccd" replace />;
  }

  if (identityState.FaceScanned) {
    return <Navigate to="/select-role" replace />;
  }

  async function startDiditVerification() {
    setIsStarting(true);
    setStatusTone("loading");
    setStatusMessage("Đang tạo phiên xác minh Didit...");

    try {
      const callbackUrl = `${window.location.origin}/face-scan`;
      const session = await apiFetch<DiditSessionResponse>("/api/identity/didit/session", {
        method: "POST",
        body: JSON.stringify({ CallbackUrl: callbackUrl }),
      });

      setEmbeddedDiditSession({
        sessionId: session.SessionId,
        url: session.Url,
      });
      setStatusMessage("Hoàn tất xác minh ngay trong khung Didit bên dưới.");
    } catch (error) {
      setIsStarting(false);
      setStatusTone("danger");
      setStatusMessage(error instanceof Error ? error.message : "Không thể tạo phiên Didit.");
    }
  }

  function closeEmbeddedDiditSession() {
    setEmbeddedDiditSession(null);
    setIsStarting(false);
    setIsCompleting(false);
    setStatusTone("idle");
    setStatusMessage("Dùng Didit để quét mặt và xác minh sinh trắc học.");
  }

  function handleDiditFrameLoad(event: SyntheticEvent<HTMLIFrameElement>) {
    if (!embeddedDiditSession || isCompleting) {
      return;
    }

    try {
      const frameUrl = event.currentTarget.contentWindow?.location.href;
      if (!frameUrl || !frameUrl.startsWith(window.location.origin)) {
        return;
      }

      const callbackSessionId = resolveDiditSessionId(new URL(frameUrl).searchParams) || embeddedDiditSession.sessionId;
      void completeDiditSession(callbackSessionId);
    } catch {
      // Cross-origin Didit pages are expected while the user is still verifying.
    }
  }

  async function returnToCccd() {
    await resetIdentityVerificationState();
    navigate("/verify-cccd", { replace: true });
  }

  async function skipFaceScan() {
    await saveFaceVerificationState({
      FaceImage: undefined,
      FaceScanned: true,
      FaceSkipped: true,
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
          <p>Xác minh khuôn mặt bằng Didit</p>
          <div className="identity-progress" aria-label="Tiến trình xác thực">
            <span>CCCD</span>
            <span className="is-active">Quét mặt</span>
            <span>Vai trò</span>
          </div>
        </div>

        <section className="identity-panel" aria-label="Quét khuôn mặt bằng Didit">
          <div className="face-scan-layout didit-scan-layout">
            <aside className="cccd-reference-panel" aria-label="Ảnh trên CCCD">
              <h2>Ảnh trên CCCD</h2>
              <div className="cccd-reference-thumb">
                {identityState.CccdImage ? (
                  <img src={identityState.CccdImage} alt="Ảnh CCCD đã lưu" />
                ) : (
                  <div className="cccd-reference-placeholder">
                    <span>Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <p>Didit sẽ mở luồng xác minh sinh trắc học bảo mật.</p>
            </aside>

            <div className="didit-verification-panel">
              {embeddedDiditSession ? (
                <div className="didit-embed-shell">
                  <div className="didit-embed-toolbar">
                    <strong>Didit Face Verification</strong>
                    <Button
                      disabled={isCompleting}
                      onClick={closeEmbeddedDiditSession}
                      type="button"
                      variant="ghost"
                    >
                      Đóng
                    </Button>
                  </div>
                  <iframe
                    allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
                    className="didit-embed-frame"
                    onLoad={handleDiditFrameLoad}
                    src={embeddedDiditSession.url}
                    title="Didit Face Verification"
                  />
                </div>
              ) : (
                <>
                  <div className={`didit-verification-mark didit-verification-${statusTone}`}>
                    <span />
                  </div>
                  <div className="didit-verification-copy">
                    <h2>Didit Face Verification</h2>
                    <p>{statusMessage}</p>
                  </div>
                  <Button
                    disabled={isStarting || isCompleting}
                    onClick={() => void startDiditVerification()}
                    type="button"
                  >
                    {isStarting || isCompleting ? "Đang xử lý..." : "Bắt đầu quét mặt"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div
            className={`scan-status ${
              statusTone === "danger"
                ? "scan-status-invalid"
                : statusTone === "success"
                  ? "scan-status-valid"
                  : "scan-status-idle"
            }`}
          >
            <span className="scan-status-dot" aria-hidden="true" />
            <div>
              <strong>
                {statusTone === "success"
                  ? "Xác thực Didit thành công"
                  : statusTone === "danger"
                    ? "Didit chưa xác minh thành công"
                    : statusTone === "loading"
                      ? "Đang xử lý Didit"
                      : "Sẵn sàng quét mặt bằng Didit"}
              </strong>
              <span>{statusMessage}</span>
            </div>
          </div>

          <div className="identity-actions identity-actions-face">
            <Button disabled type="button">
              Tiếp tục
            </Button>
            <Button onClick={() => void returnToCccd()} type="button" variant="secondary">
              Quay lại CCCD
            </Button>
            <Button onClick={() => void skipFaceScan()} type="button" variant="ghost">
              Bỏ qua
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default FaceScan;
