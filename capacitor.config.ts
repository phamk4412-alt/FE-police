import type { CapacitorConfig } from "@capacitor/cli";

// The app loads the deployed site, so every Vercel deploy reaches the app without a new build
// and the backend sees the same origin as the web (CORS, Google and Didit callbacks keep working).
// Set CAP_SERVER_URL (e.g. http://192.168.1.10:5173) before `npx cap sync` to point it at a dev server.
const serverUrl = process.env.CAP_SERVER_URL || "https://www.warteam.website";

const config: CapacitorConfig = {
  appId: "website.warteam.police",
  appName: "Cảnh sát",
  webDir: "dist",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
  // Same color as the site background, shown behind the status bar and while the page loads.
  backgroundColor: "#070d14",
  plugins: {
    SystemBars: {
      style: "DARK",
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
