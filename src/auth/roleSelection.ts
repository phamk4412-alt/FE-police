import type { UserRole } from "../types/user";

const ROLE_STORAGE_KEY = "police.selectedRole";
const VALID_ROLES: UserRole[] = ["admin", "police", "support", "user"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.includes(value as UserRole);
}

export function clearSelectedRole() {
  try {
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // Selection still works in memory when storage is unavailable.
  }
}

export function readSelectedRole(accountId: string, roles: UserRole[]): UserRole | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ROLE_STORAGE_KEY) || "null");
    if (saved?.accountId === accountId && isUserRole(saved.role) && roles.includes(saved.role)) {
      return saved.role;
    }
  } catch {
    // Invalid or unavailable storage must never grant a role.
  }
  clearSelectedRole();
  return null;
}

export function saveSelectedRole(accountId: string, role: UserRole) {
  try {
    window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify({ accountId, role }));
  } catch {
    // Keep the selected role in React state until the page is reloaded.
  }
}
