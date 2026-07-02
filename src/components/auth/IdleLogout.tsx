"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes — everyone else
const SUPER_ADMIN_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours — super_admin, per spec
const CHECK_INTERVAL_MS = 60 * 1000;
const ROLE_CACHE_MS = 5 * 60 * 1000;

// Mounted once in the root layout so it covers every page. No-op on public
// pages (getSession() resolves null, loop does nothing) and picks up a
// session automatically once one exists — no remount required after login,
// since Next's root layout persists across client-side navigation.
export function IdleLogout() {
  const lastActivity = useRef(Date.now());
  const supabase = createClient();

  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    let cachedRole: string | null = null;
    let lastRoleCheck = 0;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (Date.now() - lastRoleCheck > ROLE_CACHE_MS) {
        const data = await fetch("/api/profile").then((r) => (r.ok ? r.json() : null)).catch(() => null);
        cachedRole = data?.profile?.role ?? null;
        lastRoleCheck = Date.now();
      }

      const timeout = cachedRole === "super_admin" ? SUPER_ADMIN_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
      if (Date.now() - lastActivity.current > timeout) {
        await supabase.auth.signOut();
        window.location.href = "/auth/login?reason=inactivity";
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
