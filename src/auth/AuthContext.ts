import { createContext, useContext } from "react";
import type { UserRole } from "../types/user";

export interface AuthUser {
  avatarUrl: string | null;
  email: string;
  id: string;
  name: string;
  role: UserRole;
}

export interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  signInWithGoogle: (credential: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
