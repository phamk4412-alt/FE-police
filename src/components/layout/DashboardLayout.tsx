import { useEffect, useState, type ReactNode } from "react";
import VietnameseDecor, { type VietnameseDecorVariant } from "../common/VietnameseDecor";
import SupportDecor from "../common/SupportDecor";
import type { UserRole } from "../../types/user";
import type { SupportTab } from "../../utils/constants";
import Header from "./Header";
import Sidebar from "./Sidebar";

const defaultDecorByRole: Record<Exclude<UserRole, "support">, VietnameseDecorVariant> = {
  admin: "admin",
  police: "police",
  user: "user-home",
};

interface DashboardLayoutProps {
  activeSupportTab?: SupportTab;
  activeUserTab?: "home" | "map" | "news";
  children: ReactNode;
  decorVariant?: VietnameseDecorVariant;
  onSupportTabChange?: (tab: SupportTab) => void;
  onUserTabChange?: (tab: "home" | "map" | "news") => void;
  role: UserRole;
}

function DashboardLayout({
  activeSupportTab,
  activeUserTab,
  children,
  decorVariant,
  onSupportTabChange,
  onUserTabChange,
  role,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    }

    document.body.classList.add("is-nav-locked");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("is-nav-locked");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  return (
    <div
      className={`dashboard-shell ${role === "support" ? "is-support" : ""} ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${
        isMobileNavOpen ? "is-mobile-nav-open" : ""
      }`}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onNavigate={() => setIsMobileNavOpen(false)}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
        role={role}
      />
      <button
        aria-hidden={!isMobileNavOpen}
        aria-label="Đóng menu"
        className="sidebar-backdrop"
        tabIndex={isMobileNavOpen ? 0 : -1}
        type="button"
        onClick={() => setIsMobileNavOpen(false)}
      />
      <div className="dashboard-main">
        {role === "support" ? <SupportDecor /> : <VietnameseDecor variant={decorVariant || defaultDecorByRole[role]} />}
        <Header
          activeSupportTab={activeSupportTab}
          activeUserTab={activeUserTab}
          isMobileNavOpen={isMobileNavOpen}
          onMenuClick={() => setIsMobileNavOpen((current) => !current)}
          onSupportTabChange={onSupportTabChange}
          onUserTabChange={onUserTabChange}
          role={role}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
