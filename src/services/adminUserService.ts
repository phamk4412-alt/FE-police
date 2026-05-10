import { adminUsers } from "../data/adminUsers";
import type { AdminUserRole, AdminUserStatus, UserAccount } from "../types/adminUser";

const delay = 180;

function cloneUsers(users: UserAccount[]) {
  return users.map((user) => ({ ...user }));
}

function resolveMock<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}

export function getUsers(): Promise<UserAccount[]> {
  return resolveMock(cloneUsers(adminUsers));
}

export function updateUserRole(userId: string, role: AdminUserRole): Promise<UserAccount> {
  const user = adminUsers.find((account) => account.id === userId);

  if (!user) {
    return Promise.reject(new Error("Khong tim thay tai khoan."));
  }

  return resolveMock({ ...user, role });
}

export function updateUserStatus(userId: string, status: AdminUserStatus): Promise<UserAccount> {
  const user = adminUsers.find((account) => account.id === userId);

  if (!user) {
    return Promise.reject(new Error("Khong tim thay tai khoan."));
  }

  return resolveMock({ ...user, status });
}

export function deleteUser(userId: string): Promise<{ id: string }> {
  return resolveMock({ id: userId });
}
