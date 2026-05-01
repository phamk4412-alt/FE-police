interface MapViewProps {
  title?: string;
}

function MapView({ title = "Operational Map" }: MapViewProps) {
  return (
    <section className="map-card" id="map">
      <div className="section-heading">
        <span className="eyebrow">Map</span>
        <h2>{title}</h2>
      </div>
      <div className="map-placeholder">
        <div className="map-grid" />
        <div className="map-marker marker-one" />
        <div className="map-marker marker-two" />
        <div className="map-marker marker-three" />
        <strong>Map Area</strong>
        <span>Ready for Leaflet or another map provider later.</span>
      </div>
    </section>
  );
}

export default MapView;
