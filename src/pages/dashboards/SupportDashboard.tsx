import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardStatCards, { type DashboardStatCardItem } from "../../components/common/DashboardStatCards";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MapView from "../../components/map/MapView";
import SupportNewsManager from "../news/SupportNewsManager";
import { API_URL } from "../../services/api";
import { deleteSupportIncident, getSupportIncidents, updateSupportIncidentStatus } from "../../services/supportIncidentService";
import type { Incident, IncidentSeverity } from "../../types/incident";
import { loadSupportCases, saveSupportCases } from "../../utils/supportCasesStorage";
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
} from "../../types/incident";

const statusActions = ["Nhận xử lý", "Đang xử lý", "Hoàn thành"];

const completedStatuses = ["completed", "done", "resolved", "Hoàn thành", "Đã hoàn thành"];

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

function isCompletedStatus(status: string) {
  return completedStatuses.includes(status);
}

function getStoredStatus(action: string) {
  if (action === statusActions[2]) {
    return "done";
  }

  if (action === statusActions[1]) {
    return "processing";
  }

  return "Đã tiếp nhận";
}

function getActionLabel(action: string) {
  return action === statusActions[2] ? "Hoàn thành" : action;
}

function updateIncidentStatus(incident: Incident, status: string): Incident {
  return {
    ...incident,
    Status: incident.Status ? status : incident.Status,
    status,
  };
}

function getActiveSupportIncidents(items: Incident[]) {
  return items.filter((incident) => !isCompletedStatus(getIncidentStatus(incident)));
}

function SupportDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>(() => getActiveSupportIncidents(loadSupportCases()));
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [statusByIncident, setStatusByIncident] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getSupportIncidents()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        const activeItems = getActiveSupportIncidents(items);
        setIncidents(activeItems);
        saveSupportCases(activeItems);
        setSelectedIncidentId((current) => current || (activeItems[0] ? getIncidentId(activeItems[0]) : ""));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => getIncidentId(incident) === selectedIncidentId) || incidents[0] || null,
    [incidents, selectedIncidentId],
  );

  const supportStats = useMemo<DashboardStatCardItem[]>(() => {
    const activeCount = incidents.filter((incident) => {
      const incidentId = getIncidentId(incident);
      const status = statusByIncident[incidentId] || getIncidentStatus(incident);
      return !isCompletedStatus(status);
    }).length;
    const criticalCount = incidents.filter((incident) => getIncidentSeverity(incident) === "critical").length;
    const completedCount = incidents.filter((incident) => {
      const incidentId = getIncidentId(incident);
      const status = statusByIncident[incidentId] || getIncidentStatus(incident);
      return isCompletedStatus(status);
    }).length;

    return [
      { icon: "file", label: "Tổng báo cáo", note: "Đang có trong hàng đợi", tone: "blue", value: incidents.length },
      { icon: "activity", label: "Đang xử lý", note: "Cần theo dõi hiện trường", tone: "orange", value: activeCount },
      { icon: "alert", label: "Khẩn cấp", note: "Ưu tiên điều phối", tone: "red", value: criticalCount },
      { icon: "shield", label: "Hoàn thành", note: "Có thể lưu hồ sơ", tone: "green", value: completedCount },
    ];
  }, [incidents, statusByIncident]);

  function handleSelectIncident(incident: Incident) {
    setSelectedIncidentId(getIncidentId(incident));
  }

  function removeIncidentFromSupport(id: string) {
    setIncidents((current) => {
      const next = current.filter((incident) => getIncidentId(incident) !== id);
      saveSupportCases(next);
      setSelectedIncidentId((currentSelectedId) =>
        currentSelectedId === id ? (next[0] ? getIncidentId(next[0]) : "") : currentSelectedId,
      );
      return next;
    });

    setStatusByIncident((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function handleStatusAction(action: string) {
    if (!selectedIncident) {
      return;
    }

    const incidentId = getIncidentId(selectedIncident);
    const nextStatus = getStoredStatus(action);
    const shouldRemoveFromSupport = isCompletedStatus(nextStatus);

    if (shouldRemoveFromSupport) {
      removeIncidentFromSupport(incidentId);
    } else {
      setIncidents((current) => {
        const next = current.map((incident) =>
          getIncidentId(incident) === incidentId ? updateIncidentStatus(incident, nextStatus) : incident,
        );
        saveSupportCases(next);
        return next;
      });

      setStatusByIncident((current) => ({
        ...current,
        [incidentId]: nextStatus,
      }));
    }

    updateSupportIncidentStatus(incidentId, nextStatus)
      .then((updatedIncident) => {
        if (shouldRemoveFromSupport || isCompletedStatus(getIncidentStatus(updatedIncident))) {
          removeIncidentFromSupport(incidentId);
          return;
        }

        setIncidents((current) => {
          const next = current.map((incident) =>
            getIncidentId(incident) === incidentId ? updateIncidentStatus(updatedIncident, nextStatus) : incident,
          );
          saveSupportCases(next);
          return next;
        });
      })
      .catch(() => undefined);
  }

  async function handleDeleteCase(id: string) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa vụ án này không?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteSupportIncident(id);
      removeIncidentFromSupport(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa vụ án.";
      window.alert(message);
    }
  }

  function handleSupportTabChange(tab: "duty" | "news") {
    navigate(tab === "news" ? "/support/news" : "/support");
  }

  return (
    <DashboardLayout
      activeSupportTab={location.pathname.startsWith("/support/news") ? "news" : "duty"}
      decorVariant={location.pathname.startsWith("/support/news") ? "support-news" : "support-duty"}
      onSupportTabChange={handleSupportTabChange}
      role="support"
    >
      {location.pathname.startsWith("/support/news") ? (
        <SupportNewsManager />
      ) : (
      <>
      <section className="page-title support-title">
        <p className="eyebrow">Hỗ trợ hiện trường</p>
        <h2>Tiếp nhận và xử lý báo cáo</h2>
        <span>Danh sách, bản đồ, ảnh hiện trường và thao tác xử lý nằm cùng một màn hình.</span>
      </section>

      <DashboardStatCards ariaLabel="Thống kê nhanh hỗ trợ" stats={supportStats} />

      <section className="support-workspace">
        <MapView
          className="support-map"
          incidents={incidents}
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
                  <div className="support-report-row" key={incidentId}>
                  <button
                    className={`support-report-item ${incidentId === selectedIncidentId ? "is-active" : ""}`}
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
                    <button className="btn delete-button" type="button" onClick={() => handleDeleteCase(incidentId)}>
                      Xóa
                    </button>
                  </div>
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
                      className={
                        statusByIncident[getIncidentId(selectedIncident)] === getStoredStatus(action)
                          ? "btn btn-primary"
                          : "btn btn-secondary"
                      }
                      key={action}
                      type="button"
                      onClick={() => handleStatusAction(action)}
                    >
                      {getActionLabel(action)}
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
      </>
      )}
    </DashboardLayout>
  );
}

export default SupportDashboard;
