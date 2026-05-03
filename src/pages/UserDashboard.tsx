import type { FormEvent } from "react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import type { Incident } from "../types/incident";

const reportHistory: Incident[] = [
  {
    id: 501,
    title: "Báo mất ví",
    status: "Đã tiếp nhận",
    location: "Quận 1",
    createdAt: "2026-04-30 15:30",
  },
  {
    id: 502,
    title: "Đèn đường không hoạt động",
    status: "Đã chuyển xử lý",
    location: "Quận 7",
    createdAt: "2026-04-29 18:45",
  },
];

function UserDashboard() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <DashboardLayout role="user">
      <section className="page-title">
        <p className="eyebrow">Bảng điều khiển người dân</p>
        <h2>Trung tâm báo cáo công dân</h2>
        <span>Gửi báo cáo sự cố và theo dõi lịch sử phản ánh của bạn.</span>
      </section>

      <section className="dashboard-grid">
        <form className="panel report-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span className="eyebrow">Báo cáo</span>
            <h2>Gửi báo cáo sự cố</h2>
          </div>
          <Input label="Tiêu đề" name="title" placeholder="Tiêu đề ngắn của báo cáo" />
          <Input label="Vị trí" name="location" placeholder="Đường, phường/xã, quận/huyện" />
          <label className="field" htmlFor="description">
            <span>Mô tả</span>
            <textarea id="description" placeholder="Mô tả sự việc đã xảy ra" rows={5} />
          </label>
          <Button type="submit">Gửi báo cáo</Button>
        </form>

        <section className="panel" id="incidents">
          <div className="section-heading">
            <span className="eyebrow">Lịch sử</span>
            <h2>Báo cáo gần đây</h2>
          </div>
          <div className="incident-list">
            {reportHistory.map((report) => (
              <article className="incident-item" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>{report.location}</span>
                </div>
                <div>
                  <span className="status-pill">{report.status}</span>
                  <small>{report.createdAt}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <MapView
        currentLocationLabel="Vị trí hiện tại của người dân"
        defaultToCurrentLocation
        title="Bản đồ vị trí sự cố"
      />
    </DashboardLayout>
  );
}

export default UserDashboard;
