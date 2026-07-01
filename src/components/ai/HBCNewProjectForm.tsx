/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const HBC_SUBJECTS = [
  "Art & Craft", "Agriculture", "Home Economics", "Fashion & Fabrics",
  "Building Technology", "Metal Technology", "Wood Technology",
  "Environmental Science", "Music", "Heritage Studies", "General HBC",
];

export function HBCNewProjectForm({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const create = async () => {
    if (!title.trim() || !subject) { setError("Title and subject are required."); return; }
    setLoading(true);
    setError(null);

    const { data, error: dbErr } = await (supabase.from("hbc_projects") as any)
      .insert({
        student_id: profileId,
        title: title.trim(),
        subject,
        description: description.trim() || null,
        stage: 1,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (dbErr || !data?.id) {
      setError("Failed to create project. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/student/dashboard/hbc/${data.id}`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
          background: "rgba(189,147,249,0.08)", border: "1px dashed rgba(189,147,249,0.3)",
          borderRadius: 14, cursor: "pointer", width: "100%", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(189,147,249,0.12)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(189,147,249,0.08)"; }}
      >
        <span style={{ fontSize: 22 }}>🏺</span>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#BD93F9", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Start New HBC Project</p>
          <p style={{ fontSize: 11, color: "#6B7290", margin: 0 }}>6-stage workflow with AI blueprint guidance</p>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 18, color: "#BD93F9" }}>+</span>
      </button>
    );
  }

  return (
    <div style={{ background: "rgba(189,147,249,0.06)", border: "1px solid rgba(189,147,249,0.2)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>New HBC Project</h3>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#6B7290", fontSize: 18, cursor: "pointer", padding: 4 }}>✕</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7290", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Project Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Traditional Pottery of the Shona People"
            style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13, color: "#CDD6F4", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(189,147,249,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7290", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>HBC Subject Area *</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", background: "rgba(10,12,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13, color: subject ? "#CDD6F4" : "#4A5170", outline: "none", boxSizing: "border-box" }}
          >
            <option value="">Select subject area...</option>
            {HBC_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7290", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Brief Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what your project is about..."
            rows={2}
            style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 13, color: "#CDD6F4", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(189,147,249,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>⚠️ {error}</p>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={() => setOpen(false)} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
        <button onClick={create} disabled={loading} style={{ padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: loading ? "rgba(189,147,249,0.15)" : "rgba(189,147,249,0.2)", border: "1px solid rgba(189,147,249,0.4)", color: "#BD93F9", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Creating…" : "Create Project →"}
        </button>
      </div>
    </div>
  );
}
