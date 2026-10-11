import { SignIn, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
import useIdentityVerificationState from "../../hooks/useIdentityVerificationState";
import AdminIcon from "../../components/admin/AdminIcons";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { getClerkUserRole } from "../../utils/clerkRole";
import { APP_NAME, ROLE_HOME_PATHS } from "../../utils/constants";

function Login() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isLoading: isIdentityLoading, requiredIdentityStep } = useIdentityVerificationState(
    isLoaded && isSignedIn,
  );

  if (!isLoaded || (isSignedIn && isIdentityLoading)) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (isSignedIn) {
    const role = getClerkUserRole(user);

    return (
      <Navigate
        to={requiredIdentityStep || (role ? ROLE_HOME_PATHS[role] : "/select-role")}
        replace
      />
    );
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

      <section className="login-card clerk-login-card">
        <div className="section-heading">
          <h2>Đăng nhập</h2>
          <p className="login-card-subtitle">Chào mừng trở lại. Đăng nhập để tiếp tục.</p>
        </div>

        <SignIn fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
      </section>
    </main>
  );
}

export default Login;
