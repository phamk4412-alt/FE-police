import { useState, type ReactNode } from "react";
import type { UserRole } from "../../types/user";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  activeSupportTab?: "duty" | "news";
  activeUserTab?: "home" | "map" | "news";
  children: ReactNode;
  onSupportTabChange?: (tab: "duty" | "news") => void;
  onUserTabChange?: (tab: "home" | "map" | "news") => void;
  role: UserRole;
}

function DashboardLayout({
  activeSupportTab,
  activeUserTab,
  children,
  onSupportTabChange,
  onUserTabChange,
  role,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`dashboard-shell ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
        role={role}
      />
      <div className="dashboard-main">
        <Header
          activeSupportTab={activeSupportTab}
          activeUserTab={activeUserTab}
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
