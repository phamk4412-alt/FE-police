import { useEffect, useMemo, useState } from "react";
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

const completedStatuses = ["completed", "done", "resolved", "hoàn thành", "đã hoàn thành", "đã xử lý"];
const newStatuses = ["new", "pending", "mới tiếp nhận", "chờ xử lý"];

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    function loadIncidents() {
      getPoliceIncidents()
        .then((items) => {
          if (isMounted) {
            setIncidents(items);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }

    loadIncidents();
    const intervalId = window.setInterval(loadIncidents, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo<DashboardStatCardItem[]>(() => {
    const statuses = incidents.map((incident) => normalizeStatus(getIncidentStatus(incident)));
    const newCount = statuses.filter((status) => newStatuses.includes(status)).length;
    const completedCount = statuses.filter((status) => completedStatuses.includes(status)).length;
    const display = (value: number) => (isLoading ? "–" : value);

    return [
      { icon: "bell", label: "Vụ việc mới", note: "Cần phản hồi ban đầu", tone: "red", value: display(newCount) },
      {
        icon: "activity",
        label: "Đang xử lý",
        note: "Đã tiếp nhận, chưa hoàn thành",
        tone: "orange",
        value: display(incidents.length - newCount - completedCount),
      },
      { icon: "shield", label: "Hoàn thành", note: "Đã xử lý xong", tone: "green", value: display(completedCount) },
    ];
  }, [incidents, isLoading]);

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
          {isLoading ? <div className="empty-state is-loading">Đang tải danh sách vụ việc...</div> : null}
          {!isLoading && incidents.length === 0 ? (
            <div className="empty-state">Chưa có vụ việc nào được phân công.</div>
          ) : null}
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
