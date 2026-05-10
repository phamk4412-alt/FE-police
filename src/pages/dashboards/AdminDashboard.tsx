import { useEffect, useMemo, useState } from "react";
import AccountCharts from "../../components/admin/AccountCharts";
import AccountDetailModal from "../../components/admin/AccountDetailModal";
import AccountFilters from "../../components/admin/AccountFilters";
import AccountStatsCards from "../../components/admin/AccountStatsCards";
import AccountTable from "../../components/admin/AccountTable";
import { roleLabels, statusLabels } from "../../components/admin/adminAccountMeta";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  deleteUser,
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../../services/adminUserService";
import type { AccountSortKey, AdminUserRole, AdminUserStatus, UserAccount } from "../../types/adminUser";

function AdminDashboard() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "all">("all");
  const [sortBy, setSortBy] = useState<AccountSortKey>("createdAt");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Khong tai duoc tai khoan Clerk.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const searchable = [
          user.name,
          user.email,
          user.role,
          user.status,
          roleLabels[user.role],
          statusLabels[user.status],
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((first, second) => {
        if (sortBy === "name") {
          return first.name.localeCompare(second.name, "vi");
        }

        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      });
  }, [roleFilter, search, sortBy, statusFilter, users]);

  async function handleRoleChange(userId: string, role: AdminUserRole) {
    const updatedUser = await updateUserRole(userId, role);
    setUsers((current) => current.map((user) => (user.id === userId ? updatedUser : user)));
    setSelectedUser((current) => (current?.id === userId ? updatedUser : current));
  }

  async function handleStatusToggle(user: UserAccount) {
    const nextStatus: AdminUserStatus = user.status === "locked" ? "active" : "locked";

    const updatedUser = await updateUserStatus(user.id, nextStatus);
    setUsers((current) =>
      current.map((account) => (account.id === user.id ? updatedUser : account)),
    );
    setSelectedUser((current) => (current?.id === user.id ? updatedUser : current));
  }

  async function handleDelete(userId: string) {
    await deleteUser(userId);
    setUsers((current) => current.filter((user) => user.id !== userId));
    setSelectedUser((current) => (current?.id === userId ? null : current));
  }

  return (
    <DashboardLayout role="admin">
      <section className="admin-dashboard">
        <div className="admin-page-heading">
          <span>Admin Dashboard</span>
          <h2>Quản lý tài khoản và phân quyền hệ thống</h2>
          <p>Theo dõi trạng thái tài khoản, vai trò truy cập và tăng trưởng người dùng từ một màn hình tập trung.</p>
        </div>

        <AccountStatsCards users={users} />
        <AccountCharts users={users} />

        <AccountFilters
          role={roleFilter}
          search={search}
          sort={sortBy}
          status={statusFilter}
          onRoleChange={setRoleFilter}
          onSearchChange={setSearch}
          onSortChange={setSortBy}
          onStatusChange={setStatusFilter}
        />

        {isLoading ? (
          <section className="admin-panel admin-empty-state">Đang tải dữ liệu tài khoản...</section>
        ) : loadError ? (
          <section className="admin-panel admin-empty-state">{loadError}</section>
        ) : (
          <AccountTable
            users={filteredUsers}
            onDelete={handleDelete}
            onRoleChange={handleRoleChange}
            onStatusToggle={handleStatusToggle}
            onView={setSelectedUser}
          />
        )}

        <section className="admin-secondary-grid">
          <article className="admin-panel" id="activity-log">
            <div className="admin-section-heading">
              <span>Nhật ký hoạt động</span>
              <h2>Sự kiện quản trị gần đây</h2>
            </div>
            <div className="admin-log-list">
              <p>Admin cập nhật phân quyền tài khoản cảnh sát trực.</p>
              <p>Hệ thống ghi nhận 2 tài khoản chờ xác minh.</p>
              <p>Chính sách khóa tài khoản được đồng bộ ở giao diện quản trị.</p>
            </div>
          </article>
          <article className="admin-panel" id="settings">
            <div className="admin-section-heading">
              <span>Cài đặt</span>
              <h2>Cấu hình quản trị</h2>
            </div>
            <div className="admin-settings-list">
              <span>Xác minh 2 lớp: Đang bật</span>
              <span>Cảnh báo khóa tài khoản: Đang bật</span>
              <span>Đồng bộ vai trò backend: Sẵn sàng tích hợp</span>
            </div>
          </article>
        </section>
      </section>

      <AccountDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </DashboardLayout>
  );
}

export default AdminDashboard;
