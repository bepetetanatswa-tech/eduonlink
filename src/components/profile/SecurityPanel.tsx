"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormInput, PasswordStrength } from "@/components/auth/FormInput";

interface LoginEntry {
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

// Rough, dependency-free device/browser summary — good enough for "does
// this look like you", not meant to be a precise UA parser.
function describeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) && !/Chrome/.test(ua) ? "Safari"
    : "Browser";
  const os = /Windows/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "Unknown OS";
  return `${browser} on ${os}`;
}

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

export function SecurityPanel() {
  const router = useRouter();
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch("/api/profile/recent-logins")
      .then((r) => r.json())
      .then((data) => setLogins(data.logins ?? []))
      .finally(() => setLoading(false));
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) { setPasswordError("Enter your current password."); return; }
    if (!PASSWORD_RULE.test(newPassword)) {
      setPasswordError("New password must be 8+ characters with an uppercase letter, a number, and a special character.");
      return;
    }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
    if (!email) { setPasswordError("Could not verify your account. Please refresh and try again."); return; }

    setChangingPassword(true);
    try {
      // Re-authenticate with the current password before allowing a change —
      // without this, anyone who grabs an already-open, unlocked session
      // could silently take over the account by just setting a new password.
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (verifyError) {
        setPasswordError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage("Password changed.");
    } finally {
      setChangingPassword(false);
    }
  };

  const logoutOthers = async () => {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    setMessage(error ? "Could not sign out other devices." : "Signed out of all other devices.");
  };

  const logoutEverywhere = async () => {
    setBusy(true);
    await supabase.auth.signOut({ scope: "global" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#4A5170" }}>Security</p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: "#8892B0" }}>Recent sign-in activity</p>
        {loading ? (
          <p className="text-xs" style={{ color: "#4A5170" }}>Loading…</p>
        ) : logins.length === 0 ? (
          <p className="text-xs" style={{ color: "#4A5170" }}>No sign-in history yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {logins.map((l, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p className="text-xs" style={{ color: "#CDD6F4" }}>{describeUserAgent(l.user_agent)}</p>
                  <p className="text-[11px]" style={{ color: "#4A5170" }}>{l.ip ?? "Unknown IP"}</p>
                </div>
                <p className="text-[11px]" style={{ color: "#4A5170" }}>{new Date(l.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: "#8892B0" }}>Change password</p>
        {passwordError && <p className="text-xs" style={{ color: "#FF6B6B" }}>{passwordError}</p>}
        <FormInput
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <div>
          <FormInput
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={newPassword} />
        </div>
        <FormInput
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          error={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : undefined}
        />
        <button
          onClick={changePassword}
          disabled={changingPassword}
          className="text-xs font-semibold px-3 py-2 rounded-lg self-start"
          style={{ background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", cursor: changingPassword ? "not-allowed" : "pointer" }}
        >
          {changingPassword ? "Changing…" : "Change password"}
        </button>
      </div>

      <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: "#8892B0" }}>Sessions</p>
        {message && <p className="text-xs" style={{ color: "#00E5A3" }}>{message}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={logoutOthers}
            disabled={busy}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", cursor: busy ? "not-allowed" : "pointer" }}
          >
            Log out of all other devices
          </button>
          <button
            onClick={logoutEverywhere}
            disabled={busy}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B", cursor: busy ? "not-allowed" : "pointer" }}
          >
            Log out everywhere (including this device)
          </button>
        </div>
      </div>
    </div>
  );
}
