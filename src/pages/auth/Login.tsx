import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import GoogleSignInButton from "../../auth/GoogleSignInButton";
import AdminIcon from "../../components/admin/AdminIcons";
import Button from "../../components/common/Button";
import PoliceMascot from "../../components/common/PoliceMascot";
import { APP_LOCATION, APP_MARK_URL, APP_NAME } from "../../utils/constants";
import "./login.css";

function Login() {
  const { isLoaded, isSignedIn, signInWithGoogle, signInWithPassword, user } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    return <Navigate to="/select-role" replace />;
  }

  return (
    <main className="login-screen">
      <div className="login-beacons" aria-hidden="true" />
      <header className="login-identity">
        <img src={APP_MARK_URL} alt="" width="54" height="54" />
        <div>
          <strong>{APP_NAME}</strong>
          <small>{APP_LOCATION}</small>
        </div>
      </header>

      <section className="login-intro" aria-labelledby="login-system-title">
        <p className="login-kicker">Nền tảng an ninh đô thị</p>
        <h1 id="login-system-title">Trung tâm Cảnh sát <span>thông minh</span></h1>
        <p className="login-lead">
          Tiếp nhận báo cáo, điều phối lực lượng và theo dõi tình hình an ninh TP.HCM trên một nền tảng duy nhất.
        </p>
        <ul className="login-highlights">
          <li>
            <span><AdminIcon name="camera" /></span>
            Tiếp nhận báo cáo sự cố kèm vị trí và hình ảnh.
          </li>
          <li>
            <span><AdminIcon name="map" /></span>
            Bản đồ vụ việc và lực lượng theo thời gian thực.
          </li>
          <li>
            <span><AdminIcon name="shield" /></span>
            Phân quyền rõ ràng theo vai trò.
          </li>
        </ul>
      </section>

      <div className="login-access">
        <section className="login-panel" aria-labelledby="login-form-title">
          <div className="login-panel-content">
            <img className="login-panel-mark" src={APP_MARK_URL} alt="" width="70" height="70" />
            <p className="login-kicker">Cổng truy cập hệ thống</p>
            <h2 id="login-form-title">Đăng nhập</h2>
            <p className="login-panel-subtitle">Sử dụng tài khoản của bạn để truy cập hệ thống.</p>

            <form className="login-form" onSubmit={handlePasswordSubmit} aria-busy={isSigningIn}>
              <div className="login-field">
                <label htmlFor="login-email">Email</label>
                <div className="login-input">
                  <AdminIcon name="mail" />
                  <input autoComplete="email" id="login-email" onChange={(event) => setEmail(event.target.value)}
                    placeholder="tenban@email.com" required type="email" value={email} />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="login-password">Mật khẩu</label>
                <div className="login-input">
                  <AdminIcon name="lock" />
                  <input autoComplete="current-password" id="login-password"
                    onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu"
                    required type={showPassword ? "text" : "password"} value={password} />
                  <button type="button" className="login-password-toggle" aria-controls="login-password"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((visible) => !visible)}>
                    <AdminIcon name={showPassword ? "viewOff" : "view"} />
                  </button>
                </div>
              </div>
              <Button className="login-submit" disabled={isSigningIn} type="submit">
                {isSigningIn ? "Đang đăng nhập..." : "Đăng nhập"}
                {isSigningIn ? <span className="login-spinner" aria-hidden="true" /> : <AdminIcon name="chevronRight" />}
              </Button>
            </form>
            {signInError ? <p className="login-error" role="alert"><AdminIcon name="alert" /> {signInError}</p> : null}

            <div className="login-divider">hoặc tiếp tục với</div>
            <div className="login-google" aria-busy={isSigningIn} inert={isSigningIn}>
              <GoogleSignInButton fitContainer text="signin_with"
                onCredential={(credential) => void runSignIn(() => signInWithGoogle(credential))} />
            </div>
            <p className="login-register">Chưa có tài khoản? <Link to="/sign-up">Tạo tài khoản</Link></p>
          </div>
          <div className="login-panel-footer"><AdminIcon name="lock" /> Truy cập theo quyền của tài khoản</div>
        </section>
        <div className="login-assistant"><PoliceMascot /></div>
      </div>

      <footer className="login-screen-footer">
        <div><span>Hệ thống điều hành hợp nhất</span><span>TP.HCM · Việt Nam</span></div>
        <small>© {new Date().getFullYear()} {APP_NAME} TP.HCM</small>
      </footer>
    </main>
  );
}

export default Login;
