import { apiFetch } from "./api";

export interface AdminSummary {
  totalAccounts: number;
  totalReports: number;
  activeIncidents: number;
  systemLogs: number;
}

export function getAdminSummary() {
  return apiFetch<AdminSummary>("/api/admin/summary");
}
