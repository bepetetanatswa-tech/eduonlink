"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AttRecord { date: string; status: string; reason: string | null; class: { name: string; subject: string } | null }

const STATUS_COLOR: Record<string, string> = {
  present: "#00E5A3", absent: "#FF6B6B", late: "#F5A623", excused: "#4D7FFF",
};
const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

export function ChildAttendanceView({ childId, childName }: { childId: string; childName: string }) {
  const supabase = createClient();
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from("attendance") as any)
      .select("date,status,reason,class:classes(name,subject)")
      .eq("student_id", childId)
      .order("date", { ascending: false })
      .limit(90)
      .then(({ data }: any) => {
        setRecords(data ?? []);
        setLoading(false);
      });
  }, [childId]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
  const rate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;
  const atRisk = rate !== null && rate < 80;
  const rateColor = rate === null ? S.dim : rate >= 80 ? "#00E5A3" : rate >= 60 ? "#F5A623" : "#FF6B6B";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{childName}</h3>

      {loading ? (
        <p style={{ fontSize: 13, color: S.dim }}>Loading attendance…</p>
      ) : records.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 13 }}>No attendance recorded yet.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px", flex: "0 0 auto" }}>
              <p style={{ fontSize: 11, color: S.dim, margin: "0 0 4px" }}>Attendance rate (last 90 records)</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: rateColor, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{rate}%</p>
            </div>
            {atRisk && (
              <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#FF6B6B", margin: 0 }}>⚠ At-risk: below 80% attendance</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {records.slice(0, 20).map((r, i) => (
              <div key={`${r.date}-${i}`} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 13, color: S.text, margin: 0 }}>{new Date(r.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</p>
                  {r.class && <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{r.class.subject} — {r.class.name}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", color: STATUS_COLOR[r.status] ?? S.muted }}>{r.status}</span>
                  {r.reason && <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0", textTransform: "capitalize" }}>{r.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
