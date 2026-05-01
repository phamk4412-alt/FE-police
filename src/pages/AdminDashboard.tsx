import DashboardLayout from "../components/layout/DashboardLayout";
import type { DashboardStat } from "../types/common";

const stats: DashboardStat[] = [
  { label: "Tong tai khoan", value: 128, note: "+12 this month" },
  { label: "Tong bao cao", value: 342, note: "58 waiting review" },
  { label: "Vu viec dang xu ly", value: 27, note: "Across 5 districts" },
  { label: "Nhat ky he thong", value: 915, note: "Last 24 hours" },
];

const accounts = [
  { id: 1, username: "admin", role: "Admin", status: "Active" },
  { id: 2, username: "police.officer", role: "Police", status: "On duty" },
  { id: 3, username: "support.team", role: "Support", status: "Active" },
  { id: 4, username: "citizen.user", role: "User", status: "Verified" },
];

function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <section className="page-title">
        <p className="eyebrow">Admin Dashboard</p>
        <h2>System overview</h2>
        <span>Manage accounts, reports, audit logs, and operational status.</span>
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

      <section className="panel" id="incidents">
        <div className="section-heading">
          <span className="eyebrow">Mock Data</span>
          <h2>Recent system accounts</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td>{account.username}</td>
                  <td>{account.role}</td>
                  <td>
                    <span className="status-pill">{account.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;
