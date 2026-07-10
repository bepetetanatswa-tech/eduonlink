"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { subscribeToPush } from "@/lib/push/subscribe";
import { registerPushNotifications } from "@/lib/capacitor/native";

const DISMISS_KEY = "educonnect-push-prompt-dismissed";

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    // Web: only prompt if the browser hasn't already been asked. Native app:
    // there's no equivalent synchronous check, so just offer it once — the
    // dismiss flag still prevents repeat nagging either way.
    if (!isNative && (typeof Notification === "undefined" || Notification.permission !== "default")) return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const allow = async () => {
    setBusy(true);
    setError(null);
    const result = isNative ? await registerPushNotifications() : await subscribeToPush();
    setBusy(false);
    if (result.ok) {
      dismiss();
    } else {
      setError(result.error ?? "Could not enable notifications.");
      localStorage.setItem(DISMISS_KEY, "1");
      setTimeout(() => setShow(false), 2500);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 300, maxWidth: 340,
      background: "#0E1117", border: "1px solid rgba(77,127,255,0.25)", borderRadius: 16,
      padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#CDD6F4", margin: "0 0 6px" }}>🔔 Stay in the loop</p>
      <p style={{ fontSize: 12, color: "#8892B0", margin: "0 0 14px", lineHeight: 1.5 }}>
        Allow EduOnLink to send you notifications for messages, assignments, and live classes?
      </p>
      {error && <p style={{ fontSize: 11, color: "#FF6B6B", margin: "0 0 10px" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={dismiss} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#8892B0", fontSize: 12, cursor: "pointer" }}>
          Not now
        </button>
        <button onClick={allow} disabled={busy} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#4D7FFF", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "…" : "Allow"}
        </button>
      </div>
    </div>
  );
}
