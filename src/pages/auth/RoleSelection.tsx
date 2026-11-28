import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcons";
import Button from "../../components/common/Button";
import PoliceMascot from "../../components/common/PoliceMascot";
import type { UserRole } from "../../types/user";
import { APP_LOCATION, APP_MARK_URL, APP_NAME, ROLE_HOME_PATHS, ROLE_LABELS } from "../../utils/constants";
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
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  if (!isLoaded) {
    return <main className="auth-loading">Đang tải...</main>;
  }
  if (!isSignedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  async function handleSelect(role: UserRole) {
    setPendingRole(role);
    setError("");
    try {
      if (await selectRole(role)) {
        navigate(ROLE_HOME_PATHS[role], { replace: true });
      } else {
        setError("Không thể chọn vai trò. Vui lòng đăng nhập lại.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể chọn vai trò. Vui lòng thử lại.");
    } finally {
      setPendingRole(null);
    }
  }

  return (
    <main className="role-selection-page">
      <div className="login-beacons" aria-hidden="true" />
      <header className="login-identity">
        <img src={APP_MARK_URL} alt="" width="54" height="54" />
        <div><strong>{APP_NAME}</strong><small>{APP_LOCATION}</small></div>
      </header>
      <section className="role-selection-intro" aria-labelledby="role-selection-title">
        <p className="role-selection-kicker"><AdminIcon name="shield" /> Cổng truy cập hệ thống</p>
        <h1 id="role-selection-title">Lựa chọn <span>vai trò</span></h1>
        <p>Xin chào <strong>{user.name || user.email}</strong>. Chọn vai trò để truy cập bảng điều khiển.</p>
      </section>
      <section className="role-selection-panel" aria-labelledby="role-selection-heading">
        <header className="role-selection-panel-head">
          <div>
            <h2 id="role-selection-heading">Chọn vai trò truy cập</h2>
            {user.email ? <p className="role-selection-account"><AdminIcon name="mail" /> {user.email}</p> : null}
          </div>
          <span className="role-selection-count">{user.roles.length} vai trò</span>
        </header>
        <div className="role-selection-grid">
          {user.roles.map((role) => (
            <button className="role-selection-card" data-role={role} data-current={selectedRole === role}
              disabled={pendingRole !== null} aria-busy={pendingRole === role} key={role} type="button" onClick={() => void handleSelect(role)}>
              <span className="role-selection-card-top">
                <span className="role-selection-icon"><AdminIcon name={roleDetails[role].icon} /></span>
                {selectedRole === role ? <span className="role-selection-current"><AdminIcon name="check" /> Vai trò hiện tại</span> : null}
              </span>
              <strong>{ROLE_LABELS[role]}</strong>
              <span className="role-selection-description">{roleDetails[role].description}</span>
              <span className="role-selection-action">
                {pendingRole === role ? "Đang chuyển…" : selectedRole === role ? "Tiếp tục" : "Chọn vai trò"}
                {pendingRole === role ? <span className="login-spinner" aria-hidden="true" /> : <AdminIcon name="chevronRight" />}
              </span>
            </button>
          ))}
        </div>
        {user.roles.length === 0 ? <p className="role-selection-notice" role="alert">Tài khoản chưa được cấp vai trò. Vui lòng liên hệ quản trị viên.</p> : null}
        {error ? <p className="role-selection-notice" role="alert"><AdminIcon name="alert" /> {error}</p> : null}
        <footer className="role-selection-panel-footer">
          <Button variant="secondary" disabled={pendingRole !== null} onClick={() => void signOut()}><AdminIcon name="logout" /> Đăng xuất</Button>
        </footer>
      </section>
      <div className="login-assistant role-selection-assistant"><PoliceMascot /></div>
    </main>
  );
}

export default RoleSelection;
