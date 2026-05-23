import { SignIn, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
import useIdentityVerificationState from "../../hooks/useIdentityVerificationState";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import { getClerkUserRole } from "../../utils/clerkRole";
import { APP_NAME, ROLE_HOME_PATHS } from "../../utils/constants";

function Login() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isLoading: isIdentityLoading, requiredIdentityStep } = useIdentityVerificationState(
    isLoaded && isSignedIn,
  );

  if (!isLoaded || (isSignedIn && isIdentityLoading)) {
    return <main className="auth-loading">Dang tai...</main>;
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
        <p className="eyebrow">Du an Canh sat</p>
        <h1>{APP_NAME}</h1>
      </section>

      <section className="login-card clerk-login-card">
        <div className="section-heading">
          <h2>Dang nhap</h2>
        </div>

        <SignIn fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
      </section>
    </main>
  );
}

export default Login;
