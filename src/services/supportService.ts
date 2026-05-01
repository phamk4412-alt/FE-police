import { apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getSupportRequests() {
  return apiFetch<Incident[]>("/api/support/requests");
}
