import type { AdminUserRole, AdminUserStatus } from "../../types/adminUser";

export const roleLabels: Record<AdminUserRole, string> = {
  admin: "Admin",
  police: "Cảnh sát",
  support: "Hỗ trợ",
  user: "Người dân",
};

export const statusLabels: Record<AdminUserStatus, string> = {
  active: "Hoạt động",
  locked: "Bị khóa",
  pending: "Chờ xác minh",
};

export const roleOptions: AdminUserRole[] = ["admin", "police", "support", "user"];

export const statusOptions: AdminUserStatus[] = ["active", "locked", "pending"];

export function formatDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
