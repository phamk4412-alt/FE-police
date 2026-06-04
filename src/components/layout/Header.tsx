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
              <UserButton appearance={accountButtonAppearance} />
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
              Trang chủ
            </button>
            <button
              className={activeUserTab === "map" ? "is-active" : ""}
              type="button"
              onClick={() => onUserTabChange("map")}
            >
              Bản đồ
            </button>
            <button
              className={activeUserTab === "news" ? "is-active" : ""}
              type="button"
              onClick={() => onUserTabChange("news")}
            >
              Tin tức
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
              Thường trực
            </button>
            <button
              className={activeSupportTab === "news" ? "is-active" : ""}
              type="button"
              onClick={() => onSupportTabChange("news")}
            >
              Tin tức
            </button>
          </nav>
        ) : null}
        <div className="role-badge">{ROLE_LABELS[role]}</div>
        <Show when="signed-in">
          <UserButton appearance={accountButtonAppearance} />
        </Show>
      </div>
    </header>
  );
}

export default Header;
