import type { CapacitorConfig } from "@capacitor/cli";

// EduOnLink's Android app is a Capacitor shell around the live Next.js app
// (server.url below) rather than a bundled static export — the web app has
// real server rendering, API routes, and auth middleware that a static
// export can't carry. `webDir` still has to point at a real (even if
// unused) directory for `cap sync` to run; see android/README in this repo
// for why it's a stub.
const config: CapacitorConfig = {
  appId: "com.vavhimithreads.eduonlink",
  appName: "EduOnLink",
  webDir: "www",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://edu-production.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    // Hidden explicitly by NativeBridge once the app is actually
    // interactive, instead of a fixed timeout that risks a blank flash
    // (hidden too early) or a stuck splash (hidden too late).
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#07080C",
    },
    StatusBar: {
      backgroundColor: "#07080C",
      style: "DARK",
    },
  },
};

export default config;
