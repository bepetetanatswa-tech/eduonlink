"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan } from "@/lib/subscription/plans";

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

interface Sub { id: string; plan_key: string | null; status: string; start_date: string; end_date: string | null; amount_paid: number; }
interface Payment { id: string; plan_key: string | null; credit_pack_key: string | null; amount: number; status: string; transaction_id: string | null; created_at: string; rejection_reason: string | null; purchase_type: string | null; }
interface Credits { ai_questions: number; mock_exams: number; pdf_downloads: number; certificates: number; }

export function SubscriptionDashboard({ onUpgrade }: { onUpgrade: () => void }) {
  const supabase = createClient();
  const [sub, setSub] = useState<Sub | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // subscriptions/payment_verifications.user_id references profiles(id);
    // user_credits.user_id references auth.users(id) — the two tables use
    // different id conventions, so both must be resolved separately.
    const { data: profile } = await (supabase.from("profiles") as any).select("id").eq("user_id", user.id).single();
    const [{ data: subs }, { data: pays }, { data: creds }] = await Promise.all([
      (supabase.from("subscriptions") as any).select("*").eq("user_id", profile?.id ?? "").order("created_at", { ascending: false }).limit(1),
      (supabase.from("payment_verifications") as any).select("*").eq("user_id", profile?.id ?? "").order("created_at", { ascending: false }).limit(15),
      (supabase.from("user_credits") as any).select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setSub(subs?.[0] ?? null);
    setPayments(pays ?? []);
    setCredits(creds ?? null);
    setLoading(false);
  };

  const cancel = async () => {
    if (!sub) return;
    if (!confirm("Cancel your subscription? You will keep access until the expiry date.")) return;
    await (supabase.from("subscriptions") as any).update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", sub.id);
    load();
  };

  if (loading) return <div style={{ color: S.dim, fontSize: 13, padding: 20 }}>Loading…</div>;

  const plan = getPlan(sub?.plan_key ?? "free_student");
  const daysLeft = sub?.end_date ? Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / 86400000) : null;
  const isActive = sub?.status === "active" || sub?.status === "trial";
  const isFree = plan.price === 0;
  const statusColor = isActive ? "#00E5A3" : sub?.status === "cancelled" ? "#FF6B6B" : S.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Current plan card */}
      <div style={{ background: isFree ? "rgba(255,255,255,0.02)" : "rgba(77,127,255,0.05)", border: `1px solid ${isFree ? S.border : "rgba(77,127,255,0.2)"}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: S.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Current Plan</p>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 8px" }}>{plan.name}</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}35`, padding: "2px 10px", borderRadius: 20 }}>
                {sub?.status?.toUpperCase() ?? "FREE"}
              </span>
              {daysLeft !== null && daysLeft >= 0 && (
                <span style={{ fontSize: 12, color: daysLeft <= 3 ? "#FF6B6B" : S.dim }}>
                  {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
                </span>
              )}
              {daysLeft !== null && daysLeft < 0 && (
                <span style={{ fontSize: 12, color: "#FF6B6B" }}>Expired</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: isFree ? S.dim : S.accent, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
              {isFree ? "FREE" : `$${plan.price.toFixed(2)}/mo`}
            </p>
          </div>
        </div>

        {isFree && (
          <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: "#FF9B6B", margin: 0 }}>
              You are on the free plan. You have access to <strong>2 lessons/month</strong>, <strong>3 AI questions/day</strong>, and view-only timetable.
              Assignments, grades, exam prep, live classes, and more are locked.
            </p>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onUpgrade} style={{ padding: "9px 20px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {isFree ? "Upgrade Now" : "Change Plan"}
          </button>
          {isActive && !isFree && (
            <button onClick={cancel} style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B", fontSize: 13, cursor: "pointer" }}>
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Expiry warning */}
      {daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && (
        <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, padding: "12px 16px" }}>
          <p style={{ fontSize: 13, color: "#F5A623", margin: 0 }}>
            ⚠️ Subscription expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}. Renew now to avoid being moved to the free plan.
          </p>
        </div>
      )}

      {/* Credit balances */}
      {credits && (credits.ai_questions > 0 || credits.mock_exams > 0 || credits.pdf_downloads > 0 || credits.certificates > 0) && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 14px" }}>Your Credit Balance</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {[
              { label: "AI Questions", value: credits.ai_questions, emoji: "🤖" },
              { label: "Mock Exams", value: credits.mock_exams, emoji: "📝" },
              { label: "PDF Downloads", value: credits.pdf_downloads, emoji: "📄" },
              { label: "Certificates", value: credits.certificates, emoji: "🏆" },
            ].filter(c => c.value > 0).map(c => (
              <div key={c.label} style={{ background: "rgba(0,229,163,0.04)", border: "1px solid rgba(0,229,163,0.12)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{c.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#00E5A3", fontFamily: "'Space Grotesk',sans-serif" }}>{c.value}</div>
                <div style={{ fontSize: 10, color: S.dim, marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Included features */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 12px" }}>
          {isFree ? "What you have access to" : "Included in your plan"}
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
          {plan.features.map(f => (
            <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#00E5A3", fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 12, color: S.muted }}>{f}</span>
            </div>
          ))}
          {plan.lockedFeatures.map(f => (
            <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#FF6B6B", fontSize: 12 }}>✗</span>
              <span style={{ fontSize: 12, color: S.dim }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 14px" }}>Payment History</h4>
        {payments.length === 0 ? (
          <p style={{ fontSize: 13, color: S.dim }}>No payment history yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payments.map(p => {
              const sc = p.status === "approved" ? "#00E5A3" : p.status === "rejected" ? "#FF6B6B" : "#F5A623";
              const label = p.purchase_type === "credits" ? (p.credit_pack_key ?? "Credits") : getPlan(p.plan_key ?? "free_student").name;
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 10, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>
                      {p.transaction_id && `TxID: ${p.transaction_id} · `}{new Date(p.created_at).toLocaleDateString()}
                    </p>
                    {p.rejection_reason && <p style={{ fontSize: 11, color: "#FF6B6B", margin: "3px 0 0" }}>Reason: {p.rejection_reason}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: S.accent, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>${p.amount}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc, background: `${sc}18`, border: `1px solid ${sc}35`, padding: "2px 8px", borderRadius: 20 }}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
