import { API_URL, apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getUserReports() {
  return apiFetch<Incident[]>("/api/user/report-history?limit=25");
}

export interface CreateIncidentPayload {
  Detail?: string;
  Level?: string;
  Location: string;
  Title: string;
}

export interface CreateIncidentResult {
  Incident: Incident;
  Message: string;
}

export function createIncident(payload: CreateIncidentPayload) {
  return apiFetch<CreateIncidentResult>("/api/incidents", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function createIncidentWithImages(formData: FormData) {
  const res = await fetch(`${API_URL}/api/incidents`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });

  if (!res.ok) {
    let message = `API error: ${res.status}`;

    try {
      const errorBody = (await res.json()) as { message?: string; Message?: string };
      message = errorBody.message || errorBody.Message || message;
    } catch {
      message = res.statusText ? `API error: ${res.status} ${res.statusText}` : message;
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as unknown as CreateIncidentResult;
  }

  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return undefined as unknown as CreateIncidentResult;
  }

  return res.json() as Promise<CreateIncidentResult>;
}
