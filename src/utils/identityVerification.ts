import { apiFetch } from "../services/api";

export type IdentityVerificationRoute = "/face-scan";

export interface IdentityVerificationState {
  CccdVerified: boolean;
  FaceScanned: boolean;
  CccdSkipped: boolean;
  FaceSkipped: boolean;
  CccdImage?: string;
  FaceImage?: string;
  UpdatedAt?: string;
}

export interface UpdateCccdVerificationPayload {
  CccdImage?: string;
  CccdVerified: boolean;
  CccdSkipped: boolean;
}

export interface UpdateFaceVerificationPayload {
  FaceImage?: string;
  FaceScanned: boolean;
  FaceSkipped: boolean;
}

export const defaultIdentityVerificationState: IdentityVerificationState = {
  CccdVerified: false,
  FaceScanned: false,
  CccdSkipped: false,
  FaceSkipped: false,
};

export async function fetchIdentityVerificationState() {
  return apiFetch<IdentityVerificationState>("/api/identity/state");
}

export async function saveCccdVerificationState(payload: UpdateCccdVerificationPayload) {
  return apiFetch<IdentityVerificationState>("/api/identity/cccd", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function saveFaceVerificationState(payload: UpdateFaceVerificationPayload) {
  return apiFetch<IdentityVerificationState>("/api/identity/face", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function resetIdentityVerificationState() {
  return apiFetch<IdentityVerificationState>("/api/identity/reset", {
    method: "POST",
  });
}

export function getRequiredIdentityStep(state: IdentityVerificationState | null | undefined) {
  if (!state?.FaceScanned) {
    return "/face-scan" satisfies IdentityVerificationRoute;
  }

  return null;
}
