import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import type { DashboardStat } from "../types/common";
import type { Incident } from "../types/incident";

const stats: DashboardStat[] = [
  { label: "Vụ việc mới", value: 14, note: "Cần phản hồi ban đầu" },
  { label: "Vụ việc đang xử lý", value: 9, note: "Đã phân công tuần tra" },
  { label: "Khu vực nóng", value: 4, note: "Mật độ cảnh báo cao" },
];

const incidents: Incident[] = [
  {
    id: 1001,
    title: "Phản ánh tiếng ồn gần công viên trung tâm",
    status: "Mới tiếp nhận",
    location: "Quận 1",
    createdAt: "2026-05-01 08:20",
  },
  {
    id: 1002,
    title: "Va chạm giao thông trên đường Nguyễn Trãi",
    status: "Đang xử lý",
    location: "Quận 5",
    createdAt: "2026-05-01 09:05",
  },
  {
    id: 1003,
    title: "Báo cáo hoạt động đáng ngờ",
    status: "Đã phân công",
    location: "Quận 3",
    createdAt: "2026-05-01 10:12",
  },
];

function PoliceDashboard() {
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

      <MapView title="Bản đồ bệnh viện và trụ sở cảnh sát TP.HCM" />

      <section className="panel" id="incidents">
        <div className="section-heading">
          <span className="eyebrow">Vụ việc</span>
          <h2>Danh sách vụ việc được phân công</h2>
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
