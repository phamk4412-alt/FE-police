import { apiFetch } from "./api";
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
