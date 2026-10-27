import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

// Public OAuth client IDs (not secrets); the VITE_ variables override them.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "450302749040-c65e39lsa7g2b1r36i3rh1btminagss6.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || "";

let initializePromise: Promise<void> | null = null;

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

function initializeNativeGoogle() {
  initializePromise ??= SocialLogin.initialize({
    google: {
      // The ID token is issued for the web client, so the backend verifies it like a web login.
      iOSClientId: GOOGLE_IOS_CLIENT_ID,
      iOSServerClientId: GOOGLE_CLIENT_ID,
      webClientId: GOOGLE_CLIENT_ID,
    },
  }).catch((error: unknown) => {
    initializePromise = null;
    throw error;
  });

  return initializePromise;
}

// Resolves with the Google ID token, or null when the user closes the Google sheet.
export async function signInWithNativeGoogle() {
  if (Capacitor.getPlatform() === "ios" && !GOOGLE_IOS_CLIENT_ID) {
    throw new Error("Thiếu cấu hình VITE_GOOGLE_IOS_CLIENT_ID cho app iPhone.");
  }

  await initializeNativeGoogle();

  try {
    const { result } = await SocialLogin.login({
      options: { scopes: ["email", "profile"] },
      provider: "google",
    });

    if (result.responseType !== "online" || !result.idToken) {
      throw new Error("Google không trả về mã đăng nhập.");
    }

    return result.idToken;
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "USER_CANCELLED") {
      return null;
    }

    throw error;
  }
}

export async function signOutNativeGoogle() {
  if (!isNativeApp() || !initializePromise) {
    return;
  }

  try {
    await initializePromise;
    await SocialLogin.logout({ provider: "google" });
  } catch {
    // The backend token is already discarded; a stale Google session only preselects the account.
  }
}
