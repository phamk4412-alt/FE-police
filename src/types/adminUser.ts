export type AdminUserRole = "admin" | "police" | "support" | "user";

export type AdminUserStatus = "active" | "locked" | "pending";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  lastLogin: string;
  relatedCases?: number;
  submittedReports?: number;
  note?: string;
}

export type AccountSortKey = "createdAt" | "name";
