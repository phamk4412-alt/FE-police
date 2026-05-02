import type { ReactNode } from "react";
import { useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { ROLE_HOME_PATHS } from "../../utils/constants";
import { getClerkUserRole } from "../../utils/clerkRole";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
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

  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME_PATHS[role]} replace />;
  }

  return children;
}

export default ProtectedRoute;
