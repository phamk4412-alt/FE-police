import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import hospitalLogo from "../../assets/hospital-logo.svg";
import policeStationLogo from "../../assets/police-station-logo.svg";
import { API_URL } from "../../services/api";

interface MapViewProps {
  center?: [number, number];
  defaultToCurrentLocation?: boolean;
  currentLocationLabel?: string;
  title?: string;
  zoom?: number;
}

type FacilityType = "hospital" | "police";

interface FacilityMarker {
  address: string;
  coordinates: [number, number];
  logo: string;
  name: string;
  type: FacilityType;
}

interface OverpassElement {
  center?: {
    lat: number;
    lon: number;
  };
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

type BoundaryGeoJson = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const HCM_WIKIDATA_ID = "Q1854";
const HCM_BOUNDARY_URLS = ["/maps/hcm-boundary.geojson", `${API_URL}/api/maps/hcm-boundary`];

const fallbackFacilityMarkers: FacilityMarker[] = [
  {
    address: "73 Yersin, phường Cầu Ông Lãnh, Quận 1, TP.HCM",
    coordinates: [106.700981, 10.776889],
    logo: policeStationLogo,
    name: "Trụ sở Công an Quận 1",
    type: "police",
  },
  {
    address: "359 Trần Hưng Đạo, Phường 10, Quận 5, TP.HCM",
    coordinates: [106.6728, 10.7536],
    logo: policeStationLogo,
    name: "Trụ sở Công an Quận 5",
    type: "police",
  },
  {
    address: "47 Thành Thái, Phường 14, Quận 10, TP.HCM",
    coordinates: [106.667, 10.7728],
    logo: policeStationLogo,
    name: "Trụ sở Công an Quận 10",
    type: "police",
  },
  {
    address: "371 Đoàn Kết, phường Bình Thọ, TP. Thủ Đức, TP.HCM",
    coordinates: [106.7658, 10.8498],
    logo: policeStationLogo,
    name: "Trụ sở Công an TP. Thủ Đức",
    type: "police",
  },
  {
    address: "201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM",
    coordinates: [106.681637, 10.755106],
    logo: hospitalLogo,
    name: "Bệnh viện Chợ Rẫy",
    type: "hospital",
  },
  {
    address: "14 Lý Tự Trọng, phường Bến Nghé, Quận 1, TP.HCM",
    coordinates: [106.700622, 10.777204],
    logo: hospitalLogo,
    name: "Bệnh viện Nhi Đồng 2",
    type: "hospital",
  },
  {
    address: "764 Võ Văn Kiệt, Phường 1, Quận 5, TP.HCM",
    coordinates: [106.6687, 10.7521],
    logo: hospitalLogo,
    name: "Bệnh viện Nhi Đồng 1",
    type: "hospital",
  },
  {
    address: "215 Hồng Bàng, Phường 11, Quận 5, TP.HCM",
    coordinates: [106.6675, 10.7547],
    logo: hospitalLogo,
    name: "Bệnh viện Đại học Y Dược TP.HCM",
    type: "hospital",
  },
];

const majorHospitalMarkers: FacilityMarker[] = [
  {
    address: "201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM",
    coordinates: [106.681637, 10.755106],
    logo: hospitalLogo,
    name: "Bệnh viện Chợ Rẫy",
    type: "hospital",
  },
  {
    address: "215 Hồng Bàng, Phường 11, Quận 5, TP.HCM",
    coordinates: [106.6675, 10.7547],
    logo: hospitalLogo,
    name: "Bệnh viện Đại học Y Dược TP.HCM",
    type: "hospital",
  },
  {
    address: "764 Võ Văn Kiệt, Phường 1, Quận 5, TP.HCM",
    coordinates: [106.6687, 10.7521],
    logo: hospitalLogo,
    name: "Bệnh viện Nhi Đồng 1",
    type: "hospital",
  },
  {
    address: "14 Lý Tự Trọng, phường Bến Nghé, Quận 1, TP.HCM",
    coordinates: [106.700622, 10.777204],
    logo: hospitalLogo,
    name: "Bệnh viện Nhi Đồng 2",
    type: "hospital",
  },
  {
    address: "2 Nguyễn Thông, Phường 6, Quận 3, TP.HCM",
    coordinates: [106.6866, 10.7828],
    logo: hospitalLogo,
    name: "Bệnh viện Mắt TP.HCM",
    type: "hospital",
  },
  {
    address: "527 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM",
    coordinates: [106.6676, 10.7707],
    logo: hospitalLogo,
    name: "Bệnh viện Nhân dân 115",
    type: "hospital",
  },
  {
    address: "1 Nơ Trang Long, Phường 7, Quận Bình Thạnh, TP.HCM",
    coordinates: [106.6943, 10.8103],
    logo: hospitalLogo,
    name: "Bệnh viện Nhân dân Gia Định",
    type: "hospital",
  },
  {
    address: "120 Hồng Bàng, Phường 12, Quận 5, TP.HCM",
    coordinates: [106.6694, 10.7557],
    logo: hospitalLogo,
    name: "Bệnh viện Hùng Vương",
    type: "hospital",
  },
  {
    address: "280 An Dương Vương, Phường 4, Quận 5, TP.HCM",
    coordinates: [106.6831, 10.7568],
    logo: hospitalLogo,
    name: "Bệnh viện Nguyễn Tri Phương",
    type: "hospital",
  },
  {
    address: "125 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
    coordinates: [106.6966, 10.7737],
    logo: hospitalLogo,
    name: "Bệnh viện Đa khoa Sài Gòn",
    type: "hospital",
  },
  {
    address: "284 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP.HCM",
    coordinates: [106.6864, 10.7688],
    logo: hospitalLogo,
    name: "Bệnh viện Từ Dũ",
    type: "hospital",
  },
  {
    address: "201 Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM",
    coordinates: [106.6812, 10.7557],
    logo: hospitalLogo,
    name: "Bệnh viện Chấn thương Chỉnh hình",
    type: "hospital",
  },
  {
    address: "88 Thành Thái, Phường 12, Quận 10, TP.HCM",
    coordinates: [106.6654, 10.7727],
    logo: hospitalLogo,
    name: "Bệnh viện Da Liễu TP.HCM",
    type: "hospital",
  },
  {
    address: "1 Lý Thường Kiệt, Phường 7, Quận Tân Bình, TP.HCM",
    coordinates: [106.6532, 10.7928],
    logo: hospitalLogo,
    name: "Bệnh viện Thống Nhất",
    type: "hospital",
  },
  {
    address: "786 Nguyễn Kiệm, Phường 3, Quận Gò Vấp, TP.HCM",
    coordinates: [106.6783, 10.8158],
    logo: hospitalLogo,
    name: "Bệnh viện Quân y 175",
    type: "hospital",
  },
  {
    address: "3 Đường 17A, Bình Trị Đông B, Quận Bình Tân, TP.HCM",
    coordinates: [106.5924, 10.7409],
    logo: hospitalLogo,
    name: "Bệnh viện Quốc tế City",
    type: "hospital",
  },
  {
    address: "532A Kinh Dương Vương, Phường Bình Trị Đông B, Quận Bình Tân, TP.HCM",
    coordinates: [106.5838, 10.7338],
    logo: hospitalLogo,
    name: "Bệnh viện Triều An",
    type: "hospital",
  },
  {
    address: "15A Nguyễn Lương Bằng, Phường Tân Phú, Quận 7, TP.HCM",
    coordinates: [106.7281, 10.7312],
    logo: hospitalLogo,
    name: "Bệnh viện FV",
    type: "hospital",
  },
  {
    address: "2B Phổ Quang, Phường 2, Quận Tân Bình, TP.HCM",
    coordinates: [106.6695, 10.8039],
    logo: hospitalLogo,
    name: "Bệnh viện Hoàn Mỹ Sài Gòn",
    type: "hospital",
  },
  {
    address: "6 Nguyễn Lương Bằng, Phường Tân Phú, Quận 7, TP.HCM",
    coordinates: [106.7299, 10.7305],
    logo: hospitalLogo,
    name: "Bệnh viện Tim Tâm Đức",
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
    node["healthcare"="hospital"](area.hcm);
    way["healthcare"="hospital"](area.hcm);
    relation["healthcare"="hospital"](area.hcm);
    node["amenity"="police"](area.hcm);
    way["amenity"="police"](area.hcm);
    relation["amenity"="police"](area.hcm);
  );
  out center tags;
`;

function limitFacilitiesForDisplay(facilities: FacilityMarker[]) {
  const hospitalMarkers = facilities.filter((facility) => facility.type === "hospital");
  const policeMarkers = facilities.filter((facility) => facility.type === "police");

  function takePercent(markers: FacilityMarker[], percent: number) {
    const limit = Math.max(1, Math.ceil(markers.length * percent));
    return markers.slice(0, limit);
  }

  return [...takePercent(policeMarkers, 0.3), ...takePercent(hospitalMarkers, 0.5)];
}

function getElementCoordinates(element: OverpassElement): [number, number] | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }

  return [lon, lat];
}

function getElementAddress(tags: Record<string, string> = {}) {
  const addressParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:district"],
    tags["addr:city"] || "TP.HCM",
  ].filter(Boolean);

  return addressParts.length ? addressParts.join(", ") : "Thành phố Hồ Chí Minh";
}

function normalizeFacilityMarkers(elements: OverpassElement[]) {
  return elements.reduce<FacilityMarker[]>((markers, element) => {
    const coordinates = getElementCoordinates(element);
    const tags = element.tags || {};
    const type =
      tags.amenity === "hospital" || tags.healthcare === "hospital" ? "hospital" : "police";

    if (!coordinates) {
      return markers;
    }

    markers.push({
      address: getElementAddress(tags),
      coordinates,
      logo: type === "hospital" ? hospitalLogo : policeStationLogo,
      name: tags.name || (type === "hospital" ? "Bệnh viện" : "Trụ sở cảnh sát"),
      type,
    });

    return markers;
  }, []);
}

function withMajorHospitals(facilities: FacilityMarker[]) {
  const policeMarkers = facilities.filter((facility) => facility.type === "police");
  return [...policeMarkers, ...majorHospitalMarkers];
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
  return withMajorHospitals(normalizeFacilityMarkers(data.elements || []));
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

  const titleElement = document.createElement("strong");
  titleElement.textContent = name;

  const typeElement = document.createElement("span");
  typeElement.textContent = type === "hospital" ? "Bệnh viện" : "Trụ sở cảnh sát";

  const addressElement = document.createElement("small");
  addressElement.textContent = address;

  popupContent.append(titleElement, typeElement, addressElement);

  return popupContent;
}

function createCurrentLocationMarker(label: string) {
  const markerElement = document.createElement("div");
  markerElement.className = "current-location-marker";
  markerElement.setAttribute("aria-label", label);
  markerElement.setAttribute("role", "img");

  return markerElement;
}

function addBoundaryLayer(map: mapboxgl.Map, boundary: BoundaryGeoJson) {
  if (!boundary.features.length || map.getSource("hcm-boundary")) {
    return;
  }

  map.addSource("hcm-boundary", {
    data: boundary,
    type: "geojson",
  });

  map.addLayer({
    id: "hcm-boundary-fill",
    paint: {
      "fill-color": "#f97316",
      "fill-opacity": 0.14,
    },
    source: "hcm-boundary",
    type: "fill",
  });

  map.addLayer({
    id: "hcm-boundary-halo",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#ffffff",
      "line-opacity": 0.95,
      "line-width": 8,
    },
    source: "hcm-boundary",
    type: "line",
  });

  map.addLayer({
    id: "hcm-boundary-line",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#dc2626",
      "line-opacity": 1,
      "line-width": 4,
    },
    source: "hcm-boundary",
    type: "line",
  });
}

function MapView({
  center = [106.88, 10.9],
  defaultToCurrentLocation = false,
  currentLocationLabel = "Vị trí hiện tại",
  title = "Bản đồ tác nghiệp",
  zoom = 8.8,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [showFacilityMarkers, setShowFacilityMarkers] = useState(true);

  useEffect(() => {
    if (!defaultToCurrentLocation || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.longitude, position.coords.latitude]);
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      },
    );
  }, [defaultToCurrentLocation]);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      return;
    }

    const mapCenter = currentLocation ?? center;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      center: mapCenter,
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: currentLocation ? Math.max(zoom, 13) : zoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    let isMounted = true;
    let currentLocationMarker: mapboxgl.Marker | null = null;
    let facilityMapMarkers: mapboxgl.Marker[] = [];

    if (currentLocation) {
      currentLocationMarker = new mapboxgl.Marker({
        element: createCurrentLocationMarker(currentLocationLabel),
      })
        .setLngLat(currentLocation)
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setText(currentLocationLabel))
        .addTo(map);
    }

    function renderFacilityMarkers(facilities: FacilityMarker[]) {
      facilityMapMarkers.forEach((marker) => marker.remove());

      if (!showFacilityMarkers) {
        facilityMapMarkers = [];
        return;
      }

      facilityMapMarkers = limitFacilitiesForDisplay(facilities).map((facility) =>
        new mapboxgl.Marker({
          anchor: "bottom",
          element: createFacilityMarker(facility),
        })
          .setLngLat(facility.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 28 }).setDOMContent(createFacilityPopup(facility)),
          )
          .addTo(map),
      );
    }

    map.on("load", () => {
      fetchHoChiMinhBoundary()
        .then((boundary) => {
          if (isMounted) {
            addBoundaryLayer(map, boundary);
          }
        })
        .catch(() => undefined);
    });

    renderFacilityMarkers(withMajorHospitals(fallbackFacilityMarkers));

    fetchHoChiMinhFacilities()
      .then((facilities) => {
        if (isMounted && facilities.length) {
          renderFacilityMarkers(facilities);
        }
      })
      .catch(() => {
        if (isMounted) {
          renderFacilityMarkers(withMajorHospitals(fallbackFacilityMarkers));
        }
      });

    return () => {
      isMounted = false;
      currentLocationMarker?.remove();
      facilityMapMarkers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [center, currentLocation, currentLocationLabel, showFacilityMarkers, zoom]);

  return (
    <section className="map-card" id="map">
      <div className="section-heading map-heading">
        <div>
          <span className="eyebrow">Bản đồ</span>
          <h2>{title}</h2>
        </div>
        <button
          aria-label={showFacilityMarkers ? "Ẩn điểm trên bản đồ" : "Hiện điểm trên bản đồ"}
          aria-pressed={showFacilityMarkers}
          className={`map-toggle ${showFacilityMarkers ? "is-active" : ""}`}
          type="button"
          onClick={() => setShowFacilityMarkers((isVisible) => !isVisible)}
        >
          <span className="map-toggle-sun" aria-hidden="true" />
          <span className="map-toggle-moon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="map-toggle-thumb" aria-hidden="true" />
        </button>
      </div>

      {MAPBOX_TOKEN ? (
        <div
          aria-label={title}
          className="mapbox-container"
          ref={mapContainerRef}
          role="region"
        />
      ) : (
        <div className="map-token-warning">
          <strong>Thiếu Mapbox token</strong>
          <span>Thêm VITE_MAPBOX_TOKEN vào file .env để tải bản đồ.</span>
        </div>
      )}
    </section>
  );
}

export default MapView;
