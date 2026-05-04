import { useState, type ReactNode } from "react";
import type { UserRole } from "../../types/user";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  activeUserTab?: "home" | "map";
  children: ReactNode;
  onUserTabChange?: (tab: "home" | "map") => void;
  role: UserRole;
}

function DashboardLayout({ activeUserTab, children, onUserTabChange, role }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`dashboard-shell ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
        role={role}
      />
      <div className="dashboard-main">
        <Header activeUserTab={activeUserTab} onUserTabChange={onUserTabChange} role={role} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
