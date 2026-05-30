import { apiFetch } from "./api";

export interface AccountProfileSyncPayload {
  CccdVerified?: boolean;
  ClerkUserId?: string;
  DiditApproved?: boolean;
  DiditSessionId?: string;
  DiditStatus?: string;
  DisplayName?: string;
  Email?: string;
  FaceScanned?: boolean;
  Role?: string;
  Status?: string;
}

export function syncAccountProfile(payload: AccountProfileSyncPayload) {
  return apiFetch("/api/accounts/sync", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
