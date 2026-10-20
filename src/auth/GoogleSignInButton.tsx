import { useEffect, useRef, useState } from "react";

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

function GoogleSignInButton({ onCredential, text = "continue_with" }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const [loadError, setLoadError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
