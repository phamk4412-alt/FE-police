import { useClerk, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [activeAdminItem, setActiveAdminItem] = useState("");
  const [activeRoleItem, setActiveRoleItem] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());
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

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const sidebarDate = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(currentTime);
  const sidebarTime = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

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
                data-tooltip={item.label}
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
                data-tooltip={item.label}
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
            {role !== "support" ? (
              <a
                className={activeRoleItem === "dashboard" ? "is-active" : ""}
                href={ROLE_HOME_PATHS[role]}
                title="Bảng điều khiển"
                data-tooltip="Bảng điều khiển"
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
            ) : null}
            {role === "police" && hasMap ? (
              <>
                <a
                  className={activeRoleItem === "map" ? "is-active" : ""}
                  href="#map"
                  title="Bản đồ"
                  data-tooltip="Bản đồ"
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
                  data-tooltip="Báo cáo / Vụ việc"
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
                    className={
                      role === "support"
                        ? location.pathname === "/support"
                          ? "is-active"
                          : ""
                        : activeRoleItem === "map"
                          ? "is-active"
                          : ""
                    }
                    href="#map"
                    title="Bản đồ"
                    data-tooltip="Bản đồ"
                    onClick={(event) => {
                      if (role === "support") {
                        event.preventDefault();
                        navigate("/support");
                      }
                      setActiveRoleItem("map");
                    }}
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
              data-tooltip="Cài đặt"
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

      <div className="sidebar-footer">
        <div className="sidebar-status-card" aria-label="Trạng thái hệ thống">
          <span>TP.HCM</span>
          <strong>{sidebarDate}</strong>
          <time dateTime={currentTime.toISOString()}>{sidebarTime}</time>
          <small>Hệ thống hoạt động</small>
        </div>

        <button className="sidebar-logout" type="button" data-tooltip="Đăng xuất" onClick={handleLogout}>
          <span className="sidebar-nav-icon" aria-hidden="true">
            X
          </span>
          <span className="sidebar-nav-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
