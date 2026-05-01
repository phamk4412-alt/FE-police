import type { UserRole } from "../types/user";

export const APP_NAME = "Police Smart Hub";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  police: "Police",
  user: "User",
  support: "Support",
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  admin: "/admin",
  police: "/police",
  user: "/user",
  support: "/support",
};

export const ROLES_WITH_MAP: UserRole[] = ["police", "user", "support"];
