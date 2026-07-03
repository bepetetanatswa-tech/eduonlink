"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan } from "@/lib/subscription/plans";

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

interface PV {
  id: string; user_id: string; transaction_id: string | null; phone_number: string | null;
  amount: number; plan_key: string | null; credit_pack_key: string | null; credit_type: string | null;
  credit_amount: number | null; status: string; screenshot_url: string | null; purchase_type: string | null;
  rejection_reason: string | null; created_at: string;
  profile?: { id: string; full_name: string; email: string; role: string } | null;
}

const REJECTION_PRESETS = ["Wrong amount sent", "Fake transaction ID", "Transaction not found on EcoCash", "Reference code missing", "Duplicate submission", "Phone number blacklisted"];

export function AdminPaymentQueue({ statusFilter = "pending", onCountChange }: { statusFilter?: string; onCountChange?: (n: number) => void }) {
  const supabase = createClient();
  const [payments, setPayments] = useState<PV[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ pv: PV; reason: string } | null>(null);
  const [blacklistModal, setBlacklistModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const notify = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("payment_verifications") as any)
      .select("*, profile:profiles!payment_verifications_profile_id_fkey(id,full_name,email,role)")
      .eq("status", statusFilter)
      .order("created_at", { ascending: false })
      .limit(200);
    const list = data ?? [];
    setPayments(list);
    onCountChange?.(list.length);
    setLoading(false);
  };

  const approve = async (pv: PV) => {
    setProcessing(pv.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminProfile } = await (supabase.from("profiles") as any).select("id").eq("user_id", user?.id).single();

    const { error: statusErr } = await (supabase.from("payment_verifications") as any).update({
      status: "approved",
      verified_by: adminProfile?.id ?? null,
      verified_at: new Date().toISOString(),
    }).eq("id", pv.id);

    if (statusErr) {
      notify("error", `Could not mark payment approved: ${statusErr.message}`);
      setProcessing(null);
      return;
    }

    if (pv.purchase_type === "credits" && pv.credit_type && pv.credit_amount) {
      // Top up credits
      const col = pv.credit_type === "ai_questions" ? "ai_questions"
        : pv.credit_type === "mock_exams" ? "mock_exams"
        : pv.credit_type === "pdf_downloads" ? "pdf_downloads"
        : pv.credit_type === "certificates" ? "certificates"
        : "school_seats";

      const { data: existing } = await (supabase.from("user_credits") as any).select(col).eq("user_id", pv.user_id).maybeSingle();
      const current = existing?.[col] ?? 0;
      const { error: creditErr } = await (supabase.from("user_credits") as any).upsert({ user_id: pv.user_id, [col]: current + pv.credit_amount }, { onConflict: "user_id" });

      if (creditErr) {
        notify("error", `Payment marked approved, but crediting the account failed: ${creditErr.message}. Fix manually.`);
        setProcessing(null);
        load();
        return;
      }

      await (supabase.from("notifications") as any).insert({
        user_id: pv.user_id,
        title: "Credits added to your account! 🎉",
        body: `${pv.credit_amount} ${pv.credit_type?.replace(/_/g, " ")} credits have been added to your account.`,
        type: "success",
      });
    } else {
      // Activate subscription
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const planName = getPlan(pv.plan_key ?? "free_student").name;

      const { error: subErr } = await (supabase.from("subscriptions") as any).insert({
        user_id: pv.user_id,
        plan_key: pv.plan_key,
        plan_price: pv.amount,
        status: "active",
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        amount_paid: pv.amount,
        payment_id: pv.id,
      });

      if (subErr) {
        notify("error", `Payment marked approved, but activating the subscription failed: ${subErr.message}. Fix manually.`);
        setProcessing(null);
        load();
        return;
      }

      await (supabase.from("notifications") as any).insert({
        user_id: pv.user_id,
        title: `Payment approved! Your ${planName} is now active 🎉`,
        body: `Welcome to VOA Pro! Your subscription runs until ${end.toLocaleDateString()}. Enjoy full access!`,
        type: "success",
      });
    }

    notify("success", "Payment approved ✓");
    setProcessing(null);
    load();
  };

  const reject = async (pv: PV, reason: string) => {
    setProcessing(pv.id);
    const { error } = await (supabase.from("payment_verifications") as any).update({ status: "rejected", rejection_reason: reason }).eq("id", pv.id);
    if (error) {
      notify("error", `Could not reject payment: ${error.message}`);
      setProcessing(null);
      return;
    }
    await (supabase.from("notifications") as any).insert({
      user_id: pv.user_id,
      title: "Payment verification failed",
      body: `Your payment of $${pv.amount} was not approved. Reason: ${reason}. Please contact support if you believe this is an error.`,
      type: "error",
    });
    notify("success", "Payment rejected");
    setRejectModal(null);
    setProcessing(null);
    load();
  };

  const doBlacklist = async (phone: string) => {
    const { error } = await (supabase.from("blacklisted_phones") as any).upsert({ phone_number: phone, reason: "Blacklisted by admin" }, { onConflict: "phone_number" });
    if (error) {
      notify("error", `Could not blacklist number: ${error.message}`);
      return;
    }
    notify("success", "Number blacklisted");
    setBlacklistModal(null);
  };

  if (loading) return <div style={{ color: S.dim, fontSize: 13, padding: "16px 0" }}>Loading…</div>;
  if (payments.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {notification && (
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: notification.type === "success" ? "rgba(0,229,163,0.08)" : "rgba(255,107,107,0.08)",
          border: `1px solid ${notification.type === "success" ? "rgba(0,229,163,0.2)" : "rgba(255,107,107,0.2)"}`,
          color: notification.type === "success" ? "#00E5A3" : "#FF6B6B", fontSize: 13,
        }}>
          {notification.type === "success" ? "✓" : "⚠️"} {notification.msg}
        </div>
      )}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: S.dim, margin: 0 }}>No {statusFilter} payments</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {notification && (
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: notification.type === "success" ? "rgba(0,229,163,0.08)" : "rgba(255,107,107,0.08)",
          border: `1px solid ${notification.type === "success" ? "rgba(0,229,163,0.2)" : "rgba(255,107,107,0.2)"}`,
          color: notification.type === "success" ? "#00E5A3" : "#FF6B6B", fontSize: 13,
        }}>
          {notification.type === "success" ? "✓" : "⚠️"} {notification.msg}
        </div>
      )}
      {payments.map(pv => {
        const planLabel = pv.purchase_type === "credits" ? (pv.credit_pack_key ?? "Credits") : getPlan(pv.plan_key ?? "free_student").name;
        const isPending = pv.status === "pending";
        const borderColor = isPending ? "rgba(245,166,35,0.25)" : pv.status === "approved" ? "rgba(0,229,163,0.15)" : "rgba(255,107,107,0.15)";
        return (
          <div key={pv.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${borderColor}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: S.text, margin: 0, fontFamily: "'Space Grotesk',sans-serif" }}>
                    {pv.profile?.full_name ?? "Unknown User"}
                  </p>
                  <span style={{ fontSize: 10, color: S.dim, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 20 }}>
                    {pv.profile?.role ?? "user"}
                  </span>
                  <span style={{ fontSize: 10, color: pv.purchase_type === "credits" ? "#00E5A3" : S.accent, background: pv.purchase_type === "credits" ? "rgba(0,229,163,0.08)" : "rgba(77,127,255,0.08)", padding: "2px 8px", borderRadius: 20 }}>
                    {pv.purchase_type === "credits" ? "Credit Pack" : "Subscription"}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: S.muted, margin: "0 0 6px" }}>{pv.profile?.email}</p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: S.dim }}>Plan/Pack: <strong style={{ color: S.accent }}>{planLabel}</strong></span>
                  <span style={{ fontSize: 12, color: S.dim }}>Amount: <strong style={{ color: "#00E5A3" }}>${pv.amount}</strong></span>
                  {pv.phone_number && <span style={{ fontSize: 12, color: S.dim }}>Phone: {pv.phone_number}</span>}
                  {pv.transaction_id && <span style={{ fontSize: 12, color: S.dim }}>TxID: <code style={{ fontSize: 11, color: S.muted }}>{pv.transaction_id}</code></span>}
                  <span style={{ fontSize: 12, color: S.dim }}>{new Date(pv.created_at).toLocaleString()}</span>
                </div>
                {pv.rejection_reason && <p style={{ fontSize: 12, color: "#FF6B6B", margin: "6px 0 0" }}>Reason: {pv.rejection_reason}</p>}
                {pv.screenshot_url && (
                  <a href={pv.screenshot_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: S.accent, marginTop: 4, display: "inline-block" }}>
                    View screenshot →
                  </a>
                )}
              </div>
              {isPending && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  <button onClick={() => approve(pv)} disabled={processing === pv.id}
                    style={{ padding: "8px 16px", borderRadius: 9, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.3)", color: "#00E5A3", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: processing === pv.id ? 0.5 : 1 }}>
                    {processing === pv.id ? "…" : "✓ Approve"}
                  </button>
                  <button onClick={() => setRejectModal({ pv, reason: "" })}
                    style={{ padding: "8px 16px", borderRadius: 9, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ✗ Reject
                  </button>
                  {pv.phone_number && (
                    <button onClick={() => setBlacklistModal(pv.phone_number!)}
                      style={{ padding: "8px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, color: S.dim, fontSize: 12, cursor: "pointer" }}>
                      🚫
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setRejectModal(null)}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 18, padding: 26, maxWidth: 440, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FF6B6B", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Reject Payment</h3>
            <p style={{ fontSize: 13, color: S.muted, margin: 0 }}>{rejectModal.pv.profile?.full_name} — ${rejectModal.pv.amount}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.dim }}>Quick reason</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {REJECTION_PRESETS.map(r => (
                  <button key={r} onClick={() => setRejectModal(m => m ? { ...m, reason: r } : null)}
                    style={{ padding: "5px 10px", borderRadius: 7, background: rejectModal.reason === r ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${rejectModal.reason === r ? "rgba(255,107,107,0.4)" : S.border}`, color: rejectModal.reason === r ? "#FF6B6B" : S.dim, fontSize: 11, cursor: "pointer" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.dim, display: "block", marginBottom: 6 }}>Custom reason</label>
              <input value={rejectModal.reason} onChange={e => setRejectModal(m => m ? { ...m, reason: e.target.value } : null)}
                placeholder="Or type a custom reason…" style={inp} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: "9px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => reject(rejectModal.pv, rejectModal.reason || "Rejected by admin")}
                style={{ flex: 1, padding: "9px", borderRadius: 9, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#FF6B6B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist modal */}
      {blacklistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setBlacklistModal(null)}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, maxWidth: 360, width: "90%" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FF6B6B", margin: "0 0 8px" }}>Blacklist Phone Number</h3>
            <p style={{ fontSize: 13, color: S.muted, margin: "0 0 18px" }}>Block <strong style={{ color: S.text }}>{blacklistModal}</strong> from submitting payments?</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setBlacklistModal(null)} style={{ flex: 1, padding: "9px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => doBlacklist(blacklistModal)} style={{ flex: 1, padding: "9px", borderRadius: 9, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#FF6B6B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Blacklist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
