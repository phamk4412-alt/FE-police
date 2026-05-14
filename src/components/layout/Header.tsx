import { Show, UserButton, useUser } from "@clerk/react";
import AdminIcon from "../admin/AdminIcons";
import type { UserRole } from "../../types/user";
import { APP_NAME, ROLE_LABELS } from "../../utils/constants";

interface HeaderProps {
  activeUserTab?: "home" | "map" | "news";
  activeSupportTab?: "duty" | "news";
  onSupportTabChange?: (tab: "duty" | "news") => void;
  onUserTabChange?: (tab: "home" | "map" | "news") => void;
  role: UserRole;
}

function Header({ activeSupportTab, activeUserTab, onSupportTabChange, onUserTabChange, role }: HeaderProps) {
  const { user } = useUser();
  const adminName = user?.fullName || user?.username || "Admin";

  if (role === "admin") {
    return (
      <header className="dashboard-header admin-topbar">
        <label className="admin-topbar-search">
          <AdminIcon name="search" />
          <input type="search" placeholder="Tìm kiếm tài khoản, vai trò, trạng thái..." />
        </label>
        <div className="dashboard-header-actions admin-topbar-actions">
          <button className="admin-notification-button" type="button" aria-label="Thông báo">
            <AdminIcon name="bell" />
            <span aria-hidden="true" />
          </button>
          <div className="admin-profile-chip">
            <Show when="signed-in">
              <UserButton />
            </Show>
            <span>{adminName}</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">Dự án Cảnh sát</p>
        <h1>{APP_NAME}</h1>
      </div>
      <div className="dashboard-header-actions">
        {role === "user" && activeUserTab && onUserTabChange ? (
          <nav className="header-tabs" aria-label="Chuyển trang người dân">
            <button
              className={activeUserTab === "home" ? "is-active" : ""}
              type="button"
              onClick={() => onUserTabChange("home")}
            >
              Trang Chủ
            </button>
            <button
              className={activeUserTab === "map" ? "is-active" : ""}
              type="button"
              onClick={() => onUserTabChange("map")}
            >
              Bản Đồ
            </button>
            <button
              className={activeUserTab === "news" ? "is-active" : ""}
              type="button"
              onClick={() => onUserTabChange("news")}
            >
              Tin Tức
            </button>
          </nav>
        ) : null}
        {role === "support" && activeSupportTab && onSupportTabChange ? (
          <nav className="header-tabs" aria-label="Chuyển trang hỗ trợ">
            <button
              className={activeSupportTab === "duty" ? "is-active" : ""}
              type="button"
              onClick={() => onSupportTabChange("duty")}
            >
              Thường Trực
            </button>
            <button
              className={activeSupportTab === "news" ? "is-active" : ""}
              type="button"
              onClick={() => onSupportTabChange("news")}
            >
              Tin Tức
            </button>
          </nav>
        ) : null}
        <div className="role-badge">{ROLE_LABELS[role]}</div>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}

export default Header;
