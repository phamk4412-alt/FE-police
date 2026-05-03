import { useEffect, useState, type FormEvent } from "react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import { createIncident, getUserReports } from "../services/userService";
import type { Incident } from "../types/incident";
import {
  getIncidentCreatedAt,
  getIncidentId,
  getIncidentLocation,
  getIncidentStatus,
  getIncidentTitle,
} from "../types/incident";

function UserDashboard() {
  const [currentLocationText, setCurrentLocationText] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportHistory, setReportHistory] = useState<Incident[]>([]);

  useEffect(() => {
    getUserReports()
      .then(setReportHistory)
      .catch(() => undefined);

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocationText(
          `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        );
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      },
    );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormMessage("");
    setIsSubmitting(true);

    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const location = String(formData.get("location") || currentLocationText).trim();
    const detail = String(formData.get("description") || "").trim();

    try {
      const result = await createIncident({
        Detail: detail,
        Location: location,
        Title: title,
      });

      setReportHistory((current) => [result.Incident, ...current]);
      setFormMessage(result.Message || "Đã gửi báo cáo thành công.");
      form.reset();
      setCurrentLocationText(location);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Không thể gửi báo cáo.");
    } finally {
      setIsSubmitting(false);
    }
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
          <Input label="Tiêu đề" name="title" placeholder="Tiêu đề ngắn của báo cáo" required />
          <Input
            label="Vị trí"
            name="location"
            onChange={(event) => setCurrentLocationText(event.target.value)}
            placeholder="10.776900, 106.700900"
            required
            value={currentLocationText}
          />
          <label className="field" htmlFor="description">
            <span>Mô tả</span>
            <textarea
              id="description"
              name="description"
              placeholder="Mô tả sự việc đã xảy ra"
              rows={5}
            />
          </label>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
          {formMessage ? <span className="form-message">{formMessage}</span> : null}
        </form>

        <section className="panel" id="incidents">
          <div className="section-heading">
            <span className="eyebrow">Lịch sử</span>
            <h2>Báo cáo gần đây</h2>
          </div>
          <div className="incident-list">
            {reportHistory.map((report) => (
              <article className="incident-item" key={getIncidentId(report)}>
                <div>
                  <strong>{getIncidentTitle(report)}</strong>
                  <span>{getIncidentLocation(report)}</span>
                </div>
                <div>
                  <span className="status-pill">{getIncidentStatus(report)}</span>
                  <small>{getIncidentCreatedAt(report)}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <MapView
        currentLocationLabel="Vị trí hiện tại của người dân"
        defaultToCurrentLocation
        incidents={reportHistory}
        title="Bản đồ vị trí sự cố"
      />
    </DashboardLayout>
  );
}

export default UserDashboard;
