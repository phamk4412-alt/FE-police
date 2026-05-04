import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import hospitalLogo from "../../assets/hospital-logo.svg";
import policeStationLogo from "../../assets/police-station-logo.svg";
import { API_URL, apiFetch } from "../../services/api";
import type { Incident } from "../../types/incident";
import {
  getIncidentCoordinates,
  getIncidentCreatedAt,
  getIncidentId,
  getIncidentLocation,
  getIncidentSeverity,
  getIncidentStatus,
  getIncidentTitle,
} from "../../types/incident";

type MapMode = "normal" | "crime";
type CrimePeriod = "week" | "month" | "year";
type CrimeView = "heatmap" | "point";
type FacilityType = "hospital" | "police";
type MapRole = "user" | "support" | "police";
type BoundaryGeoJson = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;
type CrimeFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>;

interface MapViewProps {
  center?: [number, number];
  className?: string;
  currentLocationLabel?: string;
  defaultToCurrentLocation?: boolean;
  incidents?: Incident[];
  initialMode?: MapMode;
  onIncidentsLoad?: (incidents: Incident[]) => void;
  onIncidentSelect?: (incident: Incident) => void;
  role?: MapRole;
  selectedIncident?: Incident | null;
  showModeControls?: boolean;
  showPoiInNormal?: boolean;
  title?: string;
  variant?: "compact" | "full";
  zoom?: number;
}

interface PoliceLocation {
  Username?: string;
  username?: string;
  DisplayName?: string;
  displayName?: string;
  Latitude?: number;
  latitude?: number;
  Longitude?: number;
  longitude?: number;
  District?: string;
  district?: string;
  ShiftId?: string | null;
  shiftId?: string | null;
  Status?: string;
  status?: string;
  UpdatedAt?: string;
  updatedAt?: string;
}

interface FacilityMarker {
  address: string;
  coordinates: [number, number];
  logo: string;
  name: string;
  type: FacilityType;
}

interface OverpassElement {
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const HCM_WIKIDATA_ID = "Q1854";
const HCM_BOUNDARY_URLS = ["/maps/hcm-boundary.geojson", `${API_URL}/api/maps/hcm-boundary`];
const DEFAULT_MAP_CENTER: [number, number] = [106.88, 10.9];
const DEFAULT_MAP_ZOOM = 8.8;
const CRIME_SOURCE_ID = "crime-data";
const CRIME_HEAT_LAYER_ID = "crime-heatmap-layer";
const CRIME_POINT_LAYER_ID = "crime-point-layer";
const INCIDENT_MARKER_LAYER_ID = "incident-marker-layer";
const BUILDING_LAYER_ID = "3d-buildings";

const fallbackFacilityMarkers: FacilityMarker[] = [
  {
    address: "73 Yersin, phuong Cau Ong Lanh, Quan 1, TP.HCM",
    coordinates: [106.700981, 10.776889],
    logo: policeStationLogo,
    name: "Cong an Quan 1",
    type: "police",
  },
  {
    address: "359 Tran Hung Dao, Phuong 10, Quan 5, TP.HCM",
    coordinates: [106.6728, 10.7536],
    logo: policeStationLogo,
    name: "Cong an Quan 5",
    type: "police",
  },
  {
    address: "47 Thanh Thai, Phuong 14, Quan 10, TP.HCM",
    coordinates: [106.667, 10.7728],
    logo: policeStationLogo,
    name: "Cong an Quan 10",
    type: "police",
  },
  {
    address: "201B Nguyen Chi Thanh, Phuong 12, Quan 5, TP.HCM",
    coordinates: [106.681637, 10.755106],
    logo: hospitalLogo,
    name: "Benh vien Cho Ray",
    type: "hospital",
  },
  {
    address: "14 Ly Tu Trong, phuong Ben Nghe, Quan 1, TP.HCM",
    coordinates: [106.700622, 10.777204],
    logo: hospitalLogo,
    name: "Benh vien Nhi Dong 2",
    type: "hospital",
  },
  {
    address: "1 No Trang Long, Phuong 7, Quan Binh Thanh, TP.HCM",
    coordinates: [106.6943, 10.8103],
    logo: hospitalLogo,
    name: "Benh vien Nhan dan Gia Dinh",
    type: "hospital",
  },
];

const overpassQuery = `
  [out:json][timeout:25];
  area["wikidata"="${HCM_WIKIDATA_ID}"]["boundary"="administrative"]->.hcm;
  (
    node["amenity"="hospital"](area.hcm);
    way["amenity"="hospital"](area.hcm);
    relation["amenity"="hospital"](area.hcm);
    node["amenity"="police"](area.hcm);
    way["amenity"="police"](area.hcm);
    relation["amenity"="police"](area.hcm);
  );
  out center tags;
`;

function getElementCoordinates(element: OverpassElement): [number, number] | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return typeof lat === "number" && typeof lon === "number" ? [lon, lat] : null;
}

function normalizeFacilityMarkers(elements: OverpassElement[]) {
  return elements.reduce<FacilityMarker[]>((markers, element) => {
    const coordinates = getElementCoordinates(element);
    const tags = element.tags || {};

    if (!coordinates) {
      return markers;
    }

    const type = tags.amenity === "hospital" ? "hospital" : "police";
    markers.push({
      address:
        [tags["addr:housenumber"], tags["addr:street"], tags["addr:district"], tags["addr:city"]]
          .filter(Boolean)
          .join(", ") || "Thanh pho Ho Chi Minh",
      coordinates,
      logo: type === "hospital" ? hospitalLogo : policeStationLogo,
      name: tags.name || (type === "hospital" ? "Benh vien" : "Cong an"),
      type,
    });

    return markers;
  }, []);
}

function limitFacilitiesForDisplay(facilities: FacilityMarker[]) {
  const police = facilities.filter((facility) => facility.type === "police").slice(0, 10);
  const hospitals = facilities.filter((facility) => facility.type === "hospital").slice(0, 14);
  return [...police, ...hospitals];
}

async function fetchOverpass<T>(query: string) {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    body: new URLSearchParams({ data: query }),
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  return response.json() as Promise<{ elements?: T[] }>;
}

async function fetchHoChiMinhFacilities() {
  const data = await fetchOverpass<OverpassElement>(overpassQuery);
  const facilities = normalizeFacilityMarkers(data.elements || []);
  return facilities.length ? facilities : fallbackFacilityMarkers;
}

async function fetchHoChiMinhBoundary() {
  for (const url of HCM_BOUNDARY_URLS) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response.json() as Promise<BoundaryGeoJson>;
      }
    } catch {
      continue;
    }
  }

  throw new Error("Unable to load Ho Chi Minh boundary data");
}

function createFacilityMarker({ logo, name, type }: FacilityMarker) {
  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = `facility-marker facility-marker-${type}`;
  markerElement.setAttribute("aria-label", name);

  const logoElement = document.createElement("img");
  logoElement.alt = "";
  logoElement.src = logo;
  markerElement.appendChild(logoElement);

  return markerElement;
}

function createFacilityPopup({ address, name, type }: FacilityMarker) {
  const popupContent = document.createElement("div");
  popupContent.className = "facility-popup";
  popupContent.innerHTML = `<strong></strong><span></span><small></small>`;
  popupContent.querySelector("strong")!.textContent = name;
  popupContent.querySelector("span")!.textContent = type === "hospital" ? "Benh vien" : "Cong an";
  popupContent.querySelector("small")!.textContent = address;
  return popupContent;
}

function createCurrentLocationMarker(label: string) {
  const markerElement = document.createElement("div");
  markerElement.className = "current-location-marker";
  markerElement.setAttribute("aria-label", label);
  markerElement.setAttribute("role", "img");
  return markerElement;
}
function normalizePoliceLocation(location: PoliceLocation) {
  const username = location.Username || location.username || "";
  const displayName = location.DisplayName || location.displayName || username || "Canh sat";
  const latitude = Number(location.Latitude ?? location.latitude);
  const longitude = Number(location.Longitude ?? location.longitude);

  if (!username || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    username,
    displayName,
    latitude,
    longitude,
    district: location.District || location.district || "TP.HCM",
    shiftId: location.ShiftId || location.shiftId || "Dang truc",
    status: location.Status || location.status || "Dang trong ca",
    updatedAt: location.UpdatedAt || location.updatedAt || new Date().toISOString(),
  };
}

function createPoliceLocationMarker(label: string) {
  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = "police-location-marker";
  markerElement.setAttribute("aria-label", label);
  return markerElement;
}

function createPoliceLocationPopup(location: NonNullable<ReturnType<typeof normalizePoliceLocation>>) {
  const popupContent = document.createElement("div");
  popupContent.className = "police-location-popup";
  popupContent.innerHTML = `<strong></strong><span></span><small></small>`;
  popupContent.querySelector("strong")!.textContent = location.displayName;
  popupContent.querySelector("span")!.textContent = location.status;
  popupContent.querySelector("small")!.textContent = `${location.district} - ${location.shiftId}`;
  return popupContent;
}

function createIncidentMarker(incident: Incident, isActive: boolean) {
  const severity = getIncidentSeverity(incident);
  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = `${INCIDENT_MARKER_LAYER_ID} incident-map-marker incident-map-marker-${severity}${
    isActive ? " is-active" : ""
  }`;
  markerElement.setAttribute("aria-label", getIncidentTitle(incident));
  return markerElement;
}

function createIncidentPopup(incident: Incident) {
  const popupContent = document.createElement("div");
  popupContent.className = "incident-map-popup";
  popupContent.innerHTML = `<strong></strong><span></span><small></small>`;
  popupContent.querySelector("strong")!.textContent = getIncidentTitle(incident);
  popupContent.querySelector("span")!.textContent = getIncidentStatus(incident);
  popupContent.querySelector("small")!.textContent = [getIncidentLocation(incident), getIncidentCreatedAt(incident)]
    .filter(Boolean)
    .join(" - ");
  return popupContent;
}

function addBoundaryLayer(map: mapboxgl.Map, boundary: BoundaryGeoJson) {
  if (!boundary.features.length || map.getSource("hcm-boundary")) {
    return;
  }

  map.addSource("hcm-boundary", { data: boundary, type: "geojson" });
  map.addLayer({
    id: "hcm-boundary-fill",
    paint: { "fill-color": "#ff4655", "fill-opacity": 0.1 },
    source: "hcm-boundary",
    type: "fill",
  });
  map.addLayer({
    id: "hcm-boundary-line",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ff9aa3", "line-opacity": 0.9, "line-width": 3 },
    source: "hcm-boundary",
    type: "line",
  });
}

function add3DBuildings(map: mapboxgl.Map) {
  if (map.getLayer(BUILDING_LAYER_ID)) {
    return;
  }

  map.addLayer({
    id: BUILDING_LAYER_ID,
    filter: ["==", "extrude", "true"],
    minzoom: 15,
    paint: {
      "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
      "fill-extrusion-color": "#aaaaaa",
      "fill-extrusion-height": ["coalesce", ["get", "height"], 0],
      "fill-extrusion-opacity": 0.6,
    },
    source: "composite",
    "source-layer": "building",
    type: "fill-extrusion",
  });
}

function addCrimeLayers(map: mapboxgl.Map, data: CrimeFeatureCollection) {
  if (!map.getSource(CRIME_SOURCE_ID)) {
    map.addSource(CRIME_SOURCE_ID, { data, type: "geojson" });
  }

  if (!map.getLayer(CRIME_HEAT_LAYER_ID)) {
    map.addLayer({
      id: CRIME_HEAT_LAYER_ID,
      layout: { visibility: "none" },
      maxzoom: 15,
      paint: {
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(56,189,248,0)",
          0.35,
          "#f59e0b",
          0.7,
          "#ff4655",
          1,
          "#ffffff",
        ],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 14, 2.2],
        "heatmap-opacity": 0.78,
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 16, 14, 34],
      },
      source: CRIME_SOURCE_ID,
      type: "heatmap",
    });
  }

  if (!map.getLayer(CRIME_POINT_LAYER_ID)) {
    map.addLayer({
      id: CRIME_POINT_LAYER_ID,
      layout: { visibility: "none" },
      minzoom: 10,
      paint: {
        "circle-color": [
          "match",
          ["get", "severity"],
          "critical",
          "#ff4655",
          "medium",
          "#f59e0b",
          "low",
          "#21c55d",
          "#ff4655",
        ],
        "circle-opacity": 0.88,
        "circle-radius": 7,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
      source: CRIME_SOURCE_ID,
      type: "circle",
    });
  }
}

function setLayerVisibility(map: mapboxgl.Map, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }
}

function updateCrimeView(map: mapboxgl.Map, mode: MapMode, view: CrimeView, isSupportMap: boolean) {
  setLayerVisibility(map, CRIME_HEAT_LAYER_ID, false);
  setLayerVisibility(map, CRIME_POINT_LAYER_ID, false);

  if (isSupportMap || mode !== "crime") {
    return;
  }

  if (view === "heatmap") {
    setLayerVisibility(map, CRIME_HEAT_LAYER_ID, true);
  }

  if (view === "point") {
    setLayerVisibility(map, CRIME_POINT_LAYER_ID, true);
  }
}

function isIncidentInPeriod(incident: Incident, period: CrimePeriod) {
  const createdAt = getIncidentCreatedAt(incident);

  if (!createdAt) {
    return true;
  }

  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const ranges: Record<CrimePeriod, number> = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  return Number.isFinite(createdTime) ? now - createdTime <= ranges[period] : true;
}

function getIncidentType(incident: Incident) {
  return incident.Category || incident.Level || getIncidentTitle(incident);
}

function buildCrimeGeoJson(incidents: Incident[]): CrimeFeatureCollection {
  return {
    features: incidents.flatMap((incident) => {
      const coordinates = getIncidentCoordinates(incident);

      if (!coordinates) {
        return [];
      }

      return {
        geometry: { coordinates, type: "Point" as const },
        properties: {
          severity: getIncidentSeverity(incident),
          status: getIncidentStatus(incident),
          title: getIncidentTitle(incident),
          type: getIncidentType(incident),
        },
        type: "Feature" as const,
      };
    }),
    type: "FeatureCollection",
  };
}

function fetchSupportIncidents() {
  return apiFetch<Incident[]>("/api/incidents?sort=created_desc");
}

function fetchCrimeIncidents() {
  return apiFetch<Incident[]>("/api/incidents?sort=created_desc");
}

function fetchPoliceLocations() {
  return apiFetch<PoliceLocation[]>("/api/police/locations");
}

function updatePoliceLocation(payload: {
  DisplayName: string;
  Latitude: number;
  Longitude: number;
  ShiftId: string;
  Status: string;
  Username: string;
}) {
  return apiFetch<PoliceLocation>("/api/police/me/location", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

function endPoliceShift(username: string) {
  if (!username) {
    return Promise.resolve();
  }

  return apiFetch<void>(`/api/police/me/location?username=${encodeURIComponent(username)}`, {
    method: "DELETE",
  });
}

function sendEndPoliceShiftBeacon(username: string) {
  if (!username) {
    return;
  }

  const payload = JSON.stringify({ Username: username });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      `${API_URL}/api/police/me/location/end`,
      new Blob([payload], { type: "application/json" }),
    );
    return;
  }

  void fetch(`${API_URL}/api/police/me/location/end`, {
    body: payload,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  });
}

function MapView({
  center = DEFAULT_MAP_CENTER,
  className = "",
  currentLocationLabel = "Vi tri hien tai",
  defaultToCurrentLocation = false,
  incidents = [],
  initialMode = "normal",
  onIncidentsLoad,
  onIncidentSelect,
  role = "user",
  selectedIncident = null,
  showModeControls = false,
  showPoiInNormal = true,
  title = "Ban do tac nghiep",
  variant = "full",
  zoom = DEFAULT_MAP_ZOOM,
}: MapViewProps) {
  const { user } = useUser();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const currentLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hasCenteredOnCurrentLocationRef = useRef(false);
  const facilityMapMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const incidentMapMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const policeLocationMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [facilities, setFacilities] = useState<FacilityMarker[]>(fallbackFacilityMarkers);
  const [crimeDataIncidents, setCrimeDataIncidents] = useState<Incident[]>([]);
  const [supportIncidents, setSupportIncidents] = useState<Incident[]>([]);
  const [policeLocations, setPoliceLocations] = useState<PoliceLocation[]>([]);
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [crimePeriod, setCrimePeriod] = useState<CrimePeriod>("month");
  const [crimeType, setCrimeType] = useState("all");
  const [crimeView, setCrimeView] = useState<CrimeView>("heatmap");

  const isSupportMap = role === "support";
  const crimeIncidents = isSupportMap ? [] : incidents.length ? incidents : crimeDataIncidents;
  const markerIncidents = isSupportMap ? supportIncidents : [];

  const crimeTypes = useMemo(
    () => Array.from(new Set(crimeIncidents.map(getIncidentType).filter(Boolean))),
    [crimeIncidents],
  );

  const filteredIncidents = useMemo(
    () =>
      crimeIncidents.filter(
        (incident) =>
          isIncidentInPeriod(incident, crimePeriod) &&
          (crimeType === "all" || getIncidentType(incident) === crimeType),
      ),
    [crimeIncidents, crimePeriod, crimeType],
  );

  useEffect(() => {
    if (!defaultToCurrentLocation || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => setCurrentLocation([position.coords.longitude, position.coords.latitude]),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    );
  }, [defaultToCurrentLocation]);

  useEffect(() => {
    if (!isSupportMap) {
      setSupportIncidents([]);
      onIncidentsLoad?.([]);
      return;
    }

    let isMounted = true;

    function loadSupportIncidents() {
      fetchSupportIncidents()
        .then((items) => {
          if (!isMounted) {
            return;
          }

          setSupportIncidents(items);
          onIncidentsLoad?.(items);
        })
        .catch(() => undefined);
    }

    loadSupportIncidents();
    const intervalId = window.setInterval(loadSupportIncidents, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isSupportMap, onIncidentsLoad]);

  useEffect(() => {
    if (isSupportMap || incidents.length) {
      setCrimeDataIncidents([]);
      return;
    }

    let isMounted = true;

    function loadCrimeIncidents() {
      fetchCrimeIncidents()
        .then((items) => {
          if (isMounted) {
            setCrimeDataIncidents(items);
          }
        })
        .catch(() => undefined);
    }

    loadCrimeIncidents();
    const intervalId = window.setInterval(loadCrimeIncidents, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [incidents.length, isSupportMap]);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      antialias: true,
      bearing: -30,
      center,
      container: mapContainerRef.current,
      pitch: 60,
      style: "mapbox://styles/mapbox/dark-v11",
      zoom,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    let isMounted = true;

    map.on("load", () => {
      add3DBuildings(map);

      fetchHoChiMinhBoundary()
        .then((boundary) => {
          if (isMounted) {
            addBoundaryLayer(map, boundary);
          }
        })
        .catch(() => undefined);

      if (!isSupportMap) {
        addCrimeLayers(map, buildCrimeGeoJson(filteredIncidents));
      }
    });

    if (!isSupportMap) {
      fetchHoChiMinhFacilities()
        .then((items) => {
          if (isMounted) {
            setFacilities(items);
          }
        })
        .catch(() => {
          if (isMounted) {
            setFacilities(fallbackFacilityMarkers);
          }
        });
    }

    return () => {
      isMounted = false;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      currentLocationMarkerRef.current?.remove();
      facilityMapMarkersRef.current.forEach((marker) => marker.remove());
      incidentMapMarkersRef.current.forEach((marker) => marker.remove());
      policeLocationMarkersRef.current.forEach((marker) => marker.remove());
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      currentLocationMarkerRef.current = null;
      hasCenteredOnCurrentLocationRef.current = false;
      facilityMapMarkersRef.current = [];
      incidentMapMarkersRef.current = [];
      policeLocationMarkersRef.current.clear();
      popupRef.current = null;
    };
  }, [center, isSupportMap, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;

    if (!map || !container) {
      return;
    }

    const resize = () => map.resize();
    resize();
    window.addEventListener("resize", resize);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserverRef.current.observe(container);
    }

    return () => {
      window.removeEventListener("resize", resize);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [className, variant]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    facilityMapMarkersRef.current.forEach((marker) => marker.remove());

    if (isSupportMap || mode !== "normal" || !showPoiInNormal) {
      facilityMapMarkersRef.current = [];
      return;
    }

    facilityMapMarkersRef.current = limitFacilitiesForDisplay(facilities).map((facility) =>
      new mapboxgl.Marker({ anchor: "bottom", element: createFacilityMarker(facility) })
        .setLngLat(facility.coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 28 }).setDOMContent(createFacilityPopup(facility)))
        .addTo(map),
    );
  }, [facilities, isSupportMap, mode, showPoiInNormal]);

  useEffect(() => {
    if (role !== "police") {
      setPoliceLocations([]);
      return;
    }

    let isMounted = true;

    function loadPoliceLocations() {
      fetchPoliceLocations()
        .then((locations) => {
          if (isMounted) {
            setPoliceLocations(locations);
          }
        })
        .catch(() => undefined);
    }

    loadPoliceLocations();
    const intervalId = window.setInterval(loadPoliceLocations, 4000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [role]);

  useEffect(() => {
    if (role !== "police" || !navigator.geolocation) {
      return;
    }

    const username = user?.id || user?.primaryEmailAddress?.emailAddress || user?.username || "police-session";
    const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Canh sat";
    let lastSentAt = 0;
    let hasSharedLocation = false;
    let latestPosition: GeolocationPosition | null = null;

    function sendPosition(position: GeolocationPosition, force = false) {
      latestPosition = position;
      const now = Date.now();
      if (!force && now - lastSentAt < 5000) {
        return;
      }

      lastSentAt = now;
      hasSharedLocation = true;
      setCurrentLocation([position.coords.longitude, position.coords.latitude]);
      void updatePoliceLocation({
        DisplayName: displayName,
        Latitude: position.coords.latitude,
        Longitude: position.coords.longitude,
        ShiftId: `shift-${new Date().toISOString().slice(0, 10)}`,
        Status: "Dang trong ca",
        Username: username,
      })
        .then(() => fetchPoliceLocations().then(setPoliceLocations))
        .catch(() => undefined);
    }

    navigator.geolocation.getCurrentPosition(sendPosition, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(sendPosition, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    });

    const heartbeatId = window.setInterval(() => {
      if (latestPosition) {
        sendPosition(latestPosition, true);
      }
    }, 8000);

    function handlePageExit() {
      if (hasSharedLocation) {
        sendEndPoliceShiftBeacon(username);
      }
    }

    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(heartbeatId);
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
      if (hasSharedLocation) {
        void endPoliceShift(username).catch(() => undefined);
      }
    };
  }, [role, user?.fullName, user?.id, user?.primaryEmailAddress?.emailAddress, user?.username]);
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !currentLocation) {
      return;
    }

    currentLocationMarkerRef.current?.remove();
    currentLocationMarkerRef.current = new mapboxgl.Marker({
      element: createCurrentLocationMarker(currentLocationLabel),
    })
      .setLngLat(currentLocation)
      .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(currentLocationLabel))
      .addTo(map);

    if (defaultToCurrentLocation && !hasCenteredOnCurrentLocationRef.current) {
      hasCenteredOnCurrentLocationRef.current = true;
      map.easeTo({
        bearing: -30,
        center: currentLocation,
        duration: 700,
        pitch: 60,
        zoom: Math.max(zoom, 14),
      });
    }
  }, [currentLocation, currentLocationLabel, defaultToCurrentLocation, zoom]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || role !== "police") {
      policeLocationMarkersRef.current.forEach((marker) => marker.remove());
      policeLocationMarkersRef.current.clear();
      return;
    }

    const nextUsernames = new Set<string>();

    policeLocations.forEach((rawLocation) => {
      const location = normalizePoliceLocation(rawLocation);
      if (!location) {
        return;
      }

      nextUsernames.add(location.username);
      policeLocationMarkersRef.current.get(location.username)?.remove();

      const marker = new mapboxgl.Marker({
        anchor: "center",
        element: createPoliceLocationMarker(`${location.displayName} dang trong ca`),
      })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setDOMContent(createPoliceLocationPopup(location)))
        .addTo(map);

      policeLocationMarkersRef.current.set(location.username, marker);
    });

    policeLocationMarkersRef.current.forEach((marker, username) => {
      if (!nextUsernames.has(username)) {
        marker.remove();
        policeLocationMarkersRef.current.delete(username);
      }
    });
  }, [policeLocations, role]);
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    incidentMapMarkersRef.current.forEach((marker) => marker.remove());

    if (!isSupportMap) {
      incidentMapMarkersRef.current = [];
      return;
    }

    const selectedId = selectedIncident ? getIncidentId(selectedIncident) : "";
    incidentMapMarkersRef.current = markerIncidents.flatMap((incident) => {
      const coordinates = getIncidentCoordinates(incident);

      if (!coordinates) {
        return [];
      }

      const marker = new mapboxgl.Marker({
        anchor: "bottom",
        element: createIncidentMarker(incident, getIncidentId(incident) === selectedId),
      })
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 28 }).setDOMContent(createIncidentPopup(incident)))
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        onIncidentSelect?.(incident);
      });

      return [marker];
    });
  }, [isSupportMap, markerIncidents, onIncidentSelect, selectedIncident]);

  useEffect(() => {
    const map = mapRef.current;
    const incident = selectedIncident;
    const coordinates = incident ? getIncidentCoordinates(incident) : null;

    if (!isSupportMap || !map || !incident || !coordinates) {
      return;
    }

    map.easeTo({
      bearing: -30,
      center: coordinates,
      duration: 700,
      pitch: 60,
      zoom: Math.max(zoom, 15),
    });

    popupRef.current?.remove();
    popupRef.current = new mapboxgl.Popup({ offset: 28 })
      .setLngLat(coordinates)
      .setDOMContent(createIncidentPopup(incident))
      .addTo(map);
  }, [isSupportMap, selectedIncident, zoom]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded() || isSupportMap) {
      return;
    }

    add3DBuildings(map);
    addCrimeLayers(map, buildCrimeGeoJson(filteredIncidents));
    const source = map.getSource(CRIME_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(buildCrimeGeoJson(filteredIncidents));
    updateCrimeView(map, mode, crimeView, isSupportMap);
  }, [crimeView, filteredIncidents, isSupportMap, mode]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    updateCrimeView(map, mode, crimeView, isSupportMap);
  }, [crimeView, isSupportMap, mode]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    function handleClick(event: mapboxgl.MapMouseEvent) {
      if (isSupportMap || mode !== "crime" || !mapRef.current) {
        return;
      }

      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: [CRIME_POINT_LAYER_ID],
      });
      const featureTitle = features[0]?.properties?.title;
      const incident = filteredIncidents.find((item) => getIncidentTitle(item) === featureTitle);

      if (!incident) {
        return;
      }

      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ offset: 16 })
        .setLngLat(event.lngLat)
        .setDOMContent(createIncidentPopup(incident))
        .addTo(mapRef.current);
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [filteredIncidents, isSupportMap, mode]);

  return (
    <section className={`map-card map-card-${variant} map-wrapper ${className}`.trim()} id="map">
      <div className="section-heading map-heading">
        <div>
          <span className="eyebrow">Ban do</span>
          <h2>{title}</h2>
        </div>
      </div>

      {MAPBOX_TOKEN ? (
        <div aria-label={title} className="mapbox-container map-container" ref={mapContainerRef} role="region" />
      ) : (
        <div className="map-token-warning">
          <strong>Thieu Mapbox token</strong>
          <span>Them VITE_MAPBOX_TOKEN vao file .env de tai ban do.</span>
        </div>
      )}

      {showModeControls ? (
        <div className="map-controls-footer">
          <div className="map-mode-controls" aria-label="Che do ban do">
            <button
              className={mode === "normal" ? "is-active" : ""}
              type="button"
              onClick={() => setMode("normal")}
            >
              Ban do thuong
            </button>
            <button
              className={mode === "crime" ? "is-active" : ""}
              type="button"
              onClick={() => setMode("crime")}
            >
              Vu an
            </button>
          </div>

          <div className="crime-filters">
            <div className="crime-view-controls" aria-label="Kieu hien thi vu an">
              <button
                className={crimeView === "heatmap" ? "is-active" : ""}
                disabled={mode !== "crime"}
                type="button"
                onClick={() => setCrimeView("heatmap")}
              >
                Heatmap
              </button>
              <button
                className={crimeView === "point" ? "is-active" : ""}
                disabled={mode !== "crime"}
                type="button"
                onClick={() => setCrimeView("point")}
              >
                Cham
              </button>
            </div>
            <label>
              <span>Thoi gian</span>
              <select
                disabled={mode !== "crime"}
                value={crimePeriod}
                onChange={(event) => setCrimePeriod(event.target.value as CrimePeriod)}
              >
                <option value="week">Tuan</option>
                <option value="month">Thang</option>
                <option value="year">Nam</option>
              </select>
            </label>
            <label>
              <span>Loai toi pham</span>
              <select
                disabled={mode !== "crime"}
                value={crimeType}
                onChange={(event) => setCrimeType(event.target.value)}
              >
                <option value="all">Tat ca</option>
                {crimeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="map-footer-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                mapRef.current?.easeTo({
                  bearing: -30,
                  center: currentLocation || center,
                  duration: 700,
                  pitch: 60,
                  zoom: currentLocation ? Math.max(zoom, 14) : zoom,
                })
              }
            >
              Canh lai ban do
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default MapView;
