import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../services/api";
import type { UserRole } from "../types/user";
import { AuthContext, type AuthContextValue, type AuthUser } from "./AuthContext";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authToken";

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

const VALID_ROLES: UserRole[] = ["admin", "police", "user", "support"];

function toAuthUser(response: CurrentUserResponse): AuthUser {
  const role = (response.Role || "").toLowerCase() as UserRole;

  return {
    avatarUrl: response.AvatarUrl || null,
    email: response.Email || "",
    id: response.Id || "",
    name: response.DisplayName || response.Email || "",
    role: VALID_ROLES.includes(role) ? role : "user",
  };
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(() => !getAuthToken());

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    let isActive = true;
    apiFetch<CurrentUserResponse>("/api/auth/me")
      .then((response) => {
        if (isActive) {
          setUser(toAuthUser(response));
        }
      })
      .catch(() => {
        // Expired token, locked account or deleted account: start signed out.
        clearAuthToken();
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
    setAuthToken(response.Token);
    const nextUser = toAuthUser(response.User);
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
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Signing out locally is enough; the token is simply discarded.
    }

    clearAuthToken();
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(user),
      register,
      signInWithGoogle,
      signInWithPassword,
      signOut,
      user,
    }),
    [isLoaded, register, signInWithGoogle, signInWithPassword, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
