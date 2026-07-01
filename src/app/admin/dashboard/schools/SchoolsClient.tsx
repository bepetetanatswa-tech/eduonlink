/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface School {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  subscription_plan: string;
  is_verified: boolean;
  email: string | null;
  phone: string | null;
  created_at: string;
}

const PLANS = ["free", "basic", "premium", "enterprise"];
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];

export function SchoolsClient({ initialSchools }: { initialSchools: School[] }) {
  const [schools, setSchools] = useState(initialSchools);
  const [editing, setEditing] = useState<School | null>(null);
  const [editForm, setEditForm] = useState<Partial<School>>({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", province: PROVINCES[0], city: "", email: "", phone: "", subscription_plan: "free" });
  const supabase = createClient();

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const verify = async (id: string, verified: boolean) => {
    const { data } = await (supabase.from("schools") as any).update({ is_verified: verified }).eq("id", id).select().single();
    if (data) setSchools((p) => p.map((s) => s.id === id ? { ...s, is_verified: verified } : s));
    notify(verified ? "School verified ✓" : "Verification removed");
  };

  const openEdit = (s: School) => { setEditing(s); setEditForm({ name: s.name, province: s.province ?? "", city: s.city ?? "", email: s.email ?? "", phone: s.phone ?? "", subscription_plan: s.subscription_plan }); };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { data } = await (supabase.from("schools") as any).update(editForm).eq("id", editing.id).select().single();
    if (data) setSchools((p) => p.map((s) => s.id === editing.id ? data : s));
    setSaving(false); setEditing(null);
    notify("School updated ✓");
  };

  const addSchool = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    const { data } = await (supabase.from("schools") as any)
      .insert({ ...addForm, name: addForm.name.trim(), is_verified: true }).select().single();
    if (data) { setSchools((p) => [data, ...p]); setAddOpen(false); setAddForm({ name: "", province: PROVINCES[0], city: "", email: "", phone: "", subscription_plan: "free" }); notify("School added ✓"); }
    setSaving(false);
  };

  const deleteSchool = async (id: string) => {
    if (!confirm("Delete this school? This cannot be undone.")) return;
    await (supabase.from("schools") as any).delete().eq("id", id);
    setSchools((p) => p.filter((s) => s.id !== id));
    notify("School deleted");
  };

  const filtered = schools.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.province ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Schools</h2>
          <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{schools.length} registered · {schools.filter((s) => s.is_verified).length} verified</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {notification && <span style={{ fontSize: 12, color: "#00E5A3" }}>{notification}</span>}
          <button onClick={() => setAddOpen(!addOpen)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(77,127,255,0.9)", border: "none", color: "#fff", cursor: "pointer" }}>+ Add School</button>
        </div>
      </div>

      {/* Add school form */}
      {addOpen && (
        <div style={{ background: "rgba(77,127,255,0.05)", border: "1px solid rgba(77,127,255,0.2)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>Register New School</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "School Name *", key: "name", placeholder: "e.g. Harare High School" },
              { label: "City", key: "city", placeholder: "e.g. Harare" },
              { label: "Email", key: "email", placeholder: "admin@school.ac.zw" },
              { label: "Phone", key: "phone", placeholder: "+263 77 123 4567" },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                <input value={(addForm as any)[f.key]} onChange={(e) => setAddForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Province</label>
              <select value={addForm.province} onChange={(e) => setAddForm((p) => ({ ...p, province: e.target.value }))} style={{ width: "100%", padding: "8px 12px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none" }}>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Plan</label>
              <select value={addForm.subscription_plan} onChange={(e) => setAddForm((p) => ({ ...p, subscription_plan: e.target.value }))} style={{ width: "100%", padding: "8px 12px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none" }}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setAddOpen(false)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
            <button onClick={addSchool} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(77,127,255,0.9)", border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Adding…" : "Add School"}</button>
          </div>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search schools…" style={{ padding: "9px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 13, color: "#CDD6F4", outline: "none" }} />

      {/* Edit modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 520, background: "#0D1021", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>Edit School</h3>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "#6B7290", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "School Name", key: "name" },
                { label: "City", key: "city" },
                { label: "Email", key: "email" },
                { label: "Phone", key: "phone" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                  <input value={(editForm as any)[f.key] ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Province</label>
                <select value={editForm.province ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, province: e.target.value }))} style={{ width: "100%", padding: "8px 12px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none" }}>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Plan</label>
                <select value={editForm.subscription_plan ?? "free"} onChange={(e) => setEditForm((p) => ({ ...p, subscription_plan: e.target.value }))} style={{ width: "100%", padding: "8px 12px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none" }}>
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(77,127,255,0.9)", border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["School", "Province", "Plan", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#4A5170", fontSize: 13 }}>No schools found</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#CDD6F4", margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 10, color: "#4A5170", margin: "2px 0 0" }}>{s.city ?? ""}{s.email ? ` · ${s.email}` : ""}</p>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#6B7290" }}>{s.province ?? "—"}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: "#4D7FFF", background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", textTransform: "capitalize" }}>{s.subscription_plan}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: s.is_verified ? "#00E5A3" : "#F5A623", background: s.is_verified ? "rgba(0,229,163,0.1)" : "rgba(245,166,35,0.08)", border: `1px solid ${s.is_verified ? "rgba(0,229,163,0.2)" : "rgba(245,166,35,0.2)"}` }}>
                      {s.is_verified ? "✓ Verified" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(s)} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", color: "#4D7FFF", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => verify(s.id, !s.is_verified)} style={{ padding: "4px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: s.is_verified ? "rgba(245,166,35,0.08)" : "rgba(0,229,163,0.1)", border: `1px solid ${s.is_verified ? "rgba(245,166,35,0.2)" : "rgba(0,229,163,0.25)"}`, color: s.is_verified ? "#F5A623" : "#00E5A3", cursor: "pointer" }}>
                        {s.is_verified ? "Unverify" : "Verify"}
                      </button>
                      <button onClick={() => deleteSchool(s.id)} style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", color: "#FF6B6B", cursor: "pointer" }}>Delete</button>
                    </div>
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
