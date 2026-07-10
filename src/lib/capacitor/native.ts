import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { PushNotifications } from "@capacitor/push-notifications";

// Everything here is a no-op on web — only runs inside the Capacitor
// Android shell. Called once from <NativeBridge/> in the root layout.
export async function initNativeBridge(router: { push: (href: string) => void }) {
  if (!Capacitor.isNativePlatform()) return;

  // Hardware back button: `canGoBack` is the WebView's own history heuristic,
  // so this works regardless of which SPA route is on screen. Minimize
  // instead of exiting from a root screen — matches how Android apps behave
  // (WhatsApp, Gmail, etc. never hard-exit on back from home).
  App.addListener("backButton", ({ canGoBack }) => {
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
  await PushNotifications.register();
  return { ok: true };
}
