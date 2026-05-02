import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { ROLE_HOME_PATHS } from "../utils/constants";
import { getClerkUserRole } from "../utils/clerkRole";

function EntryRedirect() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const role = getClerkUserRole(user);

  if (!role) {
    return <Navigate to="/select-role" replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[role]} replace />;
}

export default EntryRedirect;
