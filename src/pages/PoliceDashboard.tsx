import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import type { DashboardStat } from "../types/common";
import type { Incident } from "../types/incident";

const stats: DashboardStat[] = [
  { label: "Vu viec moi", value: 14, note: "Need first response" },
  { label: "Vu viec dang xu ly", value: 9, note: "Assigned to patrols" },
  { label: "Khu vuc nong", value: 4, note: "High density zones" },
];

const incidents: Incident[] = [
  {
    id: 1001,
    title: "Noise complaint near central park",
    status: "New",
    location: "District 1",
    createdAt: "2026-05-01 08:20",
  },
  {
    id: 1002,
    title: "Traffic collision on Nguyen Trai",
    status: "Processing",
    location: "District 5",
    createdAt: "2026-05-01 09:05",
  },
  {
    id: 1003,
    title: "Suspicious activity report",
    status: "Assigned",
    location: "District 3",
    createdAt: "2026-05-01 10:12",
  },
];

function PoliceDashboard() {
  return (
    <DashboardLayout role="police">
      <section className="page-title">
        <p className="eyebrow">Police Dashboard</p>
        <h2>Incident operations</h2>
        <span>Track new incidents, active cases, and priority map areas.</span>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>

      <MapView title="Police response map" />

      <section className="panel" id="incidents">
        <div className="section-heading">
          <span className="eyebrow">Incidents</span>
          <h2>Assigned incident list</h2>
        </div>
        <div className="incident-list">
          {incidents.map((incident) => (
            <article className="incident-item" key={incident.id}>
              <div>
                <strong>{incident.title}</strong>
                <span>{incident.location}</span>
              </div>
              <div>
                <span className="status-pill">{incident.status}</span>
                <small>{incident.createdAt}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default PoliceDashboard;
