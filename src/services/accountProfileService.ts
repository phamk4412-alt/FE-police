import { apiFetch } from "./api";

export interface AccountProfileSyncPayload {
  CccdVerified?: boolean;
  FaceScanned?: boolean;
}

export function syncAccountProfile(payload: AccountProfileSyncPayload) {
  return apiFetch("/api/accounts/sync", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
