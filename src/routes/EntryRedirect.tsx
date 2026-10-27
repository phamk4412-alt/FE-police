import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_HOME_PATHS } from "../utils/constants";

function EntryRedirect() {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[user.role]} replace />;
}

export default EntryRedirect;
