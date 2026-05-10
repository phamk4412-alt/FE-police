import type { UserAccount } from "../../types/adminUser";
import { formatDate, formatDateTime, roleLabels, statusLabels } from "./adminAccountMeta";

interface AccountDetailModalProps {
  onClose: () => void;
  user: UserAccount | null;
}

function AccountDetailModal({ onClose, user }: AccountDetailModalProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="account-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="admin-modal-heading">
          <div>
            <span>Chi tiết tài khoản</span>
            <h2 id="account-detail-title">{user.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng modal">
            Đóng
          </button>
        </div>

        <dl className="admin-detail-grid">
          <div>
            <dt>Họ tên</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Vai trò</dt>
            <dd>
              <span className={`admin-badge admin-role-badge-${user.role}`}>{roleLabels[user.role]}</span>
            </dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>
              <span className={`admin-badge admin-status-${user.status}`}>{statusLabels[user.status]}</span>
            </dd>
          </div>
          <div>
            <dt>Ngày tạo</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt>Lần đăng nhập cuối</dt>
            <dd>{formatDateTime(user.lastLogin)}</dd>
          </div>
          <div>
            <dt>Số vụ việc liên quan</dt>
            <dd>{user.role === "police" ? user.relatedCases ?? 0 : "Không áp dụng"}</dd>
          </div>
          <div>
            <dt>Số báo cáo đã gửi</dt>
            <dd>{user.role === "user" ? user.submittedReports ?? 0 : "Không áp dụng"}</dd>
          </div>
        </dl>

        <div className="admin-note-box">
          <span>Ghi chú quản trị</span>
          <p>{user.note || "Chưa có ghi chú."}</p>
        </div>
      </section>
    </div>
  );
}

export default AccountDetailModal;
