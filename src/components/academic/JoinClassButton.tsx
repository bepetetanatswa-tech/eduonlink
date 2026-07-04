"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function JoinClassButton() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const S = { border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  async function join() {
    if (!code.trim() || joining) return;
    setJoining(true);
    setError(null);
    const { data, error: err }: { data: { class_id: string; class_name: string }[] | null; error: { message: string } | null } =
      await (supabase.rpc as any)("join_class_by_code", { p_code: code.trim() });
    setJoining(false);
    if (err) {
      setError(err.message.includes("Invalid join code") ? "That code doesn't match any class." : err.message.includes("Already enrolled") ? "You're already in this class." : "Could not join. Check the code and try again.");
      return;
    }
    setOpen(false);
    setCode("");
    router.refresh();
    if (data?.[0]?.class_id) router.push(`/student/dashboard/classes/${data[0].class_id}/chat`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "8px 16px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        + Join a Class
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, width: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif" }}>Join a Class</span>
              <button onClick={() => { setOpen(false); setError(null); }} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Enter the join code your teacher shared</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter") join(); }}
              placeholder="e.g. AB3XQ9"
              maxLength={6}
              autoFocus
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 18, letterSpacing: "0.15em", textAlign: "center", color: S.text, outline: "none", boxSizing: "border-box", textTransform: "uppercase" }}
            />
            {error && <p style={{ fontSize: 12, color: "#FF6B6B", marginTop: 8 }}>{error}</p>}
            <button onClick={join} disabled={!code.trim() || joining} style={{ width: "100%", padding: "10px", borderRadius: 10, background: !code.trim() ? "rgba(77,127,255,0.3)" : S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 16 }}>
              {joining ? "Joining…" : "Join Class"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
