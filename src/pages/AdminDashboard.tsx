import DashboardLayout from "../components/layout/DashboardLayout";
import type { DashboardStat } from "../types/common";

const stats: DashboardStat[] = [
  { label: "Tổng tài khoản", value: 128, note: "+12 trong tháng này" },
  { label: "Tổng báo cáo", value: 342, note: "58 báo cáo chờ duyệt" },
  { label: "Vụ việc đang xử lý", value: 27, note: "Trên 5 quận/huyện" },
  { label: "Nhật ký hệ thống", value: 915, note: "24 giờ gần nhất" },
];

const accounts = [
  { id: 1, username: "quan_tri", role: "Quản trị viên", status: "Đang hoạt động" },
  { id: 2, username: "canh_sat_truc", role: "Cảnh sát", status: "Đang trực" },
  { id: 3, username: "to_ho_tro", role: "Hỗ trợ", status: "Đang hoạt động" },
  { id: 4, username: "nguoi_dan", role: "Người dân", status: "Đã xác minh" },
];

function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <section className="page-title">
        <p className="eyebrow">Bảng điều khiển quản trị</p>
        <h2>Tổng quan hệ thống</h2>
        <span>Quản lý tài khoản, báo cáo, nhật ký kiểm tra và trạng thái vận hành.</span>
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
          <span className="eyebrow">Dữ liệu mẫu</span>
          <h2>Tài khoản hệ thống gần đây</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
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
