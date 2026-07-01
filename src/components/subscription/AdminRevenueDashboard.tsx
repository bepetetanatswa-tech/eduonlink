"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlan } from "@/lib/subscription/plans";
import { AdminPaymentQueue } from "./AdminPaymentQueue";

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

interface Pay { id: string; amount: number; status: string; plan_key: string | null; purchase_type: string | null; created_at: string; profile?: { full_name: string; email: string; role: string } | null; transaction_id: string | null; phone_number: string | null; }
interface Sub { plan_key: string | null; status: string; }

type QueueTab = "pending" | "approved" | "rejected";

export function AdminRevenueDashboard() {
  const supabase = createClient();
  const [payments, setPayments] = useState<Pay[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<QueueTab>("pending");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    const [{ data: pays }, { data: subData }] = await Promise.all([
      (supabase.from("payment_verifications") as any)
        .select("id,amount,status,plan_key,purchase_type,created_at,transaction_id,phone_number,profile:profiles!payment_verifications_profile_id_fkey(full_name,email,role)")
        .order("created_at", { ascending: false }).limit(1000),
      (supabase.from("subscriptions") as any).select("plan_key,status").limit(2000),
    ]);
    setPayments(pays ?? []);
    setSubs(subData ?? []);
    setLoading(false);
  };

  const approved = payments.filter(p => p.status === "approved");
  const totalRevenue = approved.reduce((sum, p) => sum + Number(p.amount), 0);
  const monthlyRevenue = approved.filter(p => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + Number(p.amount), 0);
  const activeCount = subs.filter(s => s.status === "active").length;

  // Last 6 months bar chart
  const bars = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = approved.filter(p => p.created_at.startsWith(key)).reduce((s, p) => s + Number(p.amount), 0);
    return { month: d.toLocaleString("default", { month: "short" }), total };
  });
  const maxBar = Math.max(...bars.map(b => b.total), 1);

  // Plan breakdown
  const byPlan: Record<string, number> = {};
  subs.filter(s => s.status === "active").forEach(s => {
    const k = s.plan_key ?? "free";
    byPlan[k] = (byPlan[k] ?? 0) + 1;
  });

  const exportCSV = () => {
    const rows = [
      ["Date", "User", "Email", "Role", "Plan/Pack", "Amount", "Status", "Transaction ID", "Phone"],
      ...payments.map(p => [
        new Date(p.created_at).toLocaleDateString(),
        p.profile?.full_name ?? "",
        p.profile?.email ?? "",
        p.profile?.role ?? "",
        p.purchase_type === "credits" ? "Credit Pack" : getPlan(p.plan_key ?? "free_student").name,
        p.amount,
        p.status,
        p.transaction_id ?? "",
        p.phone_number ?? "",
      ]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `voa-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) return <div style={{ color: S.dim, fontSize: 13, padding: 20 }}>Loading revenue data…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12 }}>
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "#00E5A3", sub: "all time" },
          { label: "This Month", value: `$${monthlyRevenue.toFixed(2)}`, color: S.accent, sub: new Date().toLocaleString("default", { month: "long" }) },
          { label: "Active Subscriptions", value: activeCount, color: "#BD93F9", sub: "right now" },
          { label: "Pending Review", value: pendingCount, color: "#F5A623", sub: "needs approval" },
          { label: "Total Transactions", value: payments.length, color: S.muted, sub: "all time" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ fontSize: 10, color: S.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>{stat.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: stat.color, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 2px" }}>{stat.value}</p>
            <p style={{ fontSize: 10, color: S.dim, margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 20px" }}>Monthly Revenue (USD)</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 130, paddingBottom: 6 }}>
          {bars.map(b => (
            <div key={b.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              {b.total > 0 && <span style={{ fontSize: 10, color: S.muted }}>${b.total}</span>}
              <div style={{ width: "100%", borderRadius: "5px 5px 0 0", height: `${Math.max((b.total / maxBar) * 90, b.total > 0 ? 5 : 2)}px`, background: b.total > 0 ? `linear-gradient(180deg, ${S.accent}, rgba(77,127,255,0.35))` : "rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 10, color: S.dim }}>{b.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan breakdown */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 16px" }}>Active Subscriptions by Plan</h3>
        {Object.keys(byPlan).length === 0 ? (
          <p style={{ fontSize: 13, color: S.dim }}>No active subscriptions yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(byPlan).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: S.muted, minWidth: 170, flexShrink: 0 }}>{getPlan(key).name}</span>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(count / Math.max(activeCount, 1)) * 100}%`, background: S.accent, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, color: S.accent, fontWeight: 700, minWidth: 28, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment queue */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Payment Verifications</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["pending", "approved", "rejected"] as QueueTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 8, background: tab === t ? S.accent : "rgba(255,255,255,0.04)", border: `1px solid ${tab === t ? S.accent : S.border}`, color: tab === t ? "#fff" : S.dim, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>
                {t}{t === "pending" ? ` (${pendingCount})` : ""}
              </button>
            ))}
            <button onClick={exportCSV} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(0,229,163,0.08)", border: "1px solid rgba(0,229,163,0.2)", color: "#00E5A3", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              ↓ Export CSV
            </button>
          </div>
        </div>
        <AdminPaymentQueue statusFilter={tab} key={tab} onCountChange={tab === "pending" ? setPendingCount : undefined} />
      </div>
    </div>
  );
}
