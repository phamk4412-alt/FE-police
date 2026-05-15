import { apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getSupportIncidents() {
  return apiFetch<Incident[]>("/api/incidents?sort=created_desc");
}

export function updateSupportIncidentStatus(id: string, status: string) {
  return apiFetch<Incident>(`/api/incidents/${encodeURIComponent(id)}/status`, {
    body: JSON.stringify({ status }),
    method: "PUT",
  });
}
