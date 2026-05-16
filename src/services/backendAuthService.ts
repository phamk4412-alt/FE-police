import { apiFetch } from "./api";

type BackendRole = "admin" | "police" | "support" | "user";

interface BackendUser {
  Role?: string;
  role?: string;
}

const demoCredentials: Record<BackendRole, { password: string; username: string }> = {
  admin: { password: "admin123", username: "admin" },
  police: { password: "police123", username: "police" },
  support: { password: "support123", username: "support" },
  user: { password: "user123", username: "user" },
};

function getBackendRole(user: BackendUser) {
  return (user.Role || user.role || "").toLowerCase();
}

export async function ensureBackendRoleSession(role: BackendRole) {
  try {
    const currentUser = await apiFetch<BackendUser>("/api/auth/me");
    if (getBackendRole(currentUser) === role) {
      return;
    }
  } catch {
    // Missing/expired backend cookie; fall through to demo role login.
  }

  const credentials = demoCredentials[role];
  await apiFetch<BackendUser>("/api/auth/login", {
    body: JSON.stringify(credentials),
    method: "POST",
  });
}

export async function withBackendRoleSession<T>(role: BackendRole, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("401") && !message.includes("403")) {
      throw error;
    }

    await ensureBackendRoleSession(role);
    return action();
  }
}
