import { useAuth } from "../../auth/AuthContext";
import AdminIcon from "../admin/AdminIcons";
import type { UserRole } from "../../types/user";
import { APP_NAME, ROLE_LABELS, type SupportTab } from "../../utils/constants";

interface HeaderProps {
  activeUserTab?: "home" | "map" | "news";
  activeSupportTab?: SupportTab;
  isMobileNavOpen?: boolean;
  onMenuClick?: () => void;
  onSupportTabChange?: (tab: SupportTab) => void;
  onUserTabChange?: (tab: "home" | "map" | "news") => void;
  role: UserRole;
}

const userTabs = [
  { id: "home", label: "Trang chủ", icon: "chart" },
  { id: "map", label: "Bản đồ", icon: "map" },
  { id: "news", label: "Tin tức", icon: "file" },
] as const;

const supportTabs = [
  { id: "duty", label: "Thường trực", icon: "activity" },
  { id: "tracking", label: "Theo dõi Công an", icon: "users" },
  { id: "review", label: "Duyệt vụ việc", icon: "review" },
  { id: "news", label: "Tin tức", icon: "file" },
] as const;

function Header({
  activeSupportTab,
  activeUserTab,
  isMobileNavOpen = false,
  onMenuClick,
  onSupportTabChange,
  onUserTabChange,
  role,
}: HeaderProps) {
  const { user } = useAuth();
  const displayName = user?.name || ROLE_LABELS[role];

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-title">
        <button
          aria-expanded={isMobileNavOpen}
          aria-label={isMobileNavOpen ? "Đóng menu" : "Mở menu"}
          className="header-menu-button"
          type="button"
          onClick={onMenuClick}
        >
          <AdminIcon name={isMobileNavOpen ? "close" : "menu"} />
        </button>
        <div>
          <p className="eyebrow">{ROLE_LABELS[role]}</p>
          <h1>{APP_NAME}</h1>
        </div>
      </div>

      {role === "user" && activeUserTab && onUserTabChange ? (
        <nav className="header-tabs" aria-label="Chuyển trang người dân">
          {userTabs.map((tab) => (
            <button
              className={activeUserTab === tab.id ? "is-active" : ""}
              key={tab.id}
              type="button"
              onClick={() => onUserTabChange(tab.id)}
            >
              <AdminIcon name={tab.icon} />
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}
      {role === "support" && activeSupportTab && onSupportTabChange ? (
        <nav className="header-tabs" aria-label="Chuyển trang hỗ trợ">
          {supportTabs.map((tab) => (
            <button
              className={activeSupportTab === tab.id ? "is-active" : ""}
              key={tab.id}
              type="button"
              onClick={() => onSupportTabChange(tab.id)}
              aria-current={activeSupportTab === tab.id ? "page" : undefined}
            >
              <AdminIcon name={tab.icon} />
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="dashboard-header-actions">
        <span className="header-live-indicator" title="Hệ thống đang hoạt động">
          <span aria-hidden="true" />
          Trực tuyến
        </span>
        <div className="header-profile-chip">
          {user?.avatarUrl ? (
            <img
              alt=""
              className="header-profile-avatar"
              referrerPolicy="no-referrer"
              src={user.avatarUrl}
            />
          ) : (
            <span aria-hidden="true" className="header-profile-avatar">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="header-profile-text">
            <strong>{displayName}</strong>
            <small>{ROLE_LABELS[role]}</small>
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
