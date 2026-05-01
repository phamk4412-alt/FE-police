import type { ReactNode } from "react";
import type { UserRole } from "../../types/user";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="dashboard-shell">
      <Sidebar role={role} />
      <div className="dashboard-main">
        <Header role={role} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
