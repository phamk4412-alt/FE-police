import { getAuthToken } from "../auth/authToken";
import { API_URL, apiFetch } from "./api";
import type { Incident } from "../types/incident";

export function getUserReports() {
  return apiFetch<Incident[]>("/api/user/report-history?limit=25");
}

export function getIncidents() {
  return apiFetch<Incident[]>("/api/incidents?sort=created_desc");
}

export interface CreateIncidentPayload {
  Detail?: string;
  Location: string;
  Title: string;
}

export interface CreateIncidentResult {
  Incident: Incident;
  Message: string;
  incident?: Incident;
  message?: string;
}

export function readIncidentPhotoMetadata(image: File) {
  const body = new FormData();
  body.append("image", image);
  return apiFetch<{ capturedAt: string | null }>("/api/user/photos/metadata", { body, method: "POST" });
}

export const canStoreMapboxAddress = import.meta.env.VITE_MAPBOX_PERMANENT_GEOCODING === "true";

export async function reverseIncidentAddress(latitude: number, longitude: number, signal: AbortSignal) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) return null;
  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.search = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude), access_token: token,
    country: "VN", language: "vi", types: "address", limit: "1",
    permanent: String(canStoreMapboxAddress),
  }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Không thể tra địa chỉ từ Mapbox.");
  const data: { features?: { properties?: { full_address?: string } }[] } = await response.json();
  return data.features?.[0]?.properties?.full_address?.trim() || null;
}

export function createIncident(payload: CreateIncidentPayload) {
  return apiFetch<CreateIncidentResult>("/api/incidents", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function createIncidentWithImages(formData: FormData) {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/api/incidents`, {
    body: formData,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
