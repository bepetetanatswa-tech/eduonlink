"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createReconnectingSubscription } from "@/lib/supabase/reconnect";

interface Sale {
  id: string; amount_paid: number; platform_fee_pct: number; teacher_earning_amount: number;
  created_at: string; label: string;
}
interface Withdrawal {
  id: string; amount: number; status: string; payout_phone: string;
  rejection_reason: string | null; requested_at: string; processed_at: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#A9873F", approved: "#B1502B", paid: "#1F4738", rejected: "#A3311E",
};

export function EarningsClient({
  profileId, totalEarned, totalGross, totalCommission, totalWithdrawn, availableBalance, sales, withdrawals,
}: {
  profileId: string; totalEarned: number; totalGross: number; totalCommission: number; totalWithdrawn: number; availableBalance: number;
  sales: Sale[]; withdrawals: Withdrawal[];
}) {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(availableBalance.toFixed(2));
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localWithdrawals, setLocalWithdrawals] = useState(withdrawals);
  const [localAvailable, setLocalAvailable] = useState(availableBalance);
  const [localSales, setLocalSales] = useState(sales);
  const [localGross, setLocalGross] = useState(totalGross);
  const [localCommission, setLocalCommission] = useState(totalCommission);
  const [localEarned, setLocalEarned] = useState(totalEarned);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const stop = createReconnectingSubscription((onStatus) => {
      const channel = supabase
        .channel(`teacher-sales:${profileId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "course_purchases",
          filter: `teacher_id=eq.${profileId}`,
        }, async (payload: any) => {
          const row = payload.new;
          if (row.status !== "completed") return;
          const { data: course } = await (supabase.from("courses") as any).select("title").eq("id", row.course_id).maybeSingle();
          setLocalSales((prev) => [{
            id: row.id, amount_paid: row.amount_paid, platform_fee_pct: row.platform_fee_pct,
            teacher_earning_amount: row.teacher_earning_amount, created_at: row.created_at,
            label: course?.title ?? "Course",
          }, ...prev]);
          setLocalGross((p) => p + row.amount_paid);
          setLocalCommission((p) => p + (row.platform_fee_amount ?? 0));
          setLocalEarned((p) => p + row.teacher_earning_amount);
          setLocalAvailable((p) => p + row.teacher_earning_amount);
        })
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "class_purchases",
          filter: `teacher_id=eq.${profileId}`,
        }, async (payload: any) => {
          const row = payload.new;
          if (row.status !== "completed") return;
          const { data: klass } = await (supabase.from("classes") as any).select("name").eq("id", row.class_id).maybeSingle();
          setLocalSales((prev) => [{
            id: row.id, amount_paid: row.amount_paid, platform_fee_pct: row.platform_fee_pct,
            teacher_earning_amount: row.teacher_earning_amount, created_at: row.created_at,
            label: klass?.name ?? "Class",
          }, ...prev]);
          setLocalGross((p) => p + row.amount_paid);
          setLocalCommission((p) => p + (row.platform_fee_amount ?? 0));
          setLocalEarned((p) => p + row.teacher_earning_amount);
          setLocalAvailable((p) => p + row.teacher_earning_amount);
        })
        .subscribe(onStatus);
      return { remove: () => supabase.removeChannel(channel) };
    }, (status) => setLive(status === "connected"));
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Earnings</h2>
          <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Revenue from your paid courses and classes, after the platform commission</p>
        </div>
        <span style={{ fontSize: 11, color: live ? "#1F4738" : "#6E7A6C", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: live ? "#1F4738" : "#6E7A6C" }} />
          {live ? "Live" : "Connecting…"}
        </span>
      </div>

      <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, color: "#6E7A6C", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>How your earnings are calculated</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: "#566257", margin: "0 0 4px" }}>Total sales (what students paid)</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>${localGross.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#566257", margin: "0 0 4px" }}>− Platform commission (20%)</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#A3311E", fontFamily: "inherit", margin: 0 }}>−${localCommission.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#566257", margin: "0 0 4px" }}>= You earned</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#1F4738", fontFamily: "inherit", margin: 0 }}>${localEarned.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Total earned (net)", value: localEarned, color: "#1C2620" },
          { label: "Already withdrawn", value: totalWithdrawn, color: "#566257" },
          { label: "Available to withdraw", value: localAvailable, color: "#1F4738" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, color: "#6E7A6C", margin: "0 0 6px" }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "inherit", margin: 0 }}>${s.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={localAvailable <= 0}
            style={{ padding: "10px 22px", borderRadius: 10, background: localAvailable > 0 ? "rgba(31,71,56,0.9)" : "rgba(28,38,32,0.05)", border: "none", color: localAvailable > 0 ? "#F2EEE3" : "#6E7A6C", fontSize: 13, fontWeight: 700, cursor: localAvailable > 0 ? "pointer" : "not-allowed" }}
          >
            Request Withdrawal
          </button>
        ) : (
          <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1C2620", margin: 0 }}>Request Withdrawal</h3>
            {error && <p style={{ fontSize: 12, color: "#A3311E", margin: 0 }}>{error}</p>}
            <div>
              <label style={{ fontSize: 11, color: "#566257", display: "block", marginBottom: 5 }}>Amount (USD, max ${localAvailable.toFixed(2)})</label>
              <input type="number" min="0" max={localAvailable} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)", borderRadius: 9, color: "#1C2620", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#566257", display: "block", marginBottom: 5 }}>EcoCash number to pay out to</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567"
                style={{ width: "100%", padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)", borderRadius: 9, color: "#1C2620", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(28,38,32,0.08)", color: "#566257", cursor: "pointer" }}>Cancel</button>
              <button onClick={submitWithdrawal} disabled={submitting} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(31,71,56,0.9)", border: "none", color: "#F2EEE3", cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#566257", marginBottom: 8 }}>Withdrawal history</p>
        {localWithdrawals.length === 0 ? (
          <p style={{ fontSize: 12, color: "#6E7A6C" }}>No withdrawal requests yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {localWithdrawals.map((w) => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, color: "#1C2620", margin: 0 }}>${w.amount.toFixed(2)} → {w.payout_phone}</p>
                  <p style={{ fontSize: 11, color: "#6E7A6C", margin: "2px 0 0" }}>{new Date(w.requested_at).toLocaleDateString()}{w.rejection_reason ? ` · ${w.rejection_reason}` : ""}</p>
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
        <p style={{ fontSize: 13, fontWeight: 600, color: "#566257", marginBottom: 8 }}>Recent sales</p>
        {localSales.length === 0 ? (
          <p style={{ fontSize: 12, color: "#6E7A6C" }}>No sales yet. Set a price on a course or independent class to start earning.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {localSales.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, color: "#1C2620", margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: "#6E7A6C", margin: "2px 0 0" }}>{new Date(s.created_at).toLocaleDateString()} · sold for ${s.amount_paid.toFixed(2)}, {s.platform_fee_pct}% fee</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1F4738", margin: 0 }}>+${s.teacher_earning_amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
