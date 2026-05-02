import type { UserRole } from "../types/user";

const VALID_ROLES: UserRole[] = ["admin", "police", "user", "support"];

interface ClerkMetadataUser {
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.includes(value as UserRole);
}

export function getClerkUserRole(user: ClerkMetadataUser | null | undefined) {
  const publicRole = user?.publicMetadata?.role;
  const unsafeRole = user?.unsafeMetadata?.role;

  if (isUserRole(publicRole)) {
    return publicRole;
  }

  if (isUserRole(unsafeRole)) {
    return unsafeRole;
  }

  return null;
}
