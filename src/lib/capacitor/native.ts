import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { PushNotifications } from "@capacitor/push-notifications";

const DASHBOARD_ROLE_PREFIXES = ["student", "teacher", "parent", "school", "admin"] as const;

// Any /{role}/dashboard/... subpage snaps to /{role}/dashboard on hardware
// back, instead of walking the SPA history stack section-by-section. Returns
// null when the current path isn't inside a role dashboard at all.
function dashboardOverviewPath(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z_]+)\/dashboard(\/.*)?$/);
  if (!match) return null;
  const role = match[1];
  if (!DASHBOARD_ROLE_PREFIXES.includes(role as (typeof DASHBOARD_ROLE_PREFIXES)[number])) return null;
  const overview = `/${role}/dashboard`;
  return pathname === overview ? null : overview;
}

// Everything here is a no-op on web — only runs inside the Capacitor
// Android shell. Called once from <NativeBridge/> in the root layout.
export async function initNativeBridge(router: { push: (href: string) => void; replace: (href: string) => void }) {
  if (!Capacitor.isNativePlatform()) return;

  // Hardware back button: `canGoBack` is the WebView's own history heuristic,
  // so this works regardless of which SPA route is on screen. Minimize
  // instead of exiting from a root screen — matches how Android apps behave
  // (WhatsApp, Gmail, etc. never hard-exit on back from home).
  //
  // Inside a role dashboard, back always snaps to that role's Dashboard
  // Overview first — Settings, EduChat, SBP Generator, Profile, etc. are all
  // one back-press away from home, never a walk back through section history.
  App.addListener("backButton", ({ canGoBack }) => {
    const overview = dashboardOverviewPath(window.location.pathname);
    if (overview) {
      router.replace(overview);
      return;
    }
    if (canGoBack) window.history.back();
    else App.minimizeApp();
  });

  try {
    await StatusBar.setBackgroundColor({ color: "#07080C" });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // status bar plugin can throw on some OEM WebViews — cosmetic only
  }

  // Registration happens once notification permission is granted; until
  // then this silently does nothing (no popup on first launch — call
  // registerPushNotifications() from an explicit user action instead, same
  // UX as the existing web PushPermissionPrompt).
  PushNotifications.addListener("registration", (token) => {
    fetch("/api/push/register-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.value, platform: "android" }),
    }).catch(() => {});
  });
  PushNotifications.addListener("registrationError", (err) => {
    console.error("[native push] registration failed:", err);
  });
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const link = action.notification.data?.link;
    if (typeof link === "string") router.push(link);
  });

  await SplashScreen.hide();
}

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return { ok: false, error: "Not running in the native app." };
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    const req = await PushNotifications.requestPermissions();
    if (req.receive !== "granted") return { ok: false, error: "Permission denied." };
  }

  // Android 8+ routes every notification through a channel; without one
  // created up front, FCM messages fall back to a default-importance
  // channel with no heads-up banner or sound. Must exist before register()
  // for the id to be valid when the server sends with channel_id set
  // (see src/lib/fcm/send.ts). No-op on iOS/web.
  if (Capacitor.getPlatform() === "android") {
    await PushNotifications.createChannel({
      id: "eduonlink_default",
      name: "EduOnLink",
      description: "Class updates, messages, and alerts",
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
    });
  }

  await PushNotifications.register();
  return { ok: true };
}
