import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import Login from "../pages/Login";
import PoliceDashboard from "../pages/PoliceDashboard";
import SelectRole from "../pages/SelectRole";
import SupportDashboard from "../pages/SupportDashboard";
import UserDashboard from "../pages/UserDashboard";
import EntryRedirect from "./EntryRedirect";

function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<EntryRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/police"
          element={
            <ProtectedRoute allowedRoles={["police"]}>
              <PoliceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute allowedRoles={["support"]}>
              <SupportDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
