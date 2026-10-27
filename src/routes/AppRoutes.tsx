import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import AdminDashboard from "../pages/dashboards/AdminDashboard";
import PoliceDashboard from "../pages/dashboards/PoliceDashboard";
import SupportDashboard from "../pages/dashboards/SupportDashboard";
import UserDashboard from "../pages/dashboards/UserDashboard";
import PrivacyPolicy from "../pages/legal/PrivacyPolicy";
import SupportPage from "../pages/legal/SupportPage";
import EntryRedirect from "./EntryRedirect";

function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<EntryRedirect />} />
        <Route path="/login/*" element={<Login />} />
        <Route path="/sign-up/*" element={<Register />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<SupportPage />} />
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
          path="/user/*"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support/*"
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
