import type { UserRole } from "../types/user";

export const APP_NAME = "Trung tâm Cảnh sát thông minh";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị viên",
  police: "Cảnh sát",
  user: "Người dân",
  support: "Hỗ trợ",
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  admin: "/admin",
  police: "/police",
  user: "/user",
  support: "/support",
};

export const ROLES_WITH_MAP: UserRole[] = ["police", "user", "support"];
