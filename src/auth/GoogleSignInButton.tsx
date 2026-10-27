import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, isNativeApp, signInWithNativeGoogle } from "./nativeGoogle";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  googleScriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      googleScriptPromise = null;
      reject(new Error("Không tải được Google Sign-In."));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

const BUTTON_LABELS: Record<NonNullable<GoogleSignInButtonProps["text"]>, string> = {
  continue_with: "Tiếp tục với Google",
  signin_with: "Đăng nhập bằng Google",
  signup_with: "Đăng ký bằng Google",
};

function GoogleSignInButton(props: GoogleSignInButtonProps) {
  return isNativeApp() ? <NativeGoogleSignInButton {...props} /> : <WebGoogleSignInButton {...props} />;
}

// Google blocks its web sign-in inside app WebViews, so the app uses the native Google sheet instead.
function NativeGoogleSignInButton({ onCredential, text = "continue_with" }: GoogleSignInButtonProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setIsSigningIn(true);
    setError("");
    try {
      const credential = await signInWithNativeGoogle();
      if (credential) {
        onCredential(credential);
      }
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Không đăng nhập được bằng Google.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <>
      <button className="google-signin-native" disabled={isSigningIn} onClick={handleClick} type="button">
        <svg aria-hidden="true" height="18" viewBox="0 0 48 48" width="18">
          <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" fill="#FFC107" />
          <path d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00" />
          <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" fill="#4CAF50" />
          <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" fill="#1976D2" />
        </svg>
        <span>{isSigningIn ? "Đang mở Google..." : BUTTON_LABELS[text]}</span>
      </button>
      {error ? <p className="auth-error">{error}</p> : null}
    </>
  );
}

function WebGoogleSignInButton({ onCredential, text = "continue_with" }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const [loadError, setLoadError] = useState("");
  const clientId = GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let isActive = true;
    loadGoogleScript()
      .then(() => {
        const container = containerRef.current;
        if (!isActive || !container || !window.google) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current(response.credential);
            }
          },
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(container, {
          locale: "vi",
          shape: "rectangular",
          size: "large",
          text,
          theme: "filled_black",
          width: Math.min(container.clientWidth || 360, 400),
        });
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(error instanceof Error ? error.message : "Không tải được Google Sign-In.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [clientId, text]);

  if (!clientId) {
    return <p className="auth-error">Thiếu cấu hình VITE_GOOGLE_CLIENT_ID.</p>;
  }

  return (
    <>
      <div className="google-signin-button" ref={containerRef} />
      {loadError ? <p className="auth-error">{loadError}</p> : null}
    </>
  );
}

export default GoogleSignInButton;
