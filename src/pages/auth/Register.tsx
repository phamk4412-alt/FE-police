import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import GoogleSignInButton from "../../auth/GoogleSignInButton";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { APP_NAME } from "../../utils/constants";

const MIN_PASSWORD_LENGTH = 8;

function Register() {
  const { isLoaded, isSignedIn, register, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function runSignUp(action: () => Promise<unknown>) {
    setIsSubmitting(true);
    setFormError("");

    try {
      await action();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không tạo được tài khoản. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Mật khẩu nhập lại không khớp.");
      return;
    }

    void runSignUp(() => register(displayName.trim(), email.trim(), password));
  }

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  // EntryRedirect sends the new account through identity verification and on to its dashboard.
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <VietnameseDecor variant="auth" />
      <section className="login-hero">
        <p className="eyebrow">Dự án Cảnh sát</p>
        <h1>{APP_NAME}</h1>
        <p className="login-hero-lead">
          Tạo tài khoản người dân để gửi báo cáo sự cố và theo dõi tình hình an ninh quanh bạn.
        </p>
      </section>

      <section className="login-card google-login-card">
        <div className="section-heading">
          <h2>Tạo tài khoản</h2>
          <p className="login-card-subtitle">Tài khoản mới có vai trò người dân. Quản trị viên sẽ cấp vai trò khác nếu cần.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field" htmlFor="register-name">
            <span>Họ và tên</span>
            <input
              autoComplete="name"
              id="register-name"
              maxLength={160}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              value={displayName}
            />
          </label>
          <label className="field" htmlFor="register-email">
            <span>Email</span>
            <input
              autoComplete="email"
              id="register-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="field" htmlFor="register-password">
            <span>Mật khẩu</span>
            <input
              autoComplete="new-password"
              id="register-password"
              minLength={MIN_PASSWORD_LENGTH}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <label className="field" htmlFor="register-confirm-password">
            <span>Nhập lại mật khẩu</span>
            <input
              autoComplete="new-password"
              id="register-confirm-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>
        </form>
        {formError ? <p className="auth-error">{formError}</p> : null}

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        <GoogleSignInButton
          onCredential={(credential) => void runSignUp(() => signInWithGoogle(credential))}
          text="signup_with"
        />

        <p className="auth-secondary-action">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
