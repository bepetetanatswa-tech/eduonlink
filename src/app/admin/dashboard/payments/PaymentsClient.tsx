"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Payment {
  id: string;
  amount: number;
  status: string;
  phone_number: string | null;
  transaction_id: string | null;
  created_at: string;
}

export function PaymentsClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  const updateStatus = async (id: string, status: "verified" | "rejected") => {
    setUpdating(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("payment_verifications") as any)
      .update({ status })
      .eq("id", id);
    if (!error) {
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    }
    setUpdating(null);
  };

  const pending = payments.filter((p) => p.status === "pending").length;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Payments</h2>
          <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>{pending} pending verification</p>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Transaction", "Amount", "Phone", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#4A5170", fontSize: "13px" }}>No payments yet</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 20px", fontSize: "12px", color: "#6B7290", fontFamily: "monospace" }}>{p.transaction_id ?? "—"}</td>
                  <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 700, color: "#CDD6F4" }}>${p.amount.toFixed(2)}</td>
                  <td style={{ padding: "12px 20px", fontSize: "12px", color: "#6B7290" }}>{p.phone_number ?? "—"}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px",
                      color: p.status === "verified" ? "#00E5A3" : p.status === "rejected" ? "#FF6B6B" : "#F5A623",
                      background: p.status === "verified" ? "rgba(0,229,163,0.1)" : p.status === "rejected" ? "rgba(255,107,107,0.1)" : "rgba(245,166,35,0.1)",
                      border: `1px solid ${p.status === "verified" ? "rgba(0,229,163,0.2)" : p.status === "rejected" ? "rgba(255,107,107,0.2)" : "rgba(245,166,35,0.2)"}`,
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: "11px", color: "#4A5170" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 20px" }}>
                    {p.status === "pending" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => updateStatus(p.id, "verified")}
                          disabled={updating === p.id}
                          style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.2)", color: "#00E5A3", cursor: "pointer", opacity: updating === p.id ? 0.5 : 1 }}
                        >
                          {updating === p.id ? "…" : "Verify"}
                        </button>
                        <button
                          onClick={() => updateStatus(p.id, "rejected")}
                          disabled={updating === p.id}
                          style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)", color: "#FF6B6B", cursor: "pointer", opacity: updating === p.id ? 0.5 : 1 }}
                        >
                          {updating === p.id ? "…" : "Reject"}
                        </button>
                      </div>
                    )}
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
