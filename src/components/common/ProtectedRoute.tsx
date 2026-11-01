import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { UserRole } from "../../types/user";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, selectedRole, user } = useAuth();

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedRole || !user.roles.includes(selectedRole) || !allowedRoles.includes(selectedRole)) {
    return <Navigate to="/select-role" replace />;
  }

  return children;
}

export default ProtectedRoute;
