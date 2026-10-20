import { apiFetch } from "./api";
import type { Incident } from "../types/incident";

interface UpdateIncidentStatusResult {
  Incident?: Incident;
  incident?: Incident;
}

export function getSupportIncidents() {
  return apiFetch<Incident[]>("/api/incidents?sort=created_desc");
}

export function deleteSupportIncident(id: string) {
  return apiFetch<void>(`/api/support/incidents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function updateSupportIncidentStatus(id: string, status: string): Promise<Incident> {
  const result = await apiFetch<Incident | UpdateIncidentStatusResult>(`/api/incidents/${encodeURIComponent(id)}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });

  const wrappedResult = result as UpdateIncidentStatusResult;
  return wrappedResult.Incident || wrappedResult.incident || (result as Incident);
}
