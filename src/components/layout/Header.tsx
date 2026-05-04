import { Show, UserButton } from "@clerk/react";
import type { UserRole } from "../../types/user";
import { APP_NAME, ROLE_LABELS } from "../../utils/constants";

interface HeaderProps {
  activeUserTab?: "home" | "map";
  onUserTabChange?: (tab: "home" | "map") => void;
  role: UserRole;
}

function Header({ activeUserTab, onUserTabChange, role }: HeaderProps) {
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
