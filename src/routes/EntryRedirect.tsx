import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function EntryRedirect() {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/select-role" replace />;
}

export default EntryRedirect;
