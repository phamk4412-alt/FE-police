export interface Incident {
  Id?: string;
  Title?: string;
  Detail?: string;
  Category?: string;
  Level?: string;
  UrgencyScore?: number;
  ClassificationReason?: string;
  Latitude?: number;
  Longitude?: number;
  District?: string;
  TimeLabel?: string;
  Status?: string;
  Source?: string;
  ReporterName?: string;
  LastUpdatedBy?: string;
  InternalNote?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  id?: string;
  title?: string;
  location?: string;
  status?: string;
  createdAt?: string;
}

export function getIncidentId(incident: Incident) {
  return incident.Id || incident.id || `${getIncidentTitle(incident)}-${getIncidentCreatedAt(incident)}`;
}

export function getIncidentTitle(incident: Incident) {
  return incident.Title || incident.title || "Vụ việc";
}

export function getIncidentStatus(incident: Incident) {
  return incident.Status || incident.status || "Mới tiếp nhận";
}

export function getIncidentLocation(incident: Incident) {
  return incident.District || incident.location || "";
}

export function getIncidentCreatedAt(incident: Incident) {
  return incident.CreatedAt || incident.createdAt || "";
}

export function getIncidentCoordinates(incident: Incident): [number, number] | null {
  if (typeof incident.Longitude !== "number" || typeof incident.Latitude !== "number") {
    return null;
  }

  return [incident.Longitude, incident.Latitude];
}
