import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { UserRole } from "../../types/user";
import { ROLE_HOME_PATHS } from "../../utils/constants";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME_PATHS[user.role]} replace />;
  }

  return children;
}

export default ProtectedRoute;
