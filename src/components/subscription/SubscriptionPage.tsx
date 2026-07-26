"use client";
import { useState } from "react";
import { SubscriptionDashboard } from "./SubscriptionDashboard";
import { PricingPlans } from "./PricingPlans";

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", dim: "#6E7A6C", accent: "#B1502B" };

interface Props {
  role: "student" | "teacher" | "school";
  currentPlanKey: string;
  username: string;
}

export function SubscriptionPage({ role, currentPlanKey, username }: Props) {
  const [view, setView] = useState<"dashboard" | "plans">("dashboard");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { key: "dashboard", label: "My Plan" },
          { key: "plans", label: "Upgrade / Buy Credits" },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key as "dashboard" | "plans")}
            style={{ padding: "9px 20px", borderRadius: 10, background: view === t.key ? S.accent : "rgba(28,38,32,0.04)", border: `1px solid ${view === t.key ? S.accent : S.border}`, color: view === t.key ? "#fff" : S.dim, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === "dashboard" ? (
        <SubscriptionDashboard onUpgrade={() => setView("plans")} />
      ) : (
        <PricingPlans role={role} currentPlanKey={currentPlanKey} username={username} />
      )}
    </div>
  );
}
