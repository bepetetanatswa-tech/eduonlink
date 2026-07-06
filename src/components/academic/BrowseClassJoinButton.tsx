"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const S = { accent: "#4D7FFF", dim: "#4A5170" };

export function BrowseClassJoinButton({ joinCode }: { joinCode: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    if (joining) return;
    setJoining(true);
    setError(null);
    const { data, error: err }: { data: { class_id: string; class_name: string }[] | null; error: { message: string } | null } =
      await (supabase.rpc as any)("join_class_by_code", { p_code: joinCode });
    setJoining(false);
    if (err) {
      setError("Could not join. Please try again.");
      return;
    }
    router.refresh();
    if (data?.[0]?.class_id) router.push(`/student/dashboard/classes/${data[0].class_id}/chat`);
  }

  return (
    <div>
      <button onClick={join} disabled={joining}
        style={{ width: "100%", padding: "8px", borderRadius: 8, background: `${S.accent}15`, border: `1px solid ${S.accent}30`, color: S.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: joining ? 0.6 : 1 }}>
        {joining ? "Joining…" : "Join Class"}
      </button>
      {error && <p style={{ fontSize: 11, color: "#FF6B6B", marginTop: 6 }}>{error}</p>}
    </div>
  );
}
