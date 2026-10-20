import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import GoogleSignInButton from "../../auth/GoogleSignInButton";
import useIdentityVerificationState from "../../hooks/useIdentityVerificationState";
import AdminIcon from "../../components/admin/AdminIcons";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { APP_NAME, ROLE_HOME_PATHS } from "../../utils/constants";

function Login() {
  const { isLoaded, isSignedIn, signInWithGoogle, user } = useAuth();
  const { isLoading: isIdentityLoading, requiredIdentityStep } = useIdentityVerificationState(
    isLoaded && isSignedIn,
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  async function handleCredential(credential: string) {
    setIsSigningIn(true);
    setSignInError("");

    try {
      await signInWithGoogle(credential);
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSigningIn(false);
    }
  }

  if (!isLoaded || (isSignedIn && isIdentityLoading)) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (isSignedIn && user) {
    return <Navigate to={requiredIdentityStep || ROLE_HOME_PATHS[user.role]} replace />;
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
            <span>Xác minh danh tính, phân quyền theo vai trò</span>
          </li>
        </ul>
      </section>

      <section className="login-card google-login-card">
        <div className="section-heading">
          <h2>Đăng nhập</h2>
          <p className="login-card-subtitle">Chào mừng trở lại. Đăng nhập để tiếp tục.</p>
        </div>

        <GoogleSignInButton onCredential={(credential) => void handleCredential(credential)} />
        {isSigningIn ? <p className="login-card-subtitle">Đang đăng nhập...</p> : null}
        {signInError ? <p className="auth-error">{signInError}</p> : null}
        <p className="login-card-subtitle">
          Tài khoản mới được tạo tự động với vai trò người dân. Quản trị viên sẽ cấp vai trò khác nếu cần.
        </p>
      </section>
    </main>
  );
}

export default Login;
