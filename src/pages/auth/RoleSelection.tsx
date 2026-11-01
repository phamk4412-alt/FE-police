import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcons";
import Button from "../../components/common/Button";
import VietnameseDecor from "../../components/common/VietnameseDecor";
import type { UserRole } from "../../types/user";
import { APP_NAME, ROLE_HOME_PATHS, ROLE_LABELS } from "../../utils/constants";
import "./roleSelection.css";

const roleDetails: Record<UserRole, { icon: AdminIconName; description: string }> = {
  admin: { icon: "admin", description: "Quản lý tài khoản, phân quyền và theo dõi hệ thống." },
  police: { icon: "police", description: "Theo dõi vụ việc và tình hình an ninh trên bản đồ." },
  support: { icon: "support", description: "Tiếp nhận, hỗ trợ xử lý vụ việc và quản lý tin tức." },
  user: { icon: "user", description: "Gửi báo cáo sự cố và theo dõi thông tin an ninh quanh bạn." },
};

function RoleSelection() {
  const { isLoaded, isSignedIn, user, selectedRole, selectRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }
  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  function handleSelect(role: UserRole) {
    if (selectRole(role)) {
      navigate(ROLE_HOME_PATHS[role], { replace: true });
    } else {
      setError("Tài khoản không có quyền truy cập vai trò này.");
    }
  }

  return (
    <main className="login-page role-selection-page">
      <VietnameseDecor variant="auth" />
      <section className="login-hero">
        <p className="eyebrow">{APP_NAME}</p>
        <h1>Lựa chọn vai trò</h1>
        <p className="login-hero-lead">Xin chào {user.name || user.email}. Chọn vai trò để truy cập bảng điều khiển.</p>
      </section>
      <section className="login-card role-selection-panel" aria-labelledby="role-selection-heading">
        <div className="section-heading">
          <h2 id="role-selection-heading">Vai trò của bạn</h2>
          <p className="login-card-subtitle">Các vai trò đã được cấp cho tài khoản {user.email}.</p>
        </div>
        <div className="role-selection-grid">
          {user.roles.map((role) => (
            <button className="role-selection-card" key={role} type="button" onClick={() => handleSelect(role)}>
              <AdminIcon name={roleDetails[role].icon} />
              <strong>{ROLE_LABELS[role]}</strong>
              <span>{roleDetails[role].description}</span>
              <span className="role-selection-action">{selectedRole === role ? "Tiếp tục với vai trò này" : "Chọn vai trò"}</span>
            </button>
          ))}
        </div>
        {user.roles.length === 0 ? <p role="alert">Tài khoản chưa được cấp vai trò. Vui lòng liên hệ quản trị viên.</p> : null}
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <Button variant="secondary" onClick={() => void signOut()}>Đăng xuất</Button>
      </section>
    </main>
  );
}

export default RoleSelection;
