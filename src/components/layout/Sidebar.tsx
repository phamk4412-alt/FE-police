import { useClerk, useUser } from "@clerk/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminIcon from "../admin/AdminIcons";
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
  const { user } = useUser();
  const [activeAdminItem, setActiveAdminItem] = useState("");
  const [activeRoleItem, setActiveRoleItem] = useState("");
  const hasMap = ROLES_WITH_MAP.includes(role);
  const adminMenu = [
    { id: "dashboard", href: "/admin", icon: "chart", label: "Bảng điều khiển" },
    { id: "statistics", href: "#statistics", icon: "activity", label: "Thống kê" },
    { id: "accounts", href: "#accounts", icon: "users", label: "Quản lý tài khoản" },
    { id: "activity-log", href: "#activity-log", icon: "clock", label: "Nhật ký hoạt động" },
    { id: "settings", href: "#settings", icon: "settings", label: "Cài đặt" },
  ] as const;

  function handleLogout() {
    const username = user?.id || user?.primaryEmailAddress?.emailAddress || user?.username;
    if (role === "police" && username) {
      const payload = JSON.stringify({ Username: username });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL || "https://be-police-n8zf.onrender.com"}/api/police/me/location/end`,
          new Blob([payload], { type: "application/json" }),
        );
      }
    }

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
        {role === "admin" ? (
          adminMenu.map((item) =>
            item.href.startsWith("#") ? (
              <a
                className={activeAdminItem === item.id ? "is-active" : ""}
                href={item.href}
                key={item.id}
                title={item.label}
                onClick={() => setActiveAdminItem(item.id)}
              >
                <span className="sidebar-nav-icon" aria-hidden="true">
                  <AdminIcon name={item.icon} />
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
              </a>
            ) : (
              <a
                className={activeAdminItem === item.id ? "is-active" : ""}
                href={item.href}
                key={item.id}
                title={item.label}
                onClick={(event) => {
                  event.preventDefault();
                  setActiveAdminItem(item.id);
                  navigate(item.href);
                }}
              >
                <span className="sidebar-nav-icon" aria-hidden="true">
                  <AdminIcon name={item.icon} />
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
              </a>
            ),
          )
        ) : (
          <>
            <a
              className={activeRoleItem === "dashboard" ? "is-active" : ""}
              href={ROLE_HOME_PATHS[role]}
              title="Bảng điều khiển"
              onClick={(event) => {
                event.preventDefault();
                setActiveRoleItem("dashboard");
                navigate(ROLE_HOME_PATHS[role]);
              }}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <AdminIcon name="chart" />
              </span>
              <span className="sidebar-nav-label">Bảng điều khiển</span>
            </a>
            {role === "police" && hasMap ? (
              <>
                <a
                  className={activeRoleItem === "map" ? "is-active" : ""}
                  href="#map"
                  title="Bản đồ"
                  onClick={() => setActiveRoleItem("map")}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">
                    M
                  </span>
                  <span className="sidebar-nav-label">Bản đồ</span>
                </a>
                <a
                  className={activeRoleItem === "incidents" ? "is-active" : ""}
                  href="#incidents"
                  title="Báo cáo / Vụ việc"
                  onClick={() => setActiveRoleItem("incidents")}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">
                    !
                  </span>
                  <span className="sidebar-nav-label">Báo cáo / Vụ việc</span>
                </a>
              </>
            ) : (
              <>
                {hasMap ? (
                  <a
                    className={activeRoleItem === "map" ? "is-active" : ""}
                    href="#map"
                    title="Bản đồ"
                    onClick={() => setActiveRoleItem("map")}
                  >
                    <span className="sidebar-nav-icon" aria-hidden="true">
                      M
                    </span>
                    <span className="sidebar-nav-label">Bản đồ</span>
                  </a>
                ) : null}
              </>
            )}
            <a
              className={activeRoleItem === "settings" ? "is-active" : ""}
              href="#settings"
              title="Cài đặt"
              onClick={() => setActiveRoleItem("settings")}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <AdminIcon name="settings" />
              </span>
              <span className="sidebar-nav-label">Cài đặt</span>
            </a>
          </>
        )}
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
