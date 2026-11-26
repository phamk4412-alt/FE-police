import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminIcon, { type AdminIconName } from "../../../components/admin/AdminIcons";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { SUPPORT_TAB_PATHS } from "../../../utils/constants";
import SupportReviewDetail, { type DemoDecision } from "./SupportReviewDetail";
import { day, demoNow, formatReviewTime, reviewDemoCases, reviewStatuses, waitingTime, type ReviewCase, type ReviewStatus } from "./supportReviewDemo";
import "./supportReview.css";

const statuses: ReviewStatus[] = ["pending", "published", "rejected"];
const categories = [...new Set(reviewDemoCases.map((item) => item.category))];
const areas = [...new Set(reviewDemoCases.map((item) => item.area))];

function searchKey(text: string) {
  return text.toLocaleLowerCase("vi").normalize("NFD").replace(/\p{Diacritic}/gu, "").replaceAll("đ", "d");
}

function SelectField({ label, icon, value, onChange, options }: {
  label: string; icon: AdminIconName; value: string; onChange: (value: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="review-field">
      <span><AdminIcon name={icon} /> {label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ReviewTable({ items, status, onOpen, onReset }: {
  items: ReviewCase[]; status: ReviewStatus; onOpen: (item: ReviewCase) => void; onReset: () => void;
}) {
  if (items.length === 0) return (
    <div className="review-empty"><AdminIcon name="search" /><h3>Không có vụ việc phù hợp</h3>
      <p>Thử thay đổi từ khóa, bộ lọc hoặc trạng thái minh họa.</p>
      <button className="review-button" type="button" onClick={onReset}>Đặt lại bộ lọc</button>
    </div>
  );
  return (
    <div className="review-table-wrap">
      <table className="review-table" aria-label="Danh sách vụ việc minh họa">
        <thead><tr>
          <th scope="col">Vụ việc</th><th scope="col">Khu vực / Mô tả</th><th scope="col">Thời gian</th>
          <th scope="col">Đơn vị xử lý</th><th scope="col">{status === "pending" ? "Chờ duyệt" : "Trạng thái duyệt"}</th>
        </tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id} onClick={() => onOpen(item)}>
            <td><div className="review-case"><span className={`review-case-icon is-${item.status}`}><AdminIcon name={item.icon} /></span>
              <div><button type="button" className="review-case-link" aria-label={`Mở chi tiết ${item.id}`}>{item.id}</button><strong>{item.category}</strong></div>
            </div></td>
            <td><strong className="review-inline"><AdminIcon name="mapPin" /> {item.area}</strong><small>{item.summary}</small></td>
            <td><div className="review-time"><small><AdminIcon name="clock" /> Xảy ra</small><time dateTime={new Date(item.occurred).toISOString()}>{formatReviewTime(item.occurred)}</time>
              <small><AdminIcon name="check" /> Hoàn thành</small><time dateTime={new Date(item.completed).toISOString()}>{formatReviewTime(item.completed)}</time></div></td>
            <td><span className="review-inline"><AdminIcon name="shield" /> {item.unit}</span></td>
            <td><div className="review-row-status">
              <span className={`review-pill is-${item.status}`}><AdminIcon name={reviewStatuses[item.status].icon} />
                {item.status === "pending" ? waitingTime(item.completed) : reviewStatuses[item.status].label}</span>
              <AdminIcon name="chevronRight" />
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function SupportReviewPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(reviewDemoCases);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [scenario, setScenario] = useState("queue");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [period, setPeriod] = useState("7");
  const [selection, setSelection] = useState<{ item: ReviewCase; session: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const available = scenario === "empty" ? cases.filter((item) => item.status !== "pending") : cases;
  const totals = { pending: 0, published: 0, rejected: 0 };
  available.forEach((item) => { totals[item.status] += 1; });
  const needle = searchKey(query.trim());
  const visible = available.filter((item) =>
    item.status === status && (!category || category === item.category) && (!area || area === item.area) &&
    (!period || demoNow - item.completed <= Number(period) * day) &&
    (!needle || searchKey(`${item.id} ${item.area} ${item.address}`).includes(needle))
  );

  function resetFilters() {
    setQuery("");
    setCategory("");
    setArea("");
    setPeriod("7");
  }

  function openCase(item: ReviewCase) {
    setSelection((current) => ({ item, session: (current?.session ?? 0) + 1 }));
    setDrawerOpen(true);
  }

  function decide(id: string, decision: DemoDecision) {
    setCases((current) => current.map((item) => item.id === id ? { ...item, ...decision } : item));
    setDrawerOpen(false);
    setNotice(`Mô phỏng ${decision.status === "published" ? "phê duyệt" : "không duyệt"} hồ sơ ${id} trong phiên này.`);
  }

  return (
    <DashboardLayout role="support" activeSupportTab="review" onSupportTabChange={(tab) => navigate(SUPPORT_TAB_PATHS[tab])}>
      <div className="support-review">
        <div className="review-content">
          <section className="review-heading">
            <div>
              <p className="review-kicker">Kiểm duyệt công khai</p>
              <h2>Duyệt vụ việc công khai</h2>
              <p>Kiểm tra và phê duyệt những vụ việc đã hoàn thành trước khi hiển thị trên bản đồ Người dân.</p>
            </div>
            <SelectField label="Trạng thái minh họa" icon="filter" value={scenario}
              onChange={(value) => { setScenario(value); setStatus("pending"); resetFilters(); }}
              options={[{ value: "queue", label: "Nhiều vụ việc chờ duyệt" }, { value: "empty", label: "Không có vụ việc chờ duyệt" }]} />
          </section>

          <section className="review-stats" aria-label="Thống kê minh họa">
            {statuses.map((key) => (
              <article className={`review-stat is-${key}`} key={key}>
                <span className="review-stat-icon"><AdminIcon name={reviewStatuses[key].icon} /></span>
                <strong>{totals[key]}</strong><h3>{reviewStatuses[key].label}</h3><p>{reviewStatuses[key].caption}</p>
              </article>
            ))}
            <article className="review-stat"><span className="review-stat-icon"><AdminIcon name="file" /></span>
              <strong>{available.length}</strong><h3>Tổng vụ việc</h3><p>Trong phạm vi minh họa</p>
            </article>
          </section>

          <section className="review-panel" aria-label="Quản lý vụ việc minh họa">
            <div className="review-panel-top">
              <div className="review-tabs" role="group" aria-label="Trạng thái hồ sơ">
                {statuses.map((key) => (
                  <button type="button" key={key} aria-pressed={status === key} onClick={() => setStatus(key)}>
                    <AdminIcon name={reviewStatuses[key].icon} /> {reviewStatuses[key].label} <span>{totals[key]}</span>
                  </button>
                ))}
              </div>
              <label className="review-search"><AdminIcon name="search" />
                <input type="search" aria-label="Tìm theo mã vụ việc hoặc khu vực" placeholder="Tìm mã vụ việc, khu vực..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            </div>
            <div className="review-filters">
              <SelectField label="Loại sự cố" icon="review" value={category} onChange={setCategory}
                options={[{ value: "", label: "Tất cả loại sự cố" }, ...categories.map((value) => ({ value, label: value }))]} />
              <SelectField label="Khu vực" icon="mapPin" value={area} onChange={setArea}
                options={[{ value: "", label: "Tất cả khu vực" }, ...areas.map((value) => ({ value, label: value }))]} />
              <SelectField label="Hoàn thành" icon="clock" value={period} onChange={setPeriod}
                options={[{ value: "1", label: "24 giờ gần nhất" }, { value: "7", label: "7 ngày gần nhất" }, { value: "", label: "Mọi thời gian" }]} />
              <SelectField label="Trạng thái duyệt" icon="filter" value={status} onChange={(value) => setStatus(value as ReviewStatus)}
                options={statuses.map((value) => ({ value, label: reviewStatuses[value].label }))} />
            </div>
            <ReviewTable items={visible} status={status} onOpen={openCase} onReset={resetFilters} />
          </section>
          <div className={`review-notice ${notice ? "is-visible" : ""}`} role="status">{notice && <><AdminIcon name="check" /> {notice}</>}</div>
        </div>
        {selection && <SupportReviewDetail key={selection.session} item={selection.item} open={drawerOpen}
          onClose={() => setDrawerOpen(false)} onDecision={(decision) => decide(selection.item.id, decision)} />}
      </div>
    </DashboardLayout>
  );
}
