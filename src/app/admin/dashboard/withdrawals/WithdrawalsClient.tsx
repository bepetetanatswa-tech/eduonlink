"use client";

import { useState } from "react";

interface Withdrawal {
  id: string; teacher_id: string; amount: number; payout_phone: string; status: string;
  rejection_reason: string | null; requested_at: string; processed_at: string | null;
  profiles: { full_name: string; email: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#F5A623", approved: "#4D7FFF", paid: "#00E5A3", rejected: "#FF6B6B",
};

export function WithdrawalsClient({ initialWithdrawals }: { initialWithdrawals: Withdrawal[] }) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [notification, setNotification] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deciding, setDeciding] = useState(false);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const decide = async (id: string, decision: "approved" | "paid" | "rejected", reason?: string) => {
    setDeciding(true);
    try {
      const res = await fetch("/api/admin/withdrawals/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: id, decision, reason }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error ?? "Could not save decision"); return; }
      setWithdrawals((p) => p.map((w) => w.id === id ? { ...w, status: decision, rejection_reason: decision === "rejected" ? (reason ?? null) : null } : w));
      notify(`Marked ${decision} ✓`);
      setRejecting(null);
      setRejectReason("");
    } finally {
      setDeciding(false);
    }
  };

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Teacher Withdrawals</h2>
          <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{withdrawals.length} total · {pendingCount} pending</p>
        </div>
        {notification && <span style={{ fontSize: 12, color: "#00E5A3" }}>{notification}</span>}
      </div>

      {rejecting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#0D1021", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>Reject withdrawal — ${rejecting.amount.toFixed(2)}</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Reason (sent to the teacher)"
              style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setRejecting(null); setRejectReason(""); }} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => decide(rejecting.id, "rejected", rejectReason)} disabled={deciding || !rejectReason.trim()} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(255,107,107,0.9)", border: "none", color: "#fff", cursor: (deciding || !rejectReason.trim()) ? "not-allowed" : "pointer" }}>{deciding ? "Sending…" : "Reject & notify"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {withdrawals.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#4A5170", fontSize: 13, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>No withdrawal requests</div>
        ) : withdrawals.map((w) => (
          <div key={w.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>${w.amount.toFixed(2)} — {w.profiles?.full_name ?? "Unknown teacher"}</p>
              <p style={{ fontSize: 11, color: "#4A5170", margin: "2px 0 0" }}>{w.profiles?.email} · payout to {w.payout_phone} · {new Date(w.requested_at).toLocaleDateString()}</p>
              {w.rejection_reason && <p style={{ fontSize: 11, color: "#FF6B6B", margin: "2px 0 0" }}>Rejected: {w.rejection_reason}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, textTransform: "capitalize", color: STATUS_COLOR[w.status], background: `${STATUS_COLOR[w.status]}18`, border: `1px solid ${STATUS_COLOR[w.status]}35` }}>
                {w.status}
              </span>
              {w.status === "pending" && (
                <>
                  <button onClick={() => decide(w.id, "approved")} disabled={deciding} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", cursor: "pointer" }}>Approve</button>
                  <button onClick={() => setRejecting(w)} disabled={deciding} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623", cursor: "pointer" }}>Reject</button>
                </>
              )}
              {w.status === "approved" && (
                <button onClick={() => decide(w.id, "paid")} disabled={deciding} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", cursor: "pointer" }}>Mark Paid</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
