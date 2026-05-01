import type { User } from "./user";
import type { UserRole } from "./user";

export interface LoginRequest {
  username: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}
