import type { AdminUserRole, UserAccount } from "../../types/adminUser";
import AdminIcon from "./AdminIcons";
import { formatDate, formatDateTime, roleLabels, roleOptions, statusLabels } from "./adminAccountMeta";

interface AccountTableProps {
  onDelete: (userId: string) => void;
  onRoleChange: (userId: string, role: AdminUserRole) => void;
  onStatusToggle: (user: UserAccount) => void;
  onView: (user: UserAccount) => void;
  users: UserAccount[];
}

function AccountTable({ onDelete, onRoleChange, onStatusToggle, onView, users }: AccountTableProps) {
  return (
    <section className="admin-panel admin-table-panel" id="accounts">
      <div className="admin-section-heading admin-table-heading">
        <div>
          <span>Quản lý tài khoản</span>
          <h2>Danh sách tài khoản hệ thống</h2>
        </div>
        <strong>{users.length} kết quả</strong>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-account-table">
          <thead>
            <tr>
              <th>Mã tài khoản</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Lần đăng nhập cuối</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    className={`admin-role-select admin-role-${user.role}`}
                    value={user.role}
                    aria-label={`Đổi vai trò cho ${user.name}`}
                    onChange={(event) => onRoleChange(user.id, event.target.value as AdminUserRole)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`admin-badge admin-status-${user.status}`}>{statusLabels[user.status]}</span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDateTime(user.lastLogin)}</td>
                <td>
                  <div className="admin-row-actions">
                    <button className="admin-action-btn" type="button" onClick={() => onView(user)}>
                      <AdminIcon name="view" />
                      Xem
                    </button>
                    <button className="admin-action-btn" type="button" onClick={() => onStatusToggle(user)}>
                      <AdminIcon name={user.status === "locked" ? "unlock" : "lock"} />
                      {user.status === "locked" ? "Mở khóa" : "Khóa"}
                    </button>
                    <button className="admin-action-btn admin-action-danger" type="button" onClick={() => onDelete(user.id)}>
                      <AdminIcon name="delete" />
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? (
          <div className="admin-empty-state">Không có tài khoản phù hợp với bộ lọc hiện tại.</div>
        ) : null}
      </div>
    </section>
  );
}

export default AccountTable;
