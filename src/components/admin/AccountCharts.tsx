import type { UserAccount } from "../../types/adminUser";
import { roleLabels, roleOptions, statusLabels, statusOptions } from "./adminAccountMeta";

interface AccountChartsProps {
  users: UserAccount[];
}

const monthLabels = ["T1", "T2", "T3", "T4", "T5"];

function AccountCharts({ users }: AccountChartsProps) {
  const roleData = roleOptions.map((role) => ({
    label: roleLabels[role],
    value: users.filter((user) => user.role === role).length,
  }));
  const statusData = statusOptions.map((status) => ({
    label: statusLabels[status],
    status,
    value: users.filter((user) => user.status === status).length,
  }));
  const monthlyData = monthLabels.map((label, index) => ({
    label,
    value: users.filter((user) => new Date(user.createdAt).getMonth() === index).length,
  }));
  const maxRole = Math.max(...roleData.map((item) => item.value), 1);
  const maxMonthly = Math.max(...monthlyData.map((item) => item.value), 1);
  const totalStatus = Math.max(users.length, 1);
  const activePercent = Math.round(((statusData.find((item) => item.status === "active")?.value || 0) / totalStatus) * 100);
  const lockedPercent = Math.round(((statusData.find((item) => item.status === "locked")?.value || 0) / totalStatus) * 100);

  return (
    <section className="admin-charts-grid" id="statistics">
      <article className="admin-panel">
        <div className="admin-section-heading">
          <span>Thống kê vai trò</span>
          <h2>Tài khoản theo vai trò</h2>
        </div>
        <div className="admin-bar-chart" aria-label="Biểu đồ cột tài khoản theo vai trò">
          {roleData.map((item) => (
            <div className="admin-bar-item" key={item.label}>
              <span>{item.label}</span>
              <div>
                <i style={{ height: `${Math.max((item.value / maxRole) * 100, 8)}%` }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="admin-panel">
        <div className="admin-section-heading">
          <span>Tỷ lệ trạng thái</span>
          <h2>Hoạt động, khóa, chờ xác minh</h2>
        </div>
        <div
          className="admin-donut"
          style={{
            background: `conic-gradient(#22c55e 0 ${activePercent}%, #ef4444 ${activePercent}% ${
              activePercent + lockedPercent
            }%, #f59e0b ${activePercent + lockedPercent}% 100%)`,
          }}
        >
          <span>{users.length}</span>
          <small>Tài khoản</small>
        </div>
        <div className="admin-chart-legend">
          {statusData.map((item) => (
            <span className={`admin-status-dot-${item.status}`} key={item.status}>
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </article>

      <article className="admin-panel admin-area-panel">
        <div className="admin-section-heading">
          <span>Tăng trưởng</span>
          <h2>Tài khoản mới theo tháng</h2>
        </div>
        <div className="admin-area-chart" aria-label="Biểu đồ tài khoản mới theo tháng">
          {monthlyData.map((item) => (
            <div className="admin-area-point" key={item.label}>
              <i style={{ height: `${Math.max((item.value / maxMonthly) * 100, 10)}%` }} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default AccountCharts;
