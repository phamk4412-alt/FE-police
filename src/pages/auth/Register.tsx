import { SignUp, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { getClerkUserRole } from "../../utils/clerkRole";
import { APP_NAME, ROLE_HOME_PATHS } from "../../utils/constants";

function Register() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (isSignedIn) {
    const role = getClerkUserRole(user);
    return <Navigate to={role ? ROLE_HOME_PATHS[role] : "/select-role"} replace />;
  }

  return (
    <main className="login-page">
      <VietnameseDecor variant="auth" />
      <section className="login-hero">
        <p className="eyebrow">Dự án Cảnh sát</p>
        <h1>{APP_NAME}</h1>
        <p>
          Tạo tài khoản để truy cập hệ thống theo vai trò được phân quyền.
        </p>
      </section>

      <section className="login-card clerk-login-card">
        <div className="section-heading">
          <h2>Tạo tài khoản</h2>
        </div>

        <SignUp
          fallbackRedirectUrl="/"
          signInFallbackRedirectUrl="/"
        />
      </section>
    </main>
  );
}

export default Register;
