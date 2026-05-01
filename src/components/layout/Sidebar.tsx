import { NavLink, useNavigate } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { ROLE_HOME_PATHS, ROLES_WITH_MAP } from "../../utils/constants";
import { clearCurrentUser } from "../../utils/storage";

interface SidebarProps {
  role: UserRole;
}

function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const hasMap = ROLES_WITH_MAP.includes(role);

  function handleLogout() {
    clearCurrentUser();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>PSH</span>
        <strong>Trung tâm Cảnh sát</strong>
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng bảng điều khiển">
        <NavLink to={ROLE_HOME_PATHS[role]}>Bảng điều khiển</NavLink>
        <a href="#incidents">Báo cáo / Vụ việc</a>
        {hasMap ? <a href="#map">Bản đồ</a> : null}
        <a href="#account">Tài khoản</a>
      </nav>

      <button className="sidebar-logout" type="button" onClick={handleLogout}>
        Đăng xuất
      </button>
    </aside>
  );
}

export default Sidebar;
