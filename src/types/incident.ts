export interface Incident {
  Id?: string;
  Title?: string;
  Detail?: string;
  Category?: string;
  Latitude?: number;
  Longitude?: number;
  District?: string;
  TimeLabel?: string;
  Status?: string;
  Source?: string;
  ReporterName?: string;
  ReporterPhone?: string;
  Phone?: string;
  LastUpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  ImageUrls?: string[];
  id?: string;
  title?: string;
  detail?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  status?: string;
  createdAt?: string;
  phone?: string;
  reporterName?: string;
  reporterPhone?: string;
  imageUrls?: string[];
}

export function getIncidentId(incident: Incident) {
  return incident.Id || incident.id || `${getIncidentTitle(incident)}-${getIncidentCreatedAt(incident)}`;
}

export function getIncidentTitle(incident: Incident) {
  return incident.Title || incident.title || "Vụ việc";
}

export function getIncidentDetail(incident: Incident) {
  return incident.Detail || incident.detail || "";
}

export function getIncidentCategory(incident: Incident) {
  return incident.Category || incident.category || getIncidentTitle(incident);
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
  const longitude = incident.Longitude ?? incident.longitude;
  const latitude = incident.Latitude ?? incident.latitude;

  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return null;
  }

  return [longitude, latitude];
}

export function getIncidentReporterName(incident: Incident) {
  return incident.ReporterName || incident.reporterName || "Người báo cáo";
}

export function getIncidentPhone(incident: Incident) {
  return incident.ReporterPhone || incident.Phone || incident.reporterPhone || incident.phone || "";
}

export function getIncidentImageUrls(incident: Incident) {
  return incident.ImageUrls || incident.imageUrls || [];
}
