import { useEffect, useState } from "react";
import DashboardStatCards, { type DashboardStatCardItem } from "../../components/common/DashboardStatCards";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MapView from "../../components/map/MapView";
import { getPoliceIncidents } from "../../services/policeService";
import type { Incident } from "../../types/incident";
import {
  getIncidentCreatedAt,
  getIncidentId,
  getIncidentLocation,
  getIncidentStatus,
  getIncidentTitle,
} from "../../types/incident";

const stats: DashboardStatCardItem[] = [
  { icon: "bell", label: "Vụ việc mới", note: "Cần phản hồi ban đầu", tone: "red", value: 14 },
  { icon: "activity", label: "Đang xử lý", note: "Đã phân công tuần tra", tone: "orange", value: 9 },
  { icon: "mapPin", label: "Khu vực nóng", note: "Mật độ cảnh báo cao", tone: "purple", value: 4 },
];

function formatIncidentTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

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

      <DashboardStatCards ariaLabel="Thống kê nhanh cảnh sát" stats={stats} />

      <MapView
        currentLocationLabel="Vị trí hiện tại của cảnh sát"
        defaultToCurrentLocation
        incidents={incidents}
        role="police"
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
                <small>{formatIncidentTime(getIncidentCreatedAt(incident))}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default PoliceDashboard;
