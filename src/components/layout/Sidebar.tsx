import { useClerk } from "@clerk/react";
import { NavLink, useNavigate } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { ROLE_HOME_PATHS, ROLES_WITH_MAP } from "../../utils/constants";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  role: UserRole;
}

function Sidebar({ isCollapsed, onToggle, role }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const hasMap = ROLES_WITH_MAP.includes(role);

  function handleLogout() {
    void signOut(() => navigate("/login", { replace: true }));
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span aria-hidden="true">CS</span>
        <strong>Trung tâm Cảnh sát</strong>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          aria-pressed={isCollapsed}
        >
          <span aria-hidden="true">{isCollapsed ? ">" : "<"}</span>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng bảng điều khiển">
        <NavLink to={ROLE_HOME_PATHS[role]} title="Bảng điều khiển">
          <span className="sidebar-nav-icon" aria-hidden="true">
            D
          </span>
          <span className="sidebar-nav-label">Bảng điều khiển</span>
        </NavLink>
        <a href="#incidents" title="Báo cáo / Vụ việc">
          <span className="sidebar-nav-icon" aria-hidden="true">
            !
          </span>
          <span className="sidebar-nav-label">Báo cáo / Vụ việc</span>
        </a>
        {hasMap ? (
          <a href="#map" title="Bản đồ">
            <span className="sidebar-nav-icon" aria-hidden="true">
              M
            </span>
            <span className="sidebar-nav-label">Bản đồ</span>
          </a>
        ) : null}
        <a href="#account" title="Tài khoản">
          <span className="sidebar-nav-icon" aria-hidden="true">
            A
          </span>
          <span className="sidebar-nav-label">Tài khoản</span>
        </a>
      </nav>

      <button className="sidebar-logout" type="button" onClick={handleLogout}>
        <span className="sidebar-nav-icon" aria-hidden="true">
          X
        </span>
        <span className="sidebar-nav-label">Đăng xuất</span>
      </button>
    </aside>
  );
}

export default Sidebar;
