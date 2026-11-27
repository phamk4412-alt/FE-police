import { useEffect, useState, type Ref } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AdminIcon from "../admin/AdminIcons";
import type { UserRole } from "../../types/user";
import { ROLE_LABELS } from "../../utils/constants";
import { getActiveSidebarItem, sidebarGroups } from "./sidebarNavigation";
import "./roleSidebar.css";

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit",
});

interface SidebarProps {
  isCollapsed: boolean;
  drawerRef?: Ref<HTMLElement>;
  onNavigate?: () => void;
  onToggle: () => void;
  role: UserRole;
}

function Sidebar({ drawerRef, isCollapsed, onNavigate, onToggle, role }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [activeAdminItem, setActiveAdminItem] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const adminMenu = [
    { id: "dashboard", href: "/admin", icon: "chart", label: "Bảng điều khiển" },
    { id: "statistics", href: "#statistics", icon: "activity", label: "Thống kê" },
    { id: "accounts", href: "#accounts", icon: "users", label: "Quản lý tài khoản" },
    { id: "activity-log", href: "#activity-log", icon: "clock", label: "Nhật ký hoạt động" },
    { id: "settings", href: "#settings", icon: "settings", label: "Cài đặt" },
  ] as const;

  function handleLogout() {
    const username = user?.id || user?.email;
    if (role === "police" && username) {
      const payload = JSON.stringify({ Username: username });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL || "https://be-police-n8zf.onrender.com"}/api/police/me/location/end`,
          new Blob([payload], { type: "application/json" }),
        );
      }
    }

    void signOut().then(() => navigate("/login", { replace: true }));
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const sidebarDate = dateFormat.format(currentTime);
  const sidebarTime = timeFormat.format(currentTime);

  if (role !== "admin") {
    const activeItem = getActiveSidebarItem(role, location.pathname, location.hash);
    const accountName = user?.name || user?.email || ROLE_LABELS[role];

    return (
      <aside className="role-sidebar" ref={drawerRef} aria-label="Thanh điều hướng">
        <div className="role-sidebar-brand">
          <span className="role-sidebar-mark" role="img" aria-label="Trung tâm Cảnh sát · TP. Hồ Chí Minh"
            data-tooltip="Trung tâm Cảnh sát · TP. Hồ Chí Minh" tabIndex={isCollapsed ? 0 : undefined}>
            <AdminIcon name="shield" />
          </span>
          <div className="role-sidebar-brand-copy">
            <strong>Trung tâm Cảnh sát</strong>
            <small>TP. Hồ Chí Minh</small>
          </div>
          <button className="role-sidebar-toggle" type="button" onClick={onToggle} aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}>
            <AdminIcon name={isCollapsed ? "chevronRight" : "chevronLeft"} />
          </button>
          <button className="role-sidebar-close" type="button" aria-label="Đóng thanh điều hướng" onClick={onNavigate}>
            <AdminIcon name="close" />
          </button>
        </div>

        <nav className="role-sidebar-nav" aria-label="Điều hướng bảng điều khiển">
          {sidebarGroups[role].map((group) => (
            <section className="role-sidebar-group" key={group.label} aria-label={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <Link className="role-sidebar-link" key={item.to} to={item.to} onClick={onNavigate}
                  aria-current={activeItem === item ? (item.to.includes("#") ? "location" : "page") : undefined}
                  aria-label={item.label} data-tooltip={item.label}>
                  <span className="role-sidebar-icon"><AdminIcon name={item.icon} /></span>
                  <span className="role-sidebar-link-label">{item.label}</span>
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className="role-sidebar-motif" aria-hidden="true">
          <svg viewBox="0 0 240 156" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <g className="role-sidebar-motif-rings">
              <circle cx="120" cy="78" r="73" />
              <circle cx="120" cy="78" r="68" strokeDasharray="1 4" />
              <circle cx="120" cy="78" r="63" />
              <path d="m117 5 3 4 3-4m-6 146 3-4 3 4M62 35l-4 2 1-5m119 3 4 2-1-5M62 121l-4-2 1 5m119-3 4-2-1 5" />
            </g>
            <g className="role-sidebar-motif-bird">
              <path d="M128 83C111 87 99 71 85 59 70 46 55 30 45 15c25 14 51 17 78 22 15 3 20 9 16 19-5 13-4 21 4 25-5 0-10 1-15 2Z" fill="currentColor" fillOpacity=".15" />
              <path d="M56 23c23 11 44 13 66 19 10 2 15 6 12 14-6 13-5 22 2 26M57 31l64 16m-54-4 55 11m-45-1 47 8m-37 2 39 5m-28 5 30 3" />
              <path d="M134 96c-15 32-43 39-64 44 14-9 28-19 39-35m16-4c-12 16-23 25-39 31m17-13 14-3m-8-5 15-3" fill="currentColor" fillOpacity=".09" />
              <path d="M114 87C96 90 78 87 59 89c-18 2-29 10-44 21 22-7 39-9 57-10-19 5-32 15-47 29 29-9 48-21 70-23 12-2 24 0 37-1 24-1 41-15 49-34 4-11 8-16 15-19l31-13-31 5c-10-4-19 0-24 13-6 15-15 23-28 24-10 1-18 0-30 6Z" fill="currentColor" fillOpacity=".16" />
              <path d="M185 43c-15-14-23 3-37-2m34 5c-12-8-19 6-34 2m48-1 26-7M22 105c17-10 35-12 53-12m-39 29 44-19m-28 12 2-5 6 1 2-5 6 1 2-5m11-6 28-4m-25 9 26-3m32 1c17-5 27-15 34-32m-22 23-2-4m8-1-3-4m8-2-4-3m8-4-4-3" />
              <circle cx="189" cy="48" r="3.7" />
              <circle cx="189" cy="48" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="128" cy="94" r="12" />
              <path d="m128 84 2.1 6 5.7-2.8-2.8 5.7 6 2.1-6 2.1 2.8 5.7-5.7-2.8-2.1 6-2.1-6-5.7 2.8 2.8-5.7-6-2.1 6-2.1-2.8-5.7 5.7 2.8Z" fill="currentColor" stroke="none" />
            </g>
            <path className="role-sidebar-motif-rings" d="M28 132c10 0 14-6 24-6 11 0 15 7 27 7m73-3c9 0 13-6 22-6 10 0 14 6 23 6m-19 5c6-3 12-2 16 0" />
          </svg>
        </div>

        <div className="role-sidebar-footer">
          <div className="role-sidebar-status" role="group" tabIndex={isCollapsed ? 0 : undefined}
            aria-label={`TP.HCM · ${sidebarDate} · ${sidebarTime} · Hệ thống hoạt động`}
            data-tooltip={`TP.HCM · ${sidebarDate} · ${sidebarTime} · Hệ thống hoạt động`}>
            <span className="role-sidebar-icon"><AdminIcon name="clock" /></span>
            <div className="role-sidebar-status-copy">
              <div><time dateTime={currentTime.toISOString()}>{sidebarTime}</time><span>TP.HCM · {sidebarDate}</span></div>
              <small><i aria-hidden="true" /> Hệ thống hoạt động</small>
            </div>
          </div>
          <div className="role-sidebar-account" role="group" tabIndex={isCollapsed ? 0 : undefined}
            aria-label={`${accountName} · ${ROLE_LABELS[role]}`} data-tooltip={`${accountName} · ${ROLE_LABELS[role]}`}>
            <span className="role-sidebar-icon">
              {user?.avatarUrl
                ? <img alt="" src={user.avatarUrl} referrerPolicy="no-referrer" />
                : <AdminIcon name="user" />}
            </span>
            <div className="role-sidebar-account-copy"><strong>{accountName}</strong><small>{ROLE_LABELS[role]}</small></div>
          </div>
          <button className="role-sidebar-link role-sidebar-signout" type="button" onClick={handleLogout}
            aria-label="Đăng xuất" data-tooltip="Đăng xuất">
            <span className="role-sidebar-icon"><AdminIcon name="logout" /></span>
            <span className="role-sidebar-link-label">Đăng xuất</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <AdminIcon name="police" />
        </span>
        <span className="sidebar-brand-text">
          <strong>Trung tâm Cảnh sát</strong>
          <small>TP. Hồ Chí Minh</small>
        </span>
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

      <nav className="sidebar-nav" aria-label="Điều hướng bảng điều khiển" onClick={onNavigate}>
        {adminMenu.map((item) => (
          <a
            className={activeAdminItem === item.id ? "is-active" : ""}
            href={item.href}
            key={item.id}
            title={item.label}
            data-tooltip={item.label}
            onClick={(event) => {
              setActiveAdminItem(item.id);
              if (!item.href.startsWith("#")) {
                event.preventDefault();
                navigate(item.href);
              }
            }}
          >
            <span className="sidebar-nav-icon" aria-hidden="true"><AdminIcon name={item.icon} /></span>
            <span className="sidebar-nav-label">{item.label}</span>
          </a>
        ))}
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
            <AdminIcon name="logout" />
          </span>
          <span className="sidebar-nav-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
