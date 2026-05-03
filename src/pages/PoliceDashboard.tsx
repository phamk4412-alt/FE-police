import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import { getPoliceIncidents } from "../services/policeService";
import type { DashboardStat } from "../types/common";
import type { Incident } from "../types/incident";
import {
  getIncidentCreatedAt,
  getIncidentId,
  getIncidentLocation,
  getIncidentStatus,
  getIncidentTitle,
} from "../types/incident";

const stats: DashboardStat[] = [
  { label: "Vụ việc mới", value: 14, note: "Cần phản hồi ban đầu" },
  { label: "Vụ việc đang xử lý", value: 9, note: "Đã phân công tuần tra" },
  { label: "Khu vực nóng", value: 4, note: "Mật độ cảnh báo cao" },
];

function PoliceDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let isMounted = true;

    function loadIncidents() {
      getPoliceIncidents()
        .then((items) => {
          if (isMounted) {
            setIncidents(items);
          }
        })
        .catch(() => undefined);
    }

    loadIncidents();
    const intervalId = window.setInterval(loadIncidents, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <DashboardLayout role="police">
      <section className="page-title">
        <p className="eyebrow">Bảng điều khiển cảnh sát</p>
        <h2>Điều hành vụ việc</h2>
        <span>Theo dõi vụ việc mới, hồ sơ đang xử lý và khu vực ưu tiên trên bản đồ.</span>
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

      <MapView
        currentLocationLabel="Vị trí hiện tại của cảnh sát"
        defaultToCurrentLocation
        incidents={incidents}
        title="Bản đồ bệnh viện và trụ sở cảnh sát TP.HCM"
      />

      <section className="panel" id="incidents">
        <div className="section-heading">
          <span className="eyebrow">Vụ việc</span>
          <h2>Danh sách vụ việc được phân công</h2>
        </div>
        <div className="incident-list">
          {incidents.map((incident) => (
            <article className="incident-item" key={getIncidentId(incident)}>
              <div>
                <strong>{getIncidentTitle(incident)}</strong>
                <span>{getIncidentLocation(incident)}</span>
              </div>
              <div>
                <span className="status-pill">{getIncidentStatus(incident)}</span>
                <small>{getIncidentCreatedAt(incident)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default PoliceDashboard;
