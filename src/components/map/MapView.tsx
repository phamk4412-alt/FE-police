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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

type FacilityType = "hospital" | "police";

interface FacilityMarker {
  coordinates: [number, number];
  logo: string;
  name: string;
  type: FacilityType;
}

const facilityMarkers: FacilityMarker[] = [
  {
    coordinates: [106.700981, 10.776889],
    logo: policeStationLogo,
    name: "Trụ sở Công an Quận 1",
    type: "police",
  },
  {
    coordinates: [106.677351, 10.759814],
    logo: policeStationLogo,
    name: "Trụ sở Công an Quận 5",
    type: "police",
  },
  {
    coordinates: [106.681637, 10.755106],
    logo: hospitalLogo,
    name: "Bệnh viện Chợ Rẫy",
    type: "hospital",
  },
  {
    coordinates: [106.700622, 10.777204],
    logo: hospitalLogo,
    name: "Bệnh viện Nhi Đồng 2",
    type: "hospital",
  },
];

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

function MapView({
  center = [106.660172, 10.762622],
  title = "Bản đồ tác nghiệp",
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

    const centerMarker = new mapboxgl.Marker({ color: "#c24135" })
      .setLngLat(center)
      .setPopup(new mapboxgl.Popup().setText(title))
      .addTo(map);

    const facilityMapMarkers = facilityMarkers.map((facility) =>
      new mapboxgl.Marker({
        anchor: "bottom",
        element: createFacilityMarker(facility),
      })
        .setLngLat(facility.coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 28 }).setText(facility.name))
        .addTo(map),
    );

    return () => {
      centerMarker.remove();
      facilityMapMarkers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [center, title, zoom]);

  return (
    <section className="map-card" id="map">
      <div className="section-heading">
        <span className="eyebrow">Bản đồ</span>
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
          <strong>Thiếu Mapbox token</strong>
          <span>Thêm VITE_MAPBOX_TOKEN vào file .env để tải bản đồ.</span>
        </div>
      )}
    </section>
  );
}

export default MapView;
