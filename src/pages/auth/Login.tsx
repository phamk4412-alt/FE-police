import { SignIn, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { getClerkUserRole } from "../../utils/clerkRole";
import { APP_NAME, ROLE_HOME_PATHS } from "../../utils/constants";
import { getRequiredIdentityStep } from "../../utils/identityVerification";

function Login() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (isSignedIn) {
    const role = getClerkUserRole(user);
    const requiredIdentityStep = getRequiredIdentityStep(user?.id);

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
      </section>

      <section className="login-card clerk-login-card">
        <div className="section-heading">
          <h2>Đăng nhập</h2>
        </div>

        <SignIn
          fallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />

      </section>
    </main>
  );
}

export default Login;
