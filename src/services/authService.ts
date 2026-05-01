import { apiFetch } from "./api";
import type { LoginRequest, LoginResponse } from "../types/auth";
import type { User } from "../types/user";

export function login(payload: LoginRequest) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return apiFetch<User>("/api/auth/me", {
    method: "GET",
  });
}
