import { useCallback, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import { API_URL } from "../services/api";
import type { Incident, IncidentSeverity } from "../types/incident";
import {
  getIncidentCategory,
  getIncidentCoordinates,
  getIncidentCreatedAt,
  getIncidentDetail,
  getIncidentId,
  getIncidentImageUrls,
  getIncidentPhone,
  getIncidentReporterName,
  getIncidentSeverity,
  getIncidentStatus,
  getIncidentTitle,
} from "../types/incident";

const statusActions = ["Nhận xử lý", "Đang xử lý", "Hoàn thành"];

const severityLabels: Record<IncidentSeverity, string> = {
  critical: "Khẩn cấp",
  low: "Thấp",
  medium: "Trung bình",
};

function formatDateTime(value: string) {
  if (!value) {
    return "Chưa rõ";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function resolveImageUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getCoordinateText(incident: Incident) {
  const coordinates = getIncidentCoordinates(incident);
  return coordinates ? `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}` : "Chưa có tọa độ";
}

function getSeverityClass(incident: Incident) {
  return `support-severity-${getIncidentSeverity(incident)}`;
}

function SupportDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [statusByIncident, setStatusByIncident] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => getIncidentId(incident) === selectedIncidentId) || incidents[0] || null,
    [incidents, selectedIncidentId],
  );

  const handleIncidentsLoad = useCallback((items: Incident[]) => {
    setIncidents(items);
    setSelectedIncidentId((currentId) => currentId || (items[0] ? getIncidentId(items[0]) : ""));
  }, []);

  function handleSelectIncident(incident: Incident) {
    setSelectedIncidentId(getIncidentId(incident));
  }

  function handleStatusAction(action: string) {
    if (!selectedIncident) {
      return;
    }

    const incidentId = getIncidentId(selectedIncident);

    if (action === "Hoàn thành") {
      setIncidents((current) => {
        const next = current.filter((incident) => getIncidentId(incident) !== incidentId);
        setSelectedIncidentId(next[0] ? getIncidentId(next[0]) : "");
        return next;
      });
      setStatusByIncident((current) => {
        const next = { ...current };
        delete next[incidentId];
        return next;
      });
      return;
    }

    setStatusByIncident((current) => ({
      ...current,
      [incidentId]: action,
    }));
  }

  return (
    <DashboardLayout role="support">
      <section className="page-title support-title">
        <p className="eyebrow">Hỗ trợ hiện trường</p>
        <h2>Tiếp nhận và xử lý báo cáo</h2>
        <span>Danh sách, bản đồ, ảnh hiện trường và thao tác xử lý nằm cùng một màn hình.</span>
      </section>

      <section className="support-workspace">
        <MapView
          className="support-map"
          incidents={incidents}
          onIncidentsLoad={handleIncidentsLoad}
          onIncidentSelect={handleSelectIncident}
          role="support"
          selectedIncident={selectedIncident}
          title="Bản đồ báo cáo"
          variant="full"
        />

        <aside className="support-side-panel">
          <section className="panel support-list-panel">
            <div className="section-heading support-panel-heading">
              <div>
                <span className="eyebrow">Báo cáo</span>
                <h2>Danh sách mới nhất</h2>
              </div>
              <span className="support-count">{incidents.length}</span>
            </div>
            <div className="support-report-list">
              {incidents.map((incident) => {
                const incidentId = getIncidentId(incident);
                const severity = getIncidentSeverity(incident);
                const displayStatus = statusByIncident[incidentId] || getIncidentStatus(incident);

                return (
                  <button
                    className={`support-report-item ${incidentId === selectedIncidentId ? "is-active" : ""}`}
                    key={incidentId}
                    type="button"
                    onClick={() => handleSelectIncident(incident)}
                  >
                    <span className={`support-status-icon ${getSeverityClass(incident)}`} aria-hidden="true" />
                    <span className="support-report-main">
                      <strong>{getIncidentReporterName(incident)}</strong>
                      <small>{getIncidentCategory(incident)}</small>
                      <small>{getIncidentPhone(incident) || "Chưa có SĐT"}</small>
                    </span>
                    <span className="support-report-meta">
                      <span className={`support-severity-badge ${getSeverityClass(incident)}`}>
                        {severityLabels[severity]}
                      </span>
                      <small>{formatDateTime(getIncidentCreatedAt(incident))}</small>
                      <small>{displayStatus}</small>
                    </span>
                  </button>
                );
              })}

              {!incidents.length ? (
                <div className="support-empty-state">Chưa có báo cáo cần hỗ trợ.</div>
              ) : null}
            </div>
          </section>

          <section className="panel support-detail-panel">
            <div className="section-heading">
              <span className="eyebrow">Chi tiết</span>
              <h2>{selectedIncident ? getIncidentTitle(selectedIncident) : "Chưa chọn báo cáo"}</h2>
            </div>

            {selectedIncident ? (
              <>
                <dl className="support-detail-grid">
                  <div>
                    <dt>Họ tên</dt>
                    <dd>{getIncidentReporterName(selectedIncident)}</dd>
                  </div>
                  <div>
                    <dt>SĐT</dt>
                    <dd>{getIncidentPhone(selectedIncident) || "Chưa có"}</dd>
                  </div>
                  <div>
                    <dt>Loại vụ việc</dt>
                    <dd>{getIncidentCategory(selectedIncident)}</dd>
                  </div>
                  <div>
                    <dt>Tọa độ</dt>
                    <dd>{getCoordinateText(selectedIncident)}</dd>
                  </div>
                  <div>
                    <dt>Thời gian</dt>
                    <dd>{formatDateTime(getIncidentCreatedAt(selectedIncident))}</dd>
                  </div>
                  <div>
                    <dt>Mức độ</dt>
                    <dd>
                      <span className={`support-severity-badge ${getSeverityClass(selectedIncident)}`}>
                        {severityLabels[getIncidentSeverity(selectedIncident)]}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="support-description">
                  <span>Mô tả</span>
                  <p>{getIncidentDetail(selectedIncident) || "Không có mô tả."}</p>
                </div>

                <div className="support-photos">
                  <div className="support-detail-subheading">
                    <span>Ảnh hiện trường</span>
                    <small>{getIncidentImageUrls(selectedIncident).length} ảnh</small>
                  </div>

                  {getIncidentImageUrls(selectedIncident).length ? (
                    <div className="support-photo-strip" aria-label="Ảnh hiện trường">
                      {getIncidentImageUrls(selectedIncident).map((imageUrl, index) => {
                        const resolvedUrl = resolveImageUrl(imageUrl);

                        return (
                          <button
                            className="support-photo-thumb"
                            key={`${imageUrl}-${index}`}
                            type="button"
                            onClick={() => setPreviewImage(resolvedUrl)}
                          >
                            <img src={resolvedUrl} alt={`Ảnh hiện trường ${index + 1}`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="support-no-photos">Không có ảnh hiện trường</p>
                  )}
                </div>

                <div className="support-actions" aria-label="Hành động xử lý">
                  {statusActions.map((action) => (
                    <button
                      className={statusByIncident[getIncidentId(selectedIncident)] === action ? "btn btn-primary" : "btn btn-secondary"}
                      key={action}
                      type="button"
                      onClick={() => handleStatusAction(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="support-empty-state">Chọn một báo cáo để xem vị trí, mô tả và ảnh hiện trường.</div>
            )}
          </section>
        </aside>
      </section>

      {previewImage ? (
        <div className="support-image-modal" role="dialog" aria-modal="true" onClick={() => setPreviewImage(null)}>
          <button className="support-modal-close" type="button" aria-label="Đóng ảnh" onClick={() => setPreviewImage(null)}>
            Đóng
          </button>
          <img src={previewImage} alt="Ảnh hiện trường phóng to" />
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default SupportDashboard;
