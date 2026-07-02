"use client";

import { useState } from "react";

interface Sale {
  id: string; amount_paid: number; platform_fee_pct: number; teacher_earning_amount: number;
  created_at: string; courses: { title: string } | null;
}
interface Withdrawal {
  id: string; amount: number; status: string; payout_phone: string;
  rejection_reason: string | null; requested_at: string; processed_at: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#F5A623", approved: "#4D7FFF", paid: "#00E5A3", rejected: "#FF6B6B",
};

export function EarningsClient({
  totalEarned, totalWithdrawn, availableBalance, sales, withdrawals,
}: {
  totalEarned: number; totalWithdrawn: number; availableBalance: number;
  sales: Sale[]; withdrawals: Withdrawal[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(availableBalance.toFixed(2));
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localWithdrawals, setLocalWithdrawals] = useState(withdrawals);
  const [localAvailable, setLocalAvailable] = useState(availableBalance);

  const submitWithdrawal = async () => {
    setError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (amt > localAvailable) { setError(`You can withdraw at most $${localAvailable.toFixed(2)}.`); return; }
    if (!phone.trim()) { setError("Enter the EcoCash phone number to pay out to."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, payoutPhone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not submit withdrawal request."); return; }
      setLocalWithdrawals((p) => [data.withdrawal, ...p]);
      setLocalAvailable((p) => p - amt);
      setShowForm(false);
      setPhone("");
    } catch {
      setError("Could not submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Earnings</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Revenue from your paid courses, after the platform commission</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Total earned", value: totalEarned, color: "#CDD6F4" },
          { label: "Already withdrawn", value: totalWithdrawn, color: "#8892B0" },
          { label: "Available to withdraw", value: localAvailable, color: "#00E5A3" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, color: "#4A5170", margin: "0 0 6px" }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>${s.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={localAvailable <= 0}
            style={{ padding: "10px 22px", borderRadius: 10, background: localAvailable > 0 ? "rgba(0,229,163,0.9)" : "rgba(255,255,255,0.05)", border: "none", color: localAvailable > 0 ? "#07080C" : "#4A5170", fontSize: 13, fontWeight: 700, cursor: localAvailable > 0 ? "pointer" : "not-allowed" }}
          >
            Request Withdrawal
          </button>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>Request Withdrawal</h3>
            {error && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>{error}</p>}
            <div>
              <label style={{ fontSize: 11, color: "#8892B0", display: "block", marginBottom: 5 }}>Amount (USD, max ${localAvailable.toFixed(2)})</label>
              <input type="number" min="0" max={localAvailable} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#CDD6F4", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#8892B0", display: "block", marginBottom: 5 }}>EcoCash number to pay out to</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567"
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#CDD6F4", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
              <button onClick={submitWithdrawal} disabled={submitting} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(0,229,163,0.9)", border: "none", color: "#07080C", cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8892B0", marginBottom: 8 }}>Withdrawal history</p>
        {localWithdrawals.length === 0 ? (
          <p style={{ fontSize: 12, color: "#4A5170" }}>No withdrawal requests yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {localWithdrawals.map((w) => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, color: "#CDD6F4", margin: 0 }}>${w.amount.toFixed(2)} → {w.payout_phone}</p>
                  <p style={{ fontSize: 11, color: "#4A5170", margin: "2px 0 0" }}>{new Date(w.requested_at).toLocaleDateString()}{w.rejection_reason ? ` · ${w.rejection_reason}` : ""}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, textTransform: "capitalize", color: STATUS_COLOR[w.status], background: `${STATUS_COLOR[w.status]}18`, border: `1px solid ${STATUS_COLOR[w.status]}35` }}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8892B0", marginBottom: 8 }}>Recent sales</p>
        {sales.length === 0 ? (
          <p style={{ fontSize: 12, color: "#4A5170" }}>No sales yet. Set a price on a course to start earning.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sales.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, color: "#CDD6F4", margin: 0 }}>{s.courses?.title ?? "Course"}</p>
                  <p style={{ fontSize: 11, color: "#4A5170", margin: "2px 0 0" }}>{new Date(s.created_at).toLocaleDateString()} · sold for ${s.amount_paid.toFixed(2)}, {s.platform_fee_pct}% fee</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#00E5A3", margin: 0 }}>+${s.teacher_earning_amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
