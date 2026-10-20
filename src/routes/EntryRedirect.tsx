import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import useIdentityVerificationState from "../hooks/useIdentityVerificationState";
import { ROLE_HOME_PATHS } from "../utils/constants";

function EntryRedirect() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const { isLoading: isIdentityLoading, requiredIdentityStep } = useIdentityVerificationState(
    isLoaded && isSignedIn,
  );

  if (!isLoaded || isIdentityLoading) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredIdentityStep) {
    return <Navigate to={requiredIdentityStep} replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[user.role]} replace />;
}

export default EntryRedirect;
