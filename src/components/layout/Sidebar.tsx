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
        <strong>Police Smart Hub</strong>
      </div>

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        <NavLink to={ROLE_HOME_PATHS[role]}>Dashboard</NavLink>
        <a href="#incidents">Reports / Incidents</a>
        {hasMap ? <a href="#map">Map</a> : null}
        <a href="#account">Account</a>
      </nav>

      <button className="sidebar-logout" type="button" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
