"use client";

import { useState } from "react";
import { BrowseClassJoinButton } from "@/components/academic/BrowseClassJoinButton";
import { ClassPurchase } from "@/components/academic/ClassPurchase";

const S = { accent: "#F5A623" };

export function BrowseClassEnrollAction({ classId, className, price, joinCode }: { classId: string; className: string; price: number; joinCode: string }) {
  const [open, setOpen] = useState(false);

  if (price <= 0) return <BrowseClassJoinButton joinCode={joinCode} />;

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ width: "100%", padding: "8px", borderRadius: 8, background: `${S.accent}15`, border: `1px solid ${S.accent}30`, color: S.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        Enroll — ${price.toFixed(2)}
      </button>
      {open && <ClassPurchase classId={classId} className={className} price={price} onClose={() => setOpen(false)} />}
    </>
  );
}
