import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import hospitalLogo from "../../assets/hospital-logo.svg";
import policeStationLogo from "../../assets/police-station-logo.svg";

interface MapViewProps {
  center?: [number, number];
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

interface OverpassBoundaryElement {
  members?: Array<{
    geometry?: Array<{
      lat: number;
      lon: number;
    }>;
  }>;
}

type BoundaryGeoJson = {
  features: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
      type: "LineString";
    };
    properties: Record<string, never>;
    type: "Feature";
  }>;
  type: "FeatureCollection";
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const HCM_WIKIDATA_ID = "Q1854";
const HCM_MAINLAND_BOUNDS = {
  east: 106.89,
  north: 11.16,
  south: 10.5,
  west: 106.35,
};

const fallbackFacilityMarkers: FacilityMarker[] = [
  {
    address: "73 Yersin, phuong Cau Ong Lanh, Quan 1, TP.HCM",
    coordinates: [106.700981, 10.776889],
    logo: policeStationLogo,
    name: "Tru so Cong an Quan 1",
    type: "police",
  },
  {
    address: "359 Tran Hung Dao, Phuong 10, Quan 5, TP.HCM",
    coordinates: [106.6728, 10.7536],
    logo: policeStationLogo,
    name: "Tru so Cong an Quan 5",
    type: "police",
  },
  {
    address: "47 Thanh Thai, Phuong 14, Quan 10, TP.HCM",
    coordinates: [106.667, 10.7728],
    logo: policeStationLogo,
    name: "Tru so Cong an Quan 10",
    type: "police",
  },
  {
    address: "371 Doan Ket, phuong Binh Tho, TP. Thu Duc, TP.HCM",
    coordinates: [106.7658, 10.8498],
    logo: policeStationLogo,
    name: "Tru so Cong an TP. Thu Duc",
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
    address: "764 Vo Van Kiet, Phuong 1, Quan 5, TP.HCM",
    coordinates: [106.6687, 10.7521],
    logo: hospitalLogo,
    name: "Benh vien Nhi Dong 1",
    type: "hospital",
  },
  {
    address: "215 Hong Bang, Phuong 11, Quan 5, TP.HCM",
    coordinates: [106.6675, 10.7547],
    logo: hospitalLogo,
    name: "Benh vien Dai hoc Y Duoc TP.HCM",
    type: "hospital",
  },
];

const majorHospitalMarkers: FacilityMarker[] = [
  {
    address: "201B Nguyen Chi Thanh, Phuong 12, Quan 5, TP.HCM",
    coordinates: [106.681637, 10.755106],
    logo: hospitalLogo,
    name: "Benh vien Cho Ray",
    type: "hospital",
  },
  {
    address: "215 Hong Bang, Phuong 11, Quan 5, TP.HCM",
    coordinates: [106.6675, 10.7547],
    logo: hospitalLogo,
    name: "Benh vien Dai hoc Y Duoc TP.HCM",
    type: "hospital",
  },
  {
    address: "764 Vo Van Kiet, Phuong 1, Quan 5, TP.HCM",
    coordinates: [106.6687, 10.7521],
    logo: hospitalLogo,
    name: "Benh vien Nhi Dong 1",
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
    address: "2 Nguyen Thong, Phuong 6, Quan 3, TP.HCM",
    coordinates: [106.6866, 10.7828],
    logo: hospitalLogo,
    name: "Benh vien Mat TP.HCM",
    type: "hospital",
  },
  {
    address: "527 Su Van Hanh, Phuong 12, Quan 10, TP.HCM",
    coordinates: [106.6676, 10.7707],
    logo: hospitalLogo,
    name: "Benh vien Nhan dan 115",
    type: "hospital",
  },
  {
    address: "1 No Trang Long, Phuong 7, Quan Binh Thanh, TP.HCM",
    coordinates: [106.6943, 10.8103],
    logo: hospitalLogo,
    name: "Benh vien Nhan dan Gia Dinh",
    type: "hospital",
  },
  {
    address: "120 Hong Bang, Phuong 12, Quan 5, TP.HCM",
    coordinates: [106.6694, 10.7557],
    logo: hospitalLogo,
    name: "Benh vien Hung Vuong",
    type: "hospital",
  },
  {
    address: "280 An Duong Vuong, Phuong 4, Quan 5, TP.HCM",
    coordinates: [106.6831, 10.7568],
    logo: hospitalLogo,
    name: "Benh vien Nguyen Tri Phuong",
    type: "hospital",
  },
  {
    address: "125 Le Loi, Phuong Ben Thanh, Quan 1, TP.HCM",
    coordinates: [106.6966, 10.7737],
    logo: hospitalLogo,
    name: "Benh vien Da khoa Sai Gon",
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

const boundaryQuery = `
  [out:json][timeout:25];
  relation["wikidata"="${HCM_WIKIDATA_ID}"]["boundary"="administrative"];
  out geom;
`;

function limitFacilitiesForDisplay(facilities: FacilityMarker[]) {
  const hospitalMarkers = facilities.filter((facility) => facility.type === "hospital");
  const policeMarkers = facilities.filter((facility) => facility.type === "police");

  function takeHalf(markers: FacilityMarker[]) {
    const limit = Math.max(1, Math.ceil(markers.length / 2));
    return markers.filter((_, index) => index % 2 === 0).slice(0, limit);
  }

  return [...takeHalf(policeMarkers), ...hospitalMarkers];
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

  return addressParts.length ? addressParts.join(", ") : "Thanh pho Ho Chi Minh";
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
      name: tags.name || (type === "hospital" ? "Benh vien" : "Tru so canh sat"),
      type,
    });

    return markers;
  }, []);
}

function withMajorHospitals(facilities: FacilityMarker[]) {
  const policeMarkers = facilities.filter((facility) => facility.type === "police");
  return [...policeMarkers, ...majorHospitalMarkers];
}

function isMainlandPoint([lon, lat]: [number, number]) {
  return (
    lon >= HCM_MAINLAND_BOUNDS.west &&
    lon <= HCM_MAINLAND_BOUNDS.east &&
    lat >= HCM_MAINLAND_BOUNDS.south &&
    lat <= HCM_MAINLAND_BOUNDS.north
  );
}

function splitMainlandSegments(coordinates: Array<[number, number]>) {
  const segments: Array<Array<[number, number]>> = [];
  let currentSegment: Array<[number, number]> = [];

  coordinates.forEach((coordinate) => {
    if (isMainlandPoint(coordinate)) {
      currentSegment.push(coordinate);
      return;
    }

    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    }

    currentSegment = [];
  });

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

function normalizeBoundary(elements: OverpassBoundaryElement[]): BoundaryGeoJson {
  return {
    features: elements.flatMap((element) =>
      (element.members || [])
        .filter((member) => member.geometry && member.geometry.length > 1)
        .flatMap((member) => {
          const coordinates = member.geometry!.map(
            (point) => [point.lon, point.lat] as [number, number],
          );

          return splitMainlandSegments(coordinates).map((segment) => ({
            geometry: {
              coordinates: segment,
              type: "LineString" as const,
            },
            properties: {},
            type: "Feature" as const,
          }));
        }),
    ),
    type: "FeatureCollection",
  };
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
  const data = await fetchOverpass<OverpassBoundaryElement>(boundaryQuery);
  return normalizeBoundary(data.elements || []);
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
  typeElement.textContent = type === "hospital" ? "Benh vien" : "Tru so canh sat";

  const addressElement = document.createElement("small");
  addressElement.textContent = address;

  popupContent.append(titleElement, typeElement, addressElement);

  return popupContent;
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
    id: "hcm-boundary-line",
    paint: {
      "line-color": "#0369a1",
      "line-width": 3,
    },
    source: "hcm-boundary",
    type: "line",
  });
}

function MapView({
  center = [106.660172, 10.762622],
  title = "Ban do tac nghiep",
  zoom = 11,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      center,
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    let isMounted = true;
    let facilityMapMarkers: mapboxgl.Marker[] = [];

    function renderFacilityMarkers(facilities: FacilityMarker[]) {
      facilityMapMarkers.forEach((marker) => marker.remove());
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
      facilityMapMarkers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [center, zoom]);

  return (
    <section className="map-card" id="map">
      <div className="section-heading">
        <span className="eyebrow">Ban do</span>
        <h2>{title}</h2>
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
          <strong>Thieu Mapbox token</strong>
          <span>Them VITE_MAPBOX_TOKEN vao file .env de tai ban do.</span>
        </div>
      )}
    </section>
  );
}

export default MapView;
