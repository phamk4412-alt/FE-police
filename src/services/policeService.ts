import { apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getPoliceIncidents() {
  return apiFetch<Incident[]>("/api/police/incidents");
}
