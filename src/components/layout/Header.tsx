import { Show, UserButton } from "@clerk/react";
import type { UserRole } from "../../types/user";
import { APP_NAME, ROLE_LABELS } from "../../utils/constants";

interface HeaderProps {
  role: UserRole;
}

function Header({ role }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">Dự án Cảnh sát</p>
        <h1>{APP_NAME}</h1>
      </div>
      <div className="dashboard-header-actions">
        <div className="role-badge">{ROLE_LABELS[role]}</div>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}

export default Header;
