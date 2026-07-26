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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 rounded-full pl-4 pr-1.5 py-1.5 bg-edu-gold-100 border border-edu-gold-300 shadow-elevated">
      <span className="text-xs font-semibold text-edu-gold-dark">
        Viewing as {name} <span className="opacity-70 capitalize">({role.replace("_", " ")})</span>
      </span>
      <button
        onClick={returnToAdmin}
        disabled={returning}
        className="btn-gold rounded-full py-1.5 px-3.5 text-xs disabled:opacity-60"
      >
        {returning ? "Returning…" : "Return to admin"}
      </button>
    </div>
  );
}
