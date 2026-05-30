import { getClerkUserRole } from "./clerkRole";

interface ClerkAccountUser {
  fullName?: string | null;
  id: string;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
  username?: string | null;
}

export function buildClerkAccountSnapshot(user: ClerkAccountUser | null | undefined) {
  if (!user) {
    return null;
  }

  return {
    ClerkUserId: user.id,
    DisplayName:
      user.fullName ||
      user.username ||
      user.primaryEmailAddress?.emailAddress ||
      user.id,
    Email: user.primaryEmailAddress?.emailAddress || "",
    Role: getClerkUserRole(user) || undefined,
    Status: "active",
  };
}
