import { apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getUserReports() {
  return apiFetch<Incident[]>("/api/user/reports");
}
