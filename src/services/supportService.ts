import { apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getSupportRequests() {
  return apiFetch<Incident[]>("/api/incidents?sort=created_desc");
}
