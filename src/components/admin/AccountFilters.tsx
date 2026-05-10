import type { AccountSortKey, AdminUserRole, AdminUserStatus } from "../../types/adminUser";
import { roleLabels, roleOptions, statusLabels, statusOptions } from "./adminAccountMeta";

interface AccountFiltersProps {
  onRoleChange: (role: AdminUserRole | "all") => void;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: AccountSortKey) => void;
  onStatusChange: (status: AdminUserStatus | "all") => void;
  role: AdminUserRole | "all";
  search: string;
  sort: AccountSortKey;
  status: AdminUserStatus | "all";
}

function AccountFilters({
  onRoleChange,
  onSearchChange,
  onSortChange,
  onStatusChange,
  role,
  search,
  sort,
  status,
}: AccountFiltersProps) {
  return (
    <section className="admin-filter-panel" aria-label="Bộ lọc tài khoản">
      <label>
        <span>Tìm kiếm tài khoản</span>
        <input
          type="search"
          value={search}
          placeholder="Tìm theo tên, email, vai trò, trạng thái..."
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label>
        <span>Vai trò</span>
        <select value={role} onChange={(event) => onRoleChange(event.target.value as AdminUserRole | "all")}>
          <option value="all">Tất cả vai trò</option>
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {roleLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Trạng thái</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as AdminUserStatus | "all")}
        >
          <option value="all">Tất cả trạng thái</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Sắp xếp</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value as AccountSortKey)}>
          <option value="createdAt">Ngày tạo mới nhất</option>
          <option value="name">Tên A-Z</option>
        </select>
      </label>
    </section>
  );
}

export default AccountFilters;
