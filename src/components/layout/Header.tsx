import { Show, UserButton, useUser } from "@clerk/react";
import AdminIcon from "../admin/AdminIcons";
import type { UserRole } from "../../types/user";
import { APP_NAME, ROLE_LABELS } from "../../utils/constants";

const accountButtonAppearance = {
  variables: {
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#111827",
    colorNeutral: "#64748b",
    colorPrimary: "#ff4655",
    colorText: "#111827",
    colorTextSecondary: "#4b5563",
    borderRadius: "8px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  elements: {
    modalContent: {
      backgroundColor: "#ffffff",
      color: "#111827",
    },
    userProfileModal: {
      backgroundColor: "#ffffff",
      color: "#111827",
    },
    userProfileRoot: {
      backgroundColor: "#ffffff",
      color: "#111827",
    },
    userProfilePage: {
      backgroundColor: "#ffffff",
      color: "#111827",
    },
    navbar: {
      backgroundColor: "#f8fafc",
      borderRight: "1px solid #e5e7eb",
    },
    navbarButton: {
      color: "#334155",
      fontWeight: "700",
    },
    navbarButtonIcon: {
      color: "#475569",
    },
    navbarButton__active: {
      backgroundColor: "#fff1f2",
      color: "#ff4655",
    },
    headerTitle: {
      color: "#111827",
    },
    headerSubtitle: {
      color: "#4b5563",
    },
    profileSectionTitleText: {
      color: "#111827",
    },
    profileSectionContent: {
      color: "#111827",
    },
    formFieldLabel: {
      color: "#111827",
      fontWeight: "700",
    },
    formFieldInput: {
      backgroundColor: "#ffffff",
      borderColor: "#cbd5e1",
      color: "#111827",
      boxShadow: "none",
    },
    formButtonPrimary: {
      backgroundColor: "#ff4655",
      color: "#ffffff",
      fontWeight: "900",
      boxShadow: "none",
    },
    footer: {
      backgroundColor: "#ffffff",
    },
  },
};

interface HeaderProps {
  activeUserTab?: "home" | "map" | "news";
  activeSupportTab?: "duty" | "news";
  isMobileNavOpen?: boolean;
  onMenuClick?: () => void;
  onSupportTabChange?: (tab: "duty" | "news") => void;
  onUserTabChange?: (tab: "home" | "map" | "news") => void;
  role: UserRole;
}

const userTabs = [
  { id: "home", label: "Trang chủ" },
  { id: "map", label: "Bản đồ" },
  { id: "news", label: "Tin tức" },
] as const;

const supportTabs = [
  { id: "duty", label: "Thường trực" },
  { id: "news", label: "Tin tức" },
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
  const { user } = useUser();
  const displayName = user?.fullName || user?.username || ROLE_LABELS[role];

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
            >
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
          <Show when="signed-in">
            <UserButton appearance={accountButtonAppearance} />
          </Show>
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
