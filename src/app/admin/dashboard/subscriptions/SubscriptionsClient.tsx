/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Sub {
  id: string;
  plan: string;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  payment_method: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  profiles: { id: string; full_name: string; email: string; role: string } | null;
}

const PLANS = ["free", "basic", "premium", "enterprise"];
const STATUSES = ["active", "trial", "expired", "cancelled"];
const PLAN_COLOR: Record<string, string> = { free: "#4A5170", basic: "#4D7FFF", premium: "#BD93F9", enterprise: "#F5A623" };
const STATUS_COLOR: Record<string, string> = { active: "#00E5A3", trial: "#4D7FFF", expired: "#FF6B6B", cancelled: "#4A5170" };

export function SubscriptionsClient({ subs: initialSubs, stats }: { subs: Sub[]; stats: { active: number; trial: number; expired: number } }) {
  const [subs, setSubs] = useState(initialSubs);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const supabase = createClient();

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const updatePlan = async (id: string, plan: string, status: string) => {
    setUpdating(id);
    const { data } = await (supabase.from("subscriptions") as any)
      .update({ plan, status, updated_at: new Date().toISOString() }).eq("id", id).select(`
        id, plan, status, amount_paid, currency, payment_method, start_date, end_date, created_at,
        profiles!user_id(id, full_name, email, role)
      `).single();
    if (data) {
      setSubs((p) => p.map((s) => s.id === id ? data : s));
      fetch("/api/admin/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscription_updated", targetType: "subscription", targetId: id, details: { plan, status } }),
      }).catch(() => {});
    }
    setUpdating(null);
    notify("Plan updated ✓");
  };

  const filtered = subs.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.profiles?.full_name?.toLowerCase().includes(q) || s.profiles?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const revenue = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.amount_paid ?? 0), 0);

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Subscriptions</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Manage all user and school subscription plans</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Active", value: stats.active, color: "#00E5A3" },
          { label: "Trial", value: stats.trial, color: "#4D7FFF" },
          { label: "Expired", value: stats.expired, color: "#FF6B6B" },
          { label: "Total Revenue", value: `$${revenue.toFixed(0)}`, color: "#F5A623" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#4A5170", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" style={{ flex: 1, minWidth: 200, padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 13, color: "#CDD6F4", outline: "none" }} />
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: filter === s ? "rgba(77,127,255,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${filter === s ? "rgba(77,127,255,0.4)" : "rgba(255,255,255,0.08)"}`, color: filter === s ? "#4D7FFF" : "#6B7290" }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {notification && <span style={{ fontSize: 12, color: "#00E5A3" }}>{notification}</span>}
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["User", "Role", "Plan", "Status", "Amount", "Expires", "Change Plan"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#4A5170", fontSize: 13 }}>No subscriptions found</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#CDD6F4", margin: 0 }}>{s.profiles?.full_name ?? "—"}</p>
                    <p style={{ fontSize: 10, color: "#4A5170", margin: 0 }}>{s.profiles?.email ?? "—"}</p>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(255,255,255,0.04)", color: "#8892B0", border: "1px solid rgba(255,255,255,0.07)" }}>{s.profiles?.role?.replace("_", " ") ?? "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: PLAN_COLOR[s.plan] ?? "#8892B0", background: `${PLAN_COLOR[s.plan] ?? "#8892B0"}12`, border: `1px solid ${PLAN_COLOR[s.plan] ?? "#8892B0"}25`, textTransform: "capitalize" }}>{s.plan}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: STATUS_COLOR[s.status] ?? "#8892B0", background: `${STATUS_COLOR[s.status] ?? "#8892B0"}12`, border: `1px solid ${STATUS_COLOR[s.status] ?? "#8892B0"}25` }}>{s.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7290" }}>{s.amount_paid ? `$${s.amount_paid}` : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "#4A5170" }}>{s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      disabled={updating === s.id}
                      value={s.plan}
                      onChange={(e) => updatePlan(s.id, e.target.value, "active")}
                      style={{ padding: "5px 10px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#CDD6F4", cursor: "pointer", outline: "none" }}
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
