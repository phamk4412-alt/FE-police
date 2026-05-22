export type IdentityVerificationRoute = "/verify-cccd" | "/face-scan";

export interface IdentityVerificationState {
  cccdVerified: boolean;
  faceScanned: boolean;
  cccdSkipped?: boolean;
  faceSkipped?: boolean;
  cccdImage?: string;
  faceImage?: string;
  updatedAt?: string;
}

const STORAGE_PREFIX = "police.identityVerification.";

const defaultIdentityState: IdentityVerificationState = {
  cccdVerified: false,
  faceScanned: false,
};

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getIdentityVerificationState(userId: string | null | undefined) {
  if (!userId || !canUseSessionStorage()) {
    return defaultIdentityState;
  }

  try {
    const savedState = window.sessionStorage.getItem(getStorageKey(userId));

    if (!savedState) {
      return defaultIdentityState;
    }

    return {
      ...defaultIdentityState,
      ...JSON.parse(savedState),
    } as IdentityVerificationState;
  } catch {
    return defaultIdentityState;
  }
}

export function saveIdentityVerificationState(
  userId: string,
  patch: Partial<IdentityVerificationState>,
) {
  const nextState: IdentityVerificationState = {
    ...getIdentityVerificationState(userId),
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(getStorageKey(userId), JSON.stringify(nextState));
  }

  return nextState;
}

export function getRequiredIdentityStep(
  userId: string | null | undefined,
): IdentityVerificationRoute | null {
  const state = getIdentityVerificationState(userId);

  if (!state.cccdVerified) {
    return "/verify-cccd";
  }

  if (!state.faceScanned) {
    return "/face-scan";
  }

  return null;
}
