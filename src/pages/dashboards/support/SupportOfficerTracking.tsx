import { useCallback, useEffect, useRef, useState } from "react";
import AdminIcon from "../../../components/admin/AdminIcons";
import { apiFetch } from "../../../services/api";
import "./supportOfficerTracking.css";

interface OnlinePoliceAccount {
  AccountId: string;
  DisplayName: string;
  OnlineSince: string;
}

type OnlineList =
  | { status: "loading" | "unavailable" }
  | { status: "ready"; accounts: OnlinePoliceAccount[] };

const onlineSinceFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function SupportOfficerTracking() {
  const [list, setList] = useState<OnlineList>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pending = useRef<Promise<OnlinePoliceAccount[]> | null>(null);

  const refresh = useCallback(() => {
    if (pending.current) return pending.current;
    const request = apiFetch<OnlinePoliceAccount[]>("/api/support/police/online", { cache: "no-store" });
    pending.current = request;
    void request.then((accounts) => {
      if (pending.current === request) setList(Array.isArray(accounts) ? { status: "ready", accounts } : { status: "unavailable" });
    }).catch(() => {
      if (pending.current === request) setList({ status: "unavailable" });
    }).finally(() => {
      if (pending.current === request) pending.current = null;
    });
    return request;
  }, []);

  async function refreshManually() {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch {
      // The shared refresh already reports the error in the list.
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    window.addEventListener("online", refresh);
    return () => {
      pending.current = null;
      window.clearInterval(timer);
      window.removeEventListener("online", refresh);
    };
  }, [refresh]);

  const accounts = list.status === "ready" ? list.accounts : [];
  const query = search.trim().toLocaleLowerCase("vi-VN");
  const filteredAccounts = accounts.filter((account) =>
    `${account.DisplayName} ${account.AccountId}`.toLocaleLowerCase("vi-VN").includes(query),
  );
  const message = list.status === "loading" ? "Đang tải trạng thái trực tuyến…"
    : list.status === "unavailable" ? "Không thể cập nhật danh sách. Hệ thống đang thử kết nối lại."
    : accounts.length === 0 ? "Chưa có Công an nào đang trực tuyến."
    : filteredAccounts.length === 0 ? "Không tìm thấy Công an phù hợp."
    : "";

  return (
    <section className="support-officer-page" aria-labelledby="support-officer-title">
      <header className="support-officer-heading">
        <div>
          <p className="eyebrow">Giám sát lực lượng</p>
          <h2 id="support-officer-title">Theo dõi Công an</h2>
        </div>
        <span className="support-officer-view-badge"><AdminIcon name="shield" /> Chỉ có quyền xem</span>
      </header>

      <section className="support-officer-stat" aria-labelledby="support-officer-total">
        <span className="support-officer-stat-icon"><AdminIcon name="users" /></span>
        <div>
          <h3 id="support-officer-total">Tổng số Công an đang trực tuyến</h3>
          <p className="support-officer-connection"><i aria-hidden="true" /> Đang đăng nhập hệ thống</p>
        </div>
        <strong aria-live="polite" aria-atomic="true" aria-labelledby="support-officer-total">
          {list.status === "ready" ? accounts.length : "—"}
        </strong>
      </section>

      <section className="support-officer-list panel" aria-labelledby="support-officer-list-title">
        <header className="support-officer-list-heading">
          <h3 id="support-officer-list-title">Công an trực tuyến</h3>
          <div className="support-officer-list-controls">
            <label className="support-officer-search">
              <AdminIcon name="search" />
              <span className="visually-hidden">Tìm tên hoặc mã tài khoản</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc mã tài khoản" />
            </label>
            <button className="support-officer-refresh btn btn-secondary" type="button" disabled={isRefreshing}
              aria-busy={isRefreshing} onClick={() => void refreshManually()}>
              <AdminIcon name="refresh" /> {isRefreshing ? "Đang làm mới…" : "Làm mới"}
            </button>
          </div>
        </header>
        {message ? <p className="support-officer-empty" role="status">{message}</p> : (
          <ul className="support-officer-rows">
            {filteredAccounts.map((account) => (
              <li className="support-officer-row" key={account.AccountId}>
                <div className="support-officer-identity">
                  <span className="support-officer-avatar"><AdminIcon name="police" /></span>
                  <div><strong>{account.DisplayName || "Công an"}</strong><small>{account.AccountId}</small></div>
                </div>
                <span className="support-officer-connection"><i aria-hidden="true" /> Đang trực tuyến</span>
                <time dateTime={account.OnlineSince} className="support-officer-time">
                  <AdminIcon name="clock" /> Từ {onlineSinceFormatter.format(new Date(account.OnlineSince))}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

export default SupportOfficerTracking;
