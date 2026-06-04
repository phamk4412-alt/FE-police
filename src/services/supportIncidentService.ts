import { apiFetch } from "./api";
import { withBackendRoleSession } from "./backendAuthService";
import type { Incident } from "../types/incident";

interface UpdateIncidentStatusResult {
  Incident?: Incident;
  incident?: Incident;
}

export function getSupportIncidents() {
  return withBackendRoleSession("support", () => apiFetch<Incident[]>("/api/incidents?sort=created_desc"));
}

export function deleteSupportIncident(id: string) {
  return withBackendRoleSession("support", () =>
    apiFetch<void>(`/api/support/incidents/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}

export async function updateSupportIncidentStatus(id: string, status: string): Promise<Incident> {
  const result = await withBackendRoleSession("support", () =>
    apiFetch<Incident | UpdateIncidentStatusResult>(`/api/incidents/${encodeURIComponent(id)}/status`, {
      body: JSON.stringify({ status }),
      method: "PATCH",
    }),
  );

  const wrappedResult = result as UpdateIncidentStatusResult;
  return wrappedResult.Incident || wrappedResult.incident || (result as Incident);
}
