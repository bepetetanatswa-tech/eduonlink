"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImpersonationBanner({ name, role }: { name: string; role: string }) {
  const router = useRouter();
  const [returning, setReturning] = useState(false);

  const returnToAdmin = async () => {
    setReturning(true);
    await fetch("/api/admin/impersonate/stop", { method: "POST" });
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div
      style={{
        position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 200,
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)",
        borderRadius: 999, padding: "6px 8px 6px 16px", backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: "#F5A623" }}>
        👁️ Viewing as {name} <span style={{ opacity: 0.7, textTransform: "capitalize" }}>({role.replace("_", " ")})</span>
      </span>
      <button
        onClick={returnToAdmin}
        disabled={returning}
        style={{
          padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: "#F5A623", border: "none", color: "#07080C",
          cursor: returning ? "not-allowed" : "pointer",
        }}
      >
        {returning ? "Returning…" : "← Return to Admin"}
      </button>
    </div>
  );
}
