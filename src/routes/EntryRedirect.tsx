import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import useIdentityVerificationState from "../hooks/useIdentityVerificationState";
import { ROLE_HOME_PATHS } from "../utils/constants";
import { getClerkUserRole } from "../utils/clerkRole";

function EntryRedirect() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isLoading: isIdentityLoading, requiredIdentityStep } = useIdentityVerificationState(
    isLoaded && isSignedIn,
  );

  if (!isLoaded || isIdentityLoading) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const role = getClerkUserRole(user);

  if (requiredIdentityStep) {
    return <Navigate to={requiredIdentityStep} replace />;
  }

  if (!role) {
    return <Navigate to="/select-role" replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[role]} replace />;
}

export default EntryRedirect;
