"use client";
import { useState } from "react";
import { getPlansForRole, CREDIT_PACKS, PlanDefinition, CreditPack } from "@/lib/subscription/plans";
import { EcoCashPayment } from "./EcoCashPayment";

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

interface Props {
  role: "student" | "teacher" | "school";
  currentPlanKey: string;
  username: string;
}

type Selection = { plan: PlanDefinition; pack?: undefined } | { pack: CreditPack; plan?: undefined };

export function PricingPlans({ role, currentPlanKey, username }: Props) {
  const plans = getPlansForRole(role);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [showCredits, setShowCredits] = useState(false);

  const relevantPacks = CREDIT_PACKS.filter(p =>
    role === "school" ? p.creditType === "school_seats" : p.creditType !== "school_seats"
  );

  if (selected) {
    return (
      <EcoCashPayment
        plan={selected.plan}
        creditPack={selected.pack}
        username={username}
        onSuccess={() => setSelected(null)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setShowCredits(false)}
          style={{ padding: "8px 18px", borderRadius: 9, background: !showCredits ? S.accent : "rgba(255,255,255,0.04)", border: `1px solid ${!showCredits ? S.accent : S.border}`, color: !showCredits ? "#fff" : S.dim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Subscription Plans
        </button>
        <button onClick={() => setShowCredits(true)}
          style={{ padding: "8px 18px", borderRadius: 9, background: showCredits ? "#00E5A3" : "rgba(255,255,255,0.04)", border: `1px solid ${showCredits ? "#00E5A3" : S.border}`, color: showCredits ? "#000" : S.dim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Credit Packs (from $1)
        </button>
      </div>

      {!showCredits ? (
        <>
          <p style={{ fontSize: 13, color: S.dim, margin: "-16px 0 0" }}>EcoCash payments · Activated within hours of admin approval</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
            {plans.map(plan => {
              const isCurrent = plan.key === currentPlanKey;
              const isFree = plan.price === 0;
              return (
                <div key={plan.key} style={{
                  background: isCurrent ? "rgba(77,127,255,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isCurrent ? "rgba(77,127,255,0.3)" : plan.badge ? "rgba(0,229,163,0.2)" : S.border}`,
                  borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14, position: "relative",
                }}>
                  {plan.badge && (
                    <div style={{ position: "absolute", top: -11, right: 16, background: plan.role === "teacher" ? S.accent : "#00E5A3", color: plan.role === "teacher" ? "#fff" : "#000", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                      {plan.badge}
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{ position: "absolute", top: -11, left: 16, background: "rgba(77,127,255,0.8)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                      Current Plan
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 6px" }}>{plan.name}</h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: isFree ? "#4A5170" : S.accent, fontFamily: "'Space Grotesk',sans-serif" }}>
                        {isFree ? "FREE" : `$${plan.price.toFixed(2)}`}
                      </span>
                      {!isFree && <span style={{ fontSize: 11, color: S.dim }}>/month</span>}
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ fontSize: 12, color: S.muted, display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ color: "#00E5A3", flexShrink: 0 }}>✓</span> {f}
                      </li>
                    ))}
                    {plan.lockedFeatures.slice(0, 3).map(f => (
                      <li key={f} style={{ fontSize: 12, color: S.dim, display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ color: "#FF6B6B", flexShrink: 0 }}>✗</span> {f}
                      </li>
                    ))}
                  </ul>
                  {!isFree && !isCurrent && (
                    <button onClick={() => setSelected({ plan })}
                      style={{ padding: "10px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: "auto" }}>
                      Pay via EcoCash
                    </button>
                  )}
                  {isCurrent && (
                    <div style={{ padding: "9px", borderRadius: 10, background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.2)", textAlign: "center", fontSize: 12, color: S.accent, fontWeight: 600 }}>
                      Active Plan
                    </div>
                  )}
                  {isFree && !isCurrent && (
                    <div style={{ padding: "9px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}`, textAlign: "center", fontSize: 12, color: S.dim }}>
                      Downgrade — contact admin
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, color: S.dim, margin: "-16px 0 0" }}>One-time purchases — add specific credits without a subscription</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
            {relevantPacks.map(pack => (
              <div key={pack.key} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 32 }}>{pack.emoji}</div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>{pack.name}</h4>
                  <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>{pack.description}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#00E5A3", fontFamily: "'Space Grotesk',sans-serif" }}>${pack.price.toFixed(2)}</span>
                  <button onClick={() => setSelected({ pack })}
                    style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Buy via EcoCash
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
