import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import AdminIcon from "../../components/admin/AdminIcons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MapView from "../../components/map/MapView";
import { getPoliceIncidents } from "../../services/policeService";
import type { Incident } from "../../types/incident";
import { getIncidentCoordinates, getIncidentCreatedAt, getIncidentId, getIncidentLocation, getIncidentStatus, getIncidentTitle } from "../../types/incident";
import PoliceIncidentDialog from "./police/PoliceIncidentDialog";
import PoliceReportDialog from "./police/PoliceReportDialog";
import PoliceShiftPanel from "./police/PoliceShiftPanel";
import { formatPoliceTime, getStatusGroup, isInPolicePeriod, matchesPoliceSearch, statusLabels, type PolicePeriod, type StatusGroup } from "./police/policeUtils";
import "./police/police.css";

const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769];
const filters = ["all", "new", "processing", "completed"] as const;

function PoliceDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StatusGroup>("all");
  const [view, setView] = useState<"dashboard" | "history">("dashboard");
  const [period, setPeriod] = useState<PolicePeriod>("all");
  const [detail, setDetail] = useState<Incident | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [notice, setNotice] = useState("");
  const [mapTarget, setMapTarget] = useState<Incident | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mapArea = useRef<HTMLElement | null>(null);

  const loadIncidents = useCallback(async (background = false) => {
    if (background && requestRef.current) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const items = await getPoliceIncidents(controller.signal);
      if (controller.signal.aborted) return;
      setIncidents(items);
      setError("");
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Không tải được danh sách vụ việc.");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadIncidents(), 0);
    const interval = window.setInterval(() => void loadIncidents(true), 10000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(interval); requestRef.current?.abort(); };
  }, [loadIncidents]);

  const counts = useMemo(() => {
    const values = { all: incidents.length, new: 0, processing: 0, completed: 0 };
    incidents.forEach((item) => { values[getStatusGroup(getIncidentStatus(item))] += 1; });
    return values;
  }, [incidents]);
  const visibleIncidents = useMemo(() => incidents.filter((item) =>
    (filter === "all" || getStatusGroup(getIncidentStatus(item)) === filter)
    && matchesPoliceSearch(search, [getIncidentId(item), getIncidentTitle(item), getIncidentLocation(item), item.Category ?? item.category ?? ""])), [incidents, filter, search]);
  const history = useMemo(() => incidents.filter((item) => Boolean(user?.name) && item.LastUpdatedBy === user?.name), [incidents, user?.name]);
  const visibleHistory = useMemo(() => history.filter((item) => isInPolicePeriod(item.UpdatedAt || getIncidentCreatedAt(item), period)), [history, period]);
  const mapCenter = useMemo(() => mapTarget ? getIncidentCoordinates(mapTarget) ?? DEFAULT_CENTER : DEFAULT_CENTER, [mapTarget]);

  function showOnMap(incident: Incident) {
    setDetail(null);
    setView("dashboard");
    setMapTarget(incident);
    setNotice(`Đang xem vị trí: ${getIncidentTitle(incident)}`);
    window.requestAnimationFrame(() => mapArea.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <DashboardLayout role="police"><div className="police-page">
    <nav className="police-tabs" aria-label="Điều hướng Police">
      <button type="button" aria-pressed={view === "dashboard"} onClick={() => setView("dashboard")}><AdminIcon name="chart" />Bảng điều khiển</button>
      <button type="button" aria-pressed={view === "history"} onClick={() => setView("history")}><AdminIcon name="clock" />Lịch sử vụ việc</button>
    </nav>
    <div className="police-page-heading"><div><p className="police-eyebrow">{view === "dashboard" ? "Bảng điều khiển cảnh sát" : "Hồ sơ công tác"}</p><h2>{view === "dashboard" ? "Điều hành vụ việc" : "Lịch sử vụ việc"}</h2><p>{view === "dashboard" ? "Theo dõi vụ việc mới, hồ sơ đang xử lý và khu vực ưu tiên." : "Tra cứu các vụ việc bạn là người cập nhật gần nhất."}</p></div><button className="police-button police-button-primary" type="button" onClick={() => setShowReport(true)}><span aria-hidden="true">＋</span>Tạo báo cáo hiện trường</button></div>
    <PoliceShiftPanel />
    {notice ? <div className="police-notice" role="status">{notice}<button type="button" aria-label="Đóng thông báo" onClick={() => setNotice("")}><AdminIcon name="close" /></button></div> : null}
    {error ? <div className="police-error" role="alert"><div><strong>Không thể cập nhật vụ việc</strong><p>{error}</p>{incidents.length ? <small>Đang hiển thị dữ liệu tải thành công gần nhất.</small> : null}</div><button className="police-button" disabled={isLoading} type="button" onClick={() => { setIsLoading(true); void loadIncidents(); }}>{isLoading ? "Đang tải..." : "Thử lại"}</button></div> : null}
    {view === "dashboard" ? <>
      <section className="police-stats" aria-label="Thống kê vụ việc">{(["new", "processing", "completed"] as const).map((group) => <article className={`police-stat police-tone-${group}`} key={group}><AdminIcon name={group === "new" ? "bell" : group === "processing" ? "activity" : "shield"} /><strong>{(isLoading || error) && !incidents.length ? "–" : counts[group]}</strong><h3>{statusLabels[group]}</h3><p>{group === "new" ? "Cần phản hồi ban đầu" : group === "processing" ? "Đã tiếp nhận, chưa hoàn thành" : "Đã xử lý xong"}</p></article>)}</section>
      <div className="police-operations">
        <section className="police-panel police-cases" id="incidents" aria-labelledby="police-cases-heading" aria-busy={isLoading}>
          <div className="police-panel-heading"><div><p className="police-eyebrow">Vụ việc</p><h3 id="police-cases-heading">Vụ việc trong khu vực</h3><p>Dữ liệu mới nhất từ bộ phận điều phối</p></div><label className="police-search"><AdminIcon name="search" /><input aria-label="Tìm vụ việc" placeholder="Tìm mã, nội dung, khu vực..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
          <div className="police-filters" aria-label="Lọc trạng thái">{filters.map((value) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "Tất cả" : statusLabels[value]}<span>{counts[value]}</span></button>)}</div>
          {isLoading && !incidents.length ? <p className="police-empty" role="status">Đang tải danh sách vụ việc...</p> : null}
          {!isLoading && !error && !visibleIncidents.length ? <div className="police-empty"><AdminIcon name="file" /><p>{incidents.length ? "Không có vụ việc phù hợp với bộ lọc." : "Chưa có vụ việc trong khu vực."}</p></div> : null}
          {visibleIncidents.map((incident) => { const group = getStatusGroup(getIncidentStatus(incident)); return <article className="police-case" key={getIncidentId(incident)}><span className={`police-case-icon police-tone-${group}`}><AdminIcon name={group === "new" ? "bell" : group === "completed" ? "shield" : "activity"} /></span><div className="police-case-content"><div className="police-case-meta"><span className="police-case-id">#{getIncidentId(incident).slice(0, 8).toUpperCase()}</span><span className={`police-badge police-tone-${group}`}>{statusLabels[group]}</span></div><h4>{getIncidentTitle(incident)}</h4><p><AdminIcon name="mapPin" />{getIncidentLocation(incident) || "Chưa có địa chỉ"}</p><time dateTime={getIncidentCreatedAt(incident)}><AdminIcon name="clock" />{formatPoliceTime(getIncidentCreatedAt(incident))}</time></div><button className="police-detail-link" type="button" onClick={() => setDetail(incident)} aria-label={`Chi tiết ${getIncidentTitle(incident)}`}>Chi tiết <span aria-hidden="true">›</span></button></article>; })}
        </section>
        <section className="police-map-area" ref={mapArea} aria-label="Bản đồ điều hành">{mapTarget ? <div className="police-map-selection" role="status"><AdminIcon name="mapPin" /><span>{getIncidentTitle(mapTarget)}</span><button type="button" aria-label="Bỏ chọn vị trí" onClick={() => setMapTarget(null)}><AdminIcon name="close" /></button></div> : null}<MapView className="police-operation-map" center={mapCenter} zoom={mapTarget ? 15 : 12} currentLocationLabel="Vị trí hiện tại của cảnh sát" defaultToCurrentLocation={!mapTarget} incidents={incidents} selectedIncident={mapTarget} role="police" showModeControls={false} title="Vị trí đơn vị và vụ việc TP.HCM" />{mapTarget ? <p className="police-map-note">{getIncidentCoordinates(mapTarget)?.slice().reverse().join(", ")} · Chọn điểm vụ việc trên bản đồ để xem thông tin và chỉ đường.</p> : null}</section>
      </div>
    </> : <>
      <section className="police-history-stats" aria-label="Thống kê lịch sử"><article><span>Cập nhật gần nhất bởi bạn</span><strong>{history.length}</strong></article><article><span>Hoàn thành</span><strong>{history.filter((item) => getStatusGroup(getIncidentStatus(item)) === "completed").length}</strong></article><article><span>Chưa hoàn thành</span><strong>{history.filter((item) => getStatusGroup(getIncidentStatus(item)) !== "completed").length}</strong></article></section>
      <section className="police-panel police-history"><div className="police-panel-heading"><div><p className="police-eyebrow">Danh sách</p><h3>Vụ việc bạn cập nhật</h3></div><div className="police-filters" aria-label="Lọc lịch sử">{(["all", "week", "month"] as const).map((value) => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === "all" ? "Tất cả" : value === "week" ? "Tuần này" : "Tháng này"}</button>)}</div></div><div className="police-table-scroll"><table><thead><tr><th>Mã vụ việc</th><th>Loại / địa chỉ</th><th>Cập nhật lúc</th><th>Trạng thái</th><th><span className="police-sr-only">Thao tác</span></th></tr></thead><tbody>{visibleHistory.map((incident) => <tr key={getIncidentId(incident)}><td className="police-case-id">#{getIncidentId(incident).slice(0, 8).toUpperCase()}</td><td><strong>{getIncidentTitle(incident)}</strong><small>{getIncidentLocation(incident)}</small></td><td>{formatPoliceTime(incident.UpdatedAt || getIncidentCreatedAt(incident))}</td><td><span className={`police-badge police-tone-${getStatusGroup(getIncidentStatus(incident))}`}>{statusLabels[getStatusGroup(getIncidentStatus(incident))]}</span></td><td><button type="button" className="police-detail-link" onClick={() => setDetail(incident)} aria-label={`Chi tiết ${getIncidentTitle(incident)}`}>Chi tiết ›</button></td></tr>)}</tbody></table></div>{!isLoading && !visibleHistory.length ? <p className="police-empty">Chưa có vụ việc bạn cập nhật trong khoảng thời gian này.</p> : null}<p className="police-history-note">Danh sách dựa trên người cập nhật gần nhất, chưa phải toàn bộ lịch sử tham gia xử lý.</p></section>
    </>}
    {detail ? <PoliceIncidentDialog incident={detail} onClose={() => setDetail(null)} onShowMap={showOnMap} /> : null}
    {showReport ? <PoliceReportDialog onClose={() => setShowReport(false)} onCreated={(incident) => { setIncidents((items) => [incident, ...items.filter((item) => getIncidentId(item) !== getIncidentId(incident))]); setNotice("Đã tạo báo cáo hiện trường thành công."); setShowReport(false); }} /> : null}
  </div></DashboardLayout>;
}

export default PoliceDashboard;
