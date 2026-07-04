"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createReconnectingSubscription } from "@/lib/supabase/reconnect";

interface Teacher { id: string; full_name: string }
interface Sale {
  id: string; teacher_id: string; amount_paid: number; platform_fee_amount: number;
  teacher_earning_amount: number; created_at: string; courses: { title: string } | null;
}

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

export function SchoolFinancialsClient({ schoolId, teachers, sales }: { schoolId: string; teachers: Teacher[]; sales: Sale[] }) {
  const supabase = createClient();
  const [localSales, setLocalSales] = useState(sales);
  const [live, setLive] = useState(false);
  const teacherIds = useMemo(() => new Set(teachers.map(t => t.id)), [teachers]);
  const teacherName = (id: string) => teachers.find(t => t.id === id)?.full_name ?? "Unknown teacher";

  useEffect(() => {
    const stop = createReconnectingSubscription((onStatus) => {
      const channel = supabase
        .channel(`school-financials:${schoolId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "course_purchases",
        }, (payload: any) => {
          const row = payload.new;
          // RLS already scopes which rows this admin's realtime subscription
          // receives to their own school's teachers, but double-check client
          // side too since teacherIds is what drives the per-teacher table.
          if (row.status !== "completed" || !teacherIds.has(row.teacher_id)) return;
          setLocalSales((prev) => [{
            id: row.id, teacher_id: row.teacher_id, amount_paid: row.amount_paid,
            platform_fee_amount: row.platform_fee_amount, teacher_earning_amount: row.teacher_earning_amount,
            created_at: row.created_at, courses: null,
          }, ...prev]);
        })
        .subscribe(onStatus);
      return { remove: () => supabase.removeChannel(channel) };
    }, (status) => setLive(status === "connected"));
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const totalGross = localSales.reduce((s, r) => s + r.amount_paid, 0);
  const totalCommission = localSales.reduce((s, r) => s + (r.platform_fee_amount ?? 0), 0);
  const totalNet = localSales.reduce((s, r) => s + r.teacher_earning_amount, 0);

  const byTeacher = new Map<string, { gross: number; commission: number; net: number; count: number }>();
  localSales.forEach(r => {
    const cur = byTeacher.get(r.teacher_id) ?? { gross: 0, commission: 0, net: 0, count: 0 };
    cur.gross += r.amount_paid; cur.commission += r.platform_fee_amount ?? 0; cur.net += r.teacher_earning_amount; cur.count += 1;
    byTeacher.set(r.teacher_id, cur);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 11, color: live ? "#00E5A3" : "#4A5170", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: live ? "#00E5A3" : "#4A5170" }} />
          {live ? "Live" : "Connecting…"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Total sales (gross)", value: totalGross, color: S.text },
          { label: "Platform commission (20%)", value: totalCommission, color: "#FF9B6B" },
          { label: "Net paid to teachers", value: totalNet, color: "#00E5A3" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, color: S.dim, margin: "0 0 6px" }}>{stat.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>${stat.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: S.muted, marginBottom: 8 }}>By teacher</p>
        {teachers.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
            <p style={{ color: S.dim, fontSize: 14 }}>No teachers linked to your school yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {teachers.map(t => {
              const row = byTeacher.get(t.id);
              return (
                <div key={t.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <p style={{ flex: 1, minWidth: 140, fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{t.full_name}</p>
                  {!row ? (
                    <span style={{ fontSize: 12, color: S.dim }}>No sales yet</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 11, color: S.dim }}>{row.count} sale{row.count !== 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 12, color: S.muted }}>${row.gross.toFixed(2)} gross</span>
                      <span style={{ fontSize: 12, color: "#FF9B6B" }}>−${row.commission.toFixed(2)} fee</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#00E5A3" }}>${row.net.toFixed(2)} net</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: S.muted, marginBottom: 8 }}>Recent sales</p>
        {localSales.length === 0 ? (
          <p style={{ fontSize: 12, color: S.dim }}>No sales recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {localSales.slice(0, 30).map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 10, gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 13, color: S.text, margin: 0 }}>{s.courses?.title ?? "Course"} · {teacherName(s.teacher_id)}</p>
                  <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{new Date(s.created_at).toLocaleDateString()} · sold for ${s.amount_paid.toFixed(2)}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#00E5A3", margin: 0 }}>${s.teacher_earning_amount.toFixed(2)} to teacher</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
