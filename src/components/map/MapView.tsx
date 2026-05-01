import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  center?: [number, number];
  title?: string;
  zoom?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

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

    const marker = new mapboxgl.Marker({ color: "#c24135" })
      .setLngLat(center)
      .setPopup(new mapboxgl.Popup().setText(title))
      .addTo(map);

    return () => {
      marker.remove();
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
