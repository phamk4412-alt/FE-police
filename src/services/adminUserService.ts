import type { AdminUserRole, AdminUserStatus, UserAccount } from "../types/adminUser";
import { apiFetch } from "./api";

type ClerkAccountResponse = {
  Id?: string;
  Name?: string;
  Email?: string;
  Role?: AdminUserRole;
  Status?: AdminUserStatus;
  CreatedAt?: string;
  LastLogin?: string | null;
  RelatedCases?: number | null;
  SubmittedReports?: number | null;
  Note?: string | null;
  id?: string;
  name?: string;
  email?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  createdAt?: string;
  lastLogin?: string | null;
  relatedCases?: number | null;
  submittedReports?: number | null;
  note?: string | null;
};

function mapClerkAccount(account: ClerkAccountResponse): UserAccount {
  return {
    id: account.id || account.Id || "",
    name: account.name || account.Name || "Chưa có tên",
    email: account.email || account.Email || "",
    role: account.role || account.Role || "user",
    status: account.status || account.Status || "active",
    createdAt: account.createdAt || account.CreatedAt || new Date().toISOString(),
    lastLogin: account.lastLogin || account.LastLogin || "",
    relatedCases: account.relatedCases ?? account.RelatedCases ?? undefined,
    submittedReports: account.submittedReports ?? account.SubmittedReports ?? undefined,
    note: account.note ?? account.Note ?? undefined,
  };
}

export async function getUsers(): Promise<UserAccount[]> {
  const users = await apiFetch<ClerkAccountResponse[]>("/api/admin/clerk/accounts");
  return users.map(mapClerkAccount);
}

export async function updateUserRole(userId: string, role: AdminUserRole): Promise<UserAccount> {
  const user = await apiFetch<ClerkAccountResponse>(`/api/admin/clerk/accounts/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return mapClerkAccount(user);
}

export async function updateUserStatus(userId: string, status: AdminUserStatus): Promise<UserAccount> {
  const user = await apiFetch<ClerkAccountResponse>(`/api/admin/clerk/accounts/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return mapClerkAccount(user);
}

export async function deleteUser(userId: string): Promise<{ id: string }> {
  await apiFetch<void>(`/api/admin/clerk/accounts/${userId}`, {
    method: "DELETE",
  });
  return { id: userId };
}
