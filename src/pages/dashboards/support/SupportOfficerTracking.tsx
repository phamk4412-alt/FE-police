import { useEffect, useMemo, useState } from "react";
import AdminIcon from "../../../components/admin/AdminIcons";
import {
  supportOfficerDemoData,
  type DemoConnectionStatus,
  type DemoOfficer,
  type DemoShiftStatus,
} from "./supportOfficerDemoData";
import "./supportOfficerTracking.css";

type SummaryFilter = "all" | DemoShiftStatus | "disconnected";

const shiftLabels: Record<DemoShiftStatus, string> = {
  "on-duty": "Đang trong ca",
  break: "Đang tạm nghỉ",
  "off-duty": "Chưa vào ca",
};

const connectionLabels: Record<DemoConnectionStatus, string> = {
  connected: "Đang kết nối",
  disconnected: "Mất kết nối",
};

function SupportOfficerTracking() {
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<"all" | DemoShiftStatus>("all");
  const [connectionFilter, setConnectionFilter] = useState<"all" | DemoConnectionStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<DemoOfficer | null>(null);

  const counts = useMemo(() => ({
    all: supportOfficerDemoData.length,
    "on-duty": supportOfficerDemoData.filter((officer) => officer.shiftStatus === "on-duty").length,
    break: supportOfficerDemoData.filter((officer) => officer.shiftStatus === "break").length,
    "off-duty": supportOfficerDemoData.filter((officer) => officer.shiftStatus === "off-duty").length,
    disconnected: supportOfficerDemoData.filter((officer) => officer.connectionStatus === "disconnected").length,
  }), []);

  const filteredOfficers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi-VN");
    return supportOfficerDemoData.filter((officer) => {
      const matchesSummary = summaryFilter === "all"
        || (summaryFilter === "disconnected"
          ? officer.connectionStatus === "disconnected"
          : officer.shiftStatus === summaryFilter);
      const matchesShift = shiftFilter === "all" || officer.shiftStatus === shiftFilter;
      const matchesConnection = connectionFilter === "all" || officer.connectionStatus === connectionFilter;
      const matchesSearch = !normalizedSearch
        || `${officer.name} ${officer.accountCode}`.toLocaleLowerCase("vi-VN").includes(normalizedSearch);
      return matchesSummary && matchesShift && matchesConnection && matchesSearch;
    });
  }, [connectionFilter, search, shiftFilter, summaryFilter]);

  useEffect(() => {
    if (!selectedOfficer) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedOfficer(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOfficer]);

  function chooseSummaryFilter(filter: SummaryFilter) {
    setSummaryFilter((current) => current === filter ? "all" : filter);
    setShiftFilter("all");
    setConnectionFilter("all");
  }

  function focusOfficer(officer: DemoOfficer) {
    setSelectedOfficer(officer);
  }

  return (
    <section className="support-officer-page" aria-labelledby="support-officer-title">
      <header className="support-officer-heading">
        <div>
          <p className="eyebrow">Giám sát lực lượng</p>
          <h2 id="support-officer-title">Theo dõi trạng thái Công an</h2>
          <p>Quan sát ca trực, kết nối và dữ liệu vị trí được chia sẻ.</p>
        </div>
        <span className="support-officer-view-badge"><AdminIcon name="shield" /> Chỉ có quyền xem</span>
      </header>

      <p className="support-officer-demo-note" role="note">
        <AdminIcon name="activity" /> Giao diện đang dùng dữ liệu minh họa; trạng thái và vị trí không phải dữ liệu thời gian thực.
      </p>

      <div className="support-officer-stats" aria-label="Thống kê trạng thái Công an">
        <button className={`support-officer-stat ${summaryFilter === "all" ? "is-selected" : ""}`} type="button" aria-pressed={summaryFilter === "all"} onClick={() => chooseSummaryFilter("all")}>
          <AdminIcon name="users" /><strong>{counts.all}</strong><span>Tổng số Công an</span><small>Tất cả tài khoản</small>
        </button>
        <button className={`support-officer-stat is-on-duty ${summaryFilter === "on-duty" ? "is-selected" : ""}`} type="button" aria-pressed={summaryFilter === "on-duty"} onClick={() => chooseSummaryFilter("on-duty")}>
          <AdminIcon name="shield" /><strong>{counts["on-duty"]}</strong><span>Đang trong ca</span><small>Ca trực đang hoạt động</small>
        </button>
        <button className={`support-officer-stat is-break ${summaryFilter === "break" ? "is-selected" : ""}`} type="button" aria-pressed={summaryFilter === "break"} onClick={() => chooseSummaryFilter("break")}>
          <AdminIcon name="clock" /><strong>{counts.break}</strong><span>Đang tạm nghỉ</span><small>Ca trực chưa kết thúc</small>
        </button>
        <button className={`support-officer-stat is-off-duty ${summaryFilter === "off-duty" ? "is-selected" : ""}`} type="button" aria-pressed={summaryFilter === "off-duty"} onClick={() => chooseSummaryFilter("off-duty")}>
          <AdminIcon name="clock" /><strong>{counts["off-duty"]}</strong><span>Chưa vào ca</span><small>Chưa bắt đầu ca</small>
        </button>
        <button className={`support-officer-stat is-disconnected ${summaryFilter === "disconnected" ? "is-selected" : ""}`} type="button" aria-pressed={summaryFilter === "disconnected"} onClick={() => chooseSummaryFilter("disconnected")}>
          <AdminIcon name="activity" /><strong>{counts.disconnected}</strong><span>Mất kết nối</span><small>Trạng thái kết nối</small>
        </button>
      </div>

      <div className="support-officer-workspace">
        <section className="support-officer-list panel" aria-labelledby="support-officer-list-title">
          <div className="support-officer-list-heading">
            <div>
              <p className="eyebrow">Danh sách</p>
              <h3 id="support-officer-list-title">Danh sách Công an</h3>
              <small>{filteredOfficers.length} trên tổng số {supportOfficerDemoData.length} tài khoản mẫu</small>
            </div>
            <label className="support-officer-search">
              <AdminIcon name="search" />
              <span className="support-officer-sr-only">Tìm tên hoặc mã tài khoản</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc mã..." />
            </label>
          </div>

          <div className="support-officer-filters">
            <div className="support-officer-shift-filters" role="group" aria-label="Lọc theo ca trực">
              <span>Ca trực</span>
              {(["all", "on-duty", "break", "off-duty"] as const).map((filter) => {
                const isActive = filter === "all"
                  ? summaryFilter === "all" && shiftFilter === "all"
                  : shiftFilter === filter || summaryFilter === filter;
                return (
                <button key={filter} className={isActive ? "is-active" : ""} type="button" aria-pressed={isActive} onClick={() => { setSummaryFilter("all"); setShiftFilter(filter); }}>
                  {filter === "all" ? "Tất cả" : shiftLabels[filter]}
                </button>
              );})}
            </div>
            <label className="support-officer-connection-filter">
              <span>Kết nối</span>
              <select value={connectionFilter} onChange={(event) => { setSummaryFilter("all"); setConnectionFilter(event.target.value as "all" | DemoConnectionStatus); }}>
                <option value="all">Tất cả kết nối</option>
                <option value="connected">Đang kết nối</option>
                <option value="disconnected">Mất kết nối</option>
              </select>
            </label>
          </div>

          <div className="support-officer-table-head" aria-hidden="true">
            <span>Công an</span><span>Ca trực</span><span>Kết nối</span><span>Vị trí / cập nhật</span><span />
          </div>
          <div className="support-officer-rows">
            {filteredOfficers.map((officer) => (
              <button className={`support-officer-row ${selectedOfficer?.id === officer.id ? "is-selected" : ""}`} key={officer.id} type="button" onClick={() => focusOfficer(officer)}>
                <span className="support-officer-identity">
                  <span className="support-officer-avatar">{officer.initials}</span>
                  <span><strong>{officer.name}</strong><small>{officer.accountCode} · {officer.unit}</small></span>
                </span>
                <span className="support-officer-shift-cell">
                  <span className={`support-officer-pill is-${officer.shiftStatus}`}><i />{shiftLabels[officer.shiftStatus]}</span>
                  <small>{officer.shiftStartedAt ? `Bắt đầu ${officer.shiftStartedAt}` : "Chưa bắt đầu ca"}</small>
                </span>
                <span className={`support-officer-connection is-${officer.connectionStatus}`}><i />{connectionLabels[officer.connectionStatus]}</span>
                <span className="support-officer-location-cell">
                  <strong><AdminIcon name="mapPin" />{officer.gpsLocation || "Không có dữ liệu GPS"}</strong>
                  <small>{officer.gpsUpdatedAt ? `Cập nhật ${officer.gpsUpdatedAt}` : "Chưa có tọa độ vị trí"}</small>
                </span>
                <span className="support-officer-row-arrow" aria-hidden="true">›</span>
              </button>
            ))}
            {!filteredOfficers.length ? <p className="support-officer-empty">Không tìm thấy Công an phù hợp.</p> : null}
          </div>
        </section>

        <section className="support-officer-map-card panel" aria-labelledby="support-officer-map-title">
          <header className="support-officer-map-heading">
            <div><p className="eyebrow">Bản đồ GPS</p><h3 id="support-officer-map-title">Vị trí Công an đang chia sẻ</h3><small>Sơ đồ minh họa · không hiển thị vị trí GPS thật</small></div>
            <span className="support-officer-map-count"><i />{supportOfficerDemoData.filter((officer) => officer.mapPosition).length} mẫu chia sẻ</span>
          </header>
          <div className="support-officer-map" role="group" aria-label="Sơ đồ vị trí minh họa, các điểm đánh dấu là dữ liệu mẫu">
            <span className="support-officer-district district-three">QUẬN 3</span>
            <span className="support-officer-district district-one">QUẬN 1</span>
            <span className="support-officer-district district-binhthanh">BÌNH THẠNH</span>
            <div className="support-officer-river" aria-hidden="true" />
            {supportOfficerDemoData.filter((officer) => officer.mapPosition).map((officer) => (
              <button
                className={`support-officer-map-marker ${officer.connectionStatus === "disconnected" ? "is-disconnected" : ""} ${selectedOfficer?.id === officer.id ? "is-selected" : ""}`}
                key={officer.id}
                style={{
                  left: selectedOfficer?.id === officer.id ? "50%" : `${officer.mapPosition!.left}%`,
                  top: selectedOfficer?.id === officer.id ? "50%" : `${officer.mapPosition!.top}%`,
                }}
                type="button"
                aria-label={`Xem mẫu vị trí của ${officer.name}`}
                aria-pressed={selectedOfficer?.id === officer.id}
                onClick={() => focusOfficer(officer)}
              ><AdminIcon name="user" /></button>
            ))}
            <span className="support-officer-map-caption">Vị trí marker chỉ để xem bố cục giao diện</span>
          </div>
        </section>
      </div>

      {selectedOfficer ? (
        <div className="support-officer-drawer-layer">
          <button className="support-officer-drawer-backdrop" type="button" aria-label="Đóng chi tiết Công an" onClick={() => setSelectedOfficer(null)} />
          <aside className="support-officer-drawer" role="dialog" aria-modal="true" aria-labelledby="support-officer-drawer-title">
            <header className="support-officer-drawer-header"><div><p className="eyebrow">Thông tin Công an</p><h2 id="support-officer-drawer-title">Chi tiết trạng thái</h2></div><button type="button" aria-label="Đóng" onClick={() => setSelectedOfficer(null)}>×</button></header>
            <div className="support-officer-drawer-identity"><span className="support-officer-avatar">{selectedOfficer.initials}</span><span><strong>{selectedOfficer.name}</strong><small>{selectedOfficer.accountCode} · {selectedOfficer.unit}</small></span></div>
            <div className="support-officer-readonly"><AdminIcon name="shield" /><span><strong>Chế độ chỉ xem</strong><small>Hỗ trợ không thể thay đổi trạng thái ca trực.</small></span></div>
            <section className="support-officer-drawer-section"><h3>Trạng thái hiện tại</h3><div className="support-officer-status-cards"><div><small>Ca trực</small><span className={`support-officer-pill is-${selectedOfficer.shiftStatus}`}><i />{shiftLabels[selectedOfficer.shiftStatus]}</span></div><div><small>Kết nối</small><span className={`support-officer-connection is-${selectedOfficer.connectionStatus}`}><i />{connectionLabels[selectedOfficer.connectionStatus]}</span></div><div><small>GPS</small><span className={`support-officer-gps-status ${selectedOfficer.gpsLocation ? "is-sharing" : ""}`}><i />{selectedOfficer.gpsLocation ? "Đang chia sẻ vị trí" : "Không có dữ liệu vị trí"}</span></div></div></section>
            <section className="support-officer-drawer-section"><h3>Thông tin ca trực</h3><dl className="support-officer-detail-list"><div><dt><AdminIcon name="clock" />Thời gian bắt đầu ca</dt><dd>{selectedOfficer.shiftStartedAt || "Chưa bắt đầu ca"}</dd></div><div><dt><AdminIcon name="mapPin" />Vị trí hiện tại</dt><dd>{selectedOfficer.gpsLocation || "Không có dữ liệu GPS"}</dd></div><div><dt><AdminIcon name="activity" />Cập nhật vị trí gần nhất</dt><dd>{selectedOfficer.gpsUpdatedAt || "Chưa có dữ liệu"}</dd></div></dl></section>
            <section className="support-officer-drawer-section"><div className="support-officer-drawer-map-title"><h3>Vị trí trên bản đồ</h3><span className={selectedOfficer.gpsLocation ? "is-sharing" : ""}><i />{selectedOfficer.gpsLocation ? "GPS mẫu" : "Chưa có GPS"}</span></div><div className="support-officer-mini-map"><span className="support-officer-mini-road" /><span className="support-officer-mini-pin"><AdminIcon name="user" /></span><strong>{selectedOfficer.gpsLocation || "Không có dữ liệu vị trí"}</strong></div></section>
            <p className="support-officer-drawer-disclaimer">Thông tin trong drawer là dữ liệu demo, không được đồng bộ với tài khoản Công an.</p>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

export default SupportOfficerTracking;
