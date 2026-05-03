import { SignIn, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
import { APP_NAME, ROLE_HOME_PATHS } from "../utils/constants";
import { getClerkUserRole } from "../utils/clerkRole";

function Login() {
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
      <section className="login-hero">
        <p className="eyebrow">Dự án Cảnh sát</p>
        <h1>{APP_NAME}</h1>
      </section>

      <section className="login-card clerk-login-card">
        <div className="section-heading">
          <span className="eyebrow">Clerk</span>
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
