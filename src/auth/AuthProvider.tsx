import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../services/api";
import type { UserRole } from "../types/user";
import { AuthContext, type AuthContextValue, type AuthUser } from "./AuthContext";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authToken";
import { signOutNativeGoogle } from "./nativeGoogle";
import { clearSelectedRole, isUserRole, readSelectedRole, saveSelectedRole } from "./roleSelection";

interface CurrentUserResponse {
  AvatarUrl?: string | null;
  DisplayName?: string;
  Email?: string;
  Id?: string;
  Role?: string;
}

interface LoginResponse {
  Token: string;
  User: CurrentUserResponse;
}

function toAuthUser(response: CurrentUserResponse): AuthUser {
  const role = (response.Role || "").trim().toLowerCase();
  if (!response.Id || !isUserRole(role)) {
    throw new Error("Tài khoản chưa có vai trò hợp lệ. Vui lòng liên hệ quản trị viên.");
  }

  return {
    avatarUrl: response.AvatarUrl || null,
    email: response.Email || "",
    id: response.Id || "",
    name: response.DisplayName || response.Email || "",
    role,
    // The current backend stores one role per account. Never infer additional grants.
    roles: [role],
  };
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoaded, setIsLoaded] = useState(() => !getAuthToken());

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      clearSelectedRole();
      return;
    }

    let isActive = true;
    apiFetch<CurrentUserResponse>("/api/auth/me")
      .then((response) => {
        if (isActive && getAuthToken() === token) {
          const restoredUser = toAuthUser(response);
          setUser(restoredUser);
          setSelectedRole(readSelectedRole(restoredUser.id, restoredUser.roles));
        }
      })
      .catch(() => {
        // Expired token, locked account or deleted account: start signed out.
        if (isActive && getAuthToken() === token) {
          clearAuthToken();
          clearSelectedRole();
          setUser(null);
          setSelectedRole(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoaded(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const completeLogin = useCallback(async (endpoint: string, body: Record<string, string>) => {
    const response = await apiFetch<LoginResponse>(endpoint, {
      body: JSON.stringify(body),
      method: "POST",
    });
    const nextUser = toAuthUser(response.User);
    setAuthToken(response.Token);
    clearSelectedRole();
    setSelectedRole(null);
    setUser(nextUser);
    setIsLoaded(true);
    return nextUser;
  }, []);

  const signInWithGoogle = useCallback(
    (credential: string) => completeLogin("/api/auth/google", { Credential: credential }),
    [completeLogin],
  );

  const signInWithPassword = useCallback(
    (email: string, password: string) => completeLogin("/api/auth/login", { Email: email, Password: password }),
    [completeLogin],
  );

  const register = useCallback(
    (displayName: string, email: string, password: string) =>
      completeLogin("/api/auth/register", { DisplayName: displayName, Email: email, Password: password }),
    [completeLogin],
  );

  const signOut = useCallback(async () => {
    // Start the request with the old token, then clear local state immediately.
    const logoutRequest = apiFetch("/api/auth/logout", { method: "POST" });
    clearAuthToken();
    clearSelectedRole();
    setSelectedRole(null);
    setUser(null);
    try {
      await logoutRequest;
    } catch {
      // Signing out locally is enough; the token is simply discarded.
    }

    window.google?.accounts.id.disableAutoSelect();
    void signOutNativeGoogle();
  }, []);

  const selectRole = useCallback((role: UserRole) => {
    if (!user?.roles.includes(role)) {
      return false;
    }
    saveSelectedRole(user.id, role);
    setSelectedRole(role);
    return true;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(user),
      selectedRole,
      selectRole,
      register,
      signInWithGoogle,
      signInWithPassword,
      signOut,
      user,
    }),
    [isLoaded, register, selectedRole, selectRole, signInWithGoogle, signInWithPassword, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
