import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { ROLE_HOME_PATHS } from "../../utils/constants";
import { getCurrentUser } from "../../utils/storage";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={ROLE_HOME_PATHS[currentUser.role] || "/login"} replace />;
  }

  return children;
}

export default ProtectedRoute;
