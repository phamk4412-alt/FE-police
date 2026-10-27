import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AppleSignInButton from "../../auth/AppleSignInButton";
import GoogleSignInButton from "../../auth/GoogleSignInButton";
import LegalLinks from "../legal/LegalLinks";
import AdminIcon from "../../components/admin/AdminIcons";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { APP_NAME, ROLE_HOME_PATHS } from "../../utils/constants";

function Login() {
  const { isLoaded, isSignedIn, signInWithApple, signInWithGoogle, signInWithPassword, user } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function runSignIn(action: () => Promise<unknown>) {
    setIsSigningIn(true);
    setSignInError("");

    try {
      await action();
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSigningIn(false);
    }
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSignIn(() => signInWithPassword(email.trim(), password));
  }

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (isSignedIn && user) {
    return <Navigate to={ROLE_HOME_PATHS[user.role]} replace />;
  }

  return (
    <main className="login-page">
      <VietnameseDecor variant="auth" />
      <section className="login-hero">
        <p className="eyebrow">Dự án Cảnh sát</p>
        <h1>{APP_NAME}</h1>
        <p className="login-hero-lead">
          Tiếp nhận báo cáo, điều phối lực lượng và theo dõi tình hình an ninh TP.HCM trên một nền tảng duy nhất.
        </p>
        <ul className="login-feature-list">
          <li>
            <AdminIcon name="alert" />
            <span>Báo cáo sự cố kèm vị trí và hình ảnh</span>
          </li>
          <li>
            <AdminIcon name="map" />
            <span>Bản đồ vụ việc và lực lượng theo thời gian thực</span>
          </li>
          <li>
            <AdminIcon name="shield" />
            <span>Phân quyền rõ ràng theo vai trò</span>
          </li>
        </ul>
      </section>

      <section className="login-card google-login-card">
        <div className="section-heading">
          <h2>Đăng nhập</h2>
          <p className="login-card-subtitle">Chào mừng trở lại. Đăng nhập để tiếp tục.</p>
        </div>

        <form className="auth-form" onSubmit={handlePasswordSubmit}>
          <label className="field" htmlFor="login-email">
            <span>Email</span>
            <input
              autoComplete="email"
              id="login-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="field" htmlFor="login-password">
            <span>Mật khẩu</span>
            <input
              autoComplete="current-password"
              id="login-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <Button disabled={isSigningIn} type="submit">
            {isSigningIn ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
        {signInError ? <p className="auth-error">{signInError}</p> : null}

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        <AppleSignInButton
          onCredential={({ displayName, identityToken }) =>
            void runSignIn(() => signInWithApple(identityToken, displayName))
          }
        />

        <GoogleSignInButton
          onCredential={(credential) => void runSignIn(() => signInWithGoogle(credential))}
        />

        <p className="auth-secondary-action">
          Chưa có tài khoản? <Link to="/sign-up">Tạo tài khoản</Link>
        </p>

        <LegalLinks />
      </section>
    </main>
  );
}

export default Login;
