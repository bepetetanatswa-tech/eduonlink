/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stage {
  id?: string;
  stage_number: number;
  title: string;
  content: string;
  ai_feedback: string | null;
  teacher_comment: string | null;
  is_approved: boolean;
  submitted_at: string | null;
  completed_at: string | null;
}

interface Project {
  id: string;
  title: string;
  subject: string;
  stage: number;
  status: string;
  description: string | null;
}

interface Props {
  project: Project;
  stages: Stage[];
  profileId: string;
}

const STAGE_DEFS = [
  { num: 1, name: "Topic Selection & Rationale", icon: "🎯", desc: "Define your heritage topic and explain why it matters to Zimbabwe's culture and identity." },
  { num: 2, name: "Research & Data Collection", icon: "🔍", desc: "Gather information from primary and secondary sources. Interview community members, visit sites, use library resources." },
  { num: 3, name: "Analysis & Interpretation", icon: "📊", desc: "Analyse what your research means. Identify patterns, draw conclusions, connect findings to Zimbabwe's heritage." },
  { num: 4, name: "Presentation Planning", icon: "📋", desc: "Plan how you will present your project — structure, format, visuals, and target audience." },
  { num: 5, name: "Product Creation", icon: "🏗️", desc: "Create your actual product or presentation based on your plan and research." },
  { num: 6, name: "Evaluation & Reflection", icon: "🪞", desc: "Honestly assess your project: what worked, what you learned, and how you would improve it." },
];

function friendlyAiError(data: { error?: string; limit?: number }, fallback: string) {
  if (data.error === "limit_reached") return `You've reached your ${data.limit ?? "daily"} AI questions for today. Come back tomorrow, or ask your teacher about upgrading.`;
  return data.error ?? fallback;
}

function renderAIText(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} style={{ color: "#CDD6F4" }}>{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

export function HBCWorkflow({ project, stages: initialStages, profileId }: Props) {
  const [stages, setStages] = useState<Stage[]>(() => {
    // Ensure all 6 stages exist in state
    return STAGE_DEFS.map((def) => {
      const existing = initialStages.find((s) => s.stage_number === def.num);
      return existing ?? {
        stage_number: def.num,
        title: def.name,
        content: "",
        ai_feedback: null,
        teacher_comment: null,
        is_approved: false,
        submitted_at: null,
        completed_at: null,
      };
    });
  });
  const [activeStage, setActiveStage] = useState(0); // index
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<"blueprint" | "feedback" | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const supabase = createClient();

  const currentStageDef = STAGE_DEFS[activeStage];
  const currentStage = stages[activeStage];
  const completedCount = stages.filter((s) => s.submitted_at || s.completed_at).length;

  const notify = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const updateContent = (content: string) => {
    setStages((prev) => prev.map((s, i) => i === activeStage ? { ...s, content } : s));
  };

  const saveStage = async () => {
    setSaving(true);
    const stage = stages[activeStage];
    const def = STAGE_DEFS[activeStage];

    if (stage.id) {
      await (supabase.from("hbc_stages") as any)
        .update({ content: stage.content, title: def.name })
        .eq("id", stage.id);
    } else {
      const { data: newStage } = await (supabase.from("hbc_stages") as any)
        .insert({
          project_id: project.id,
          stage_number: def.num,
          title: def.name,
          content: stage.content,
        })
        .select("id")
        .single();
      if (newStage?.id) {
        setStages((prev) => prev.map((s, i) => i === activeStage ? { ...s, id: newStage.id } : s));
      }
    }

    notify("success", "Stage saved");
    setSaving(false);
  };

  const submitStage = async () => {
    if (!stages[activeStage].content?.trim()) {
      notify("error", "Write your content before submitting.");
      return;
    }
    setSaving(true);
    const stage = stages[activeStage];
    const now = new Date().toISOString();
    const def = STAGE_DEFS[activeStage];

    let stageId = stage.id;
    if (stageId) {
      await (supabase.from("hbc_stages") as any)
        .update({ content: stage.content, submitted_at: now, title: def.name })
        .eq("id", stageId);
    } else {
      const { data: newStage } = await (supabase.from("hbc_stages") as any)
        .insert({ project_id: project.id, stage_number: def.num, title: def.name, content: stage.content, submitted_at: now })
        .select("id").single();
      stageId = newStage?.id;
    }

    // Advance project stage if this is the current stage
    if (def.num >= project.stage) {
      await (supabase.from("hbc_projects") as any)
        .update({ stage: Math.min(def.num + 1, 6), status: def.num === 6 ? "submitted" : "in_progress", updated_at: now })
        .eq("id", project.id);
    }

    // Award "Independent Thinker" badge if the whole project was completed
    // with minimal AI blueprint/feedback requests (guided-learning spec).
    if (def.num === 6) {
      const aiRequestCount = stages.filter((s) => s.ai_feedback).length;
      if (aiRequestCount <= 1) {
        const { error: badgeErr } = await (supabase.from("student_badges") as any)
          .insert({ student_id: profileId, badge_key: "independent_thinker", context: { project_id: project.id } });
        if (!badgeErr) {
          await (supabase.from("notifications") as any).insert({
            user_id: profileId,
            title: "🏅 Independent Thinker badge earned!",
            body: `You completed "${project.title}" with minimal AI help — that's real independent thinking.`,
            type: "success",
          });
        }
      }
    }

    setStages((prev) => prev.map((s, i) => i === activeStage ? { ...s, id: stageId ?? s.id, submitted_at: now } : s));
    notify("success", def.num < 6 ? `Stage ${def.num} submitted! Move to Stage ${def.num + 1}.` : "All 6 stages submitted! Your teacher will review your project.");
    setSaving(false);
  };

  const getBlueprint = async () => {
    setAiLoading("blueprint");
    setStages((prev) => prev.map((s, i) => i === activeStage ? { ...s, ai_feedback: null } : s));
    try {
      const res = await fetch("/api/ai/hbc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "blueprint",
          stageNumber: currentStageDef.num,
          projectTitle: project.title,
          subject: project.subject,
          projectId: project.id,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setStages((prev) => prev.map((s, i) => i === activeStage ? { ...s, ai_feedback: `[BLUEPRINT]\n${data.result}` } : s));
      } else {
        notify("error", friendlyAiError(data, "Could not generate blueprint. Check AI configuration."));
      }
    } catch {
      notify("error", "Connection error. Try again.");
    }
    setAiLoading(null);
  };

  const getFeedback = async () => {
    if (!currentStage.content?.trim()) {
      notify("error", "Write your content first, then request feedback.");
      return;
    }
    setAiLoading("feedback");
    try {
      const res = await fetch("/api/ai/hbc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "feedback",
          stageNumber: currentStageDef.num,
          stageContent: currentStage.content,
          projectTitle: project.title,
          subject: project.subject,
          projectId: project.id,
        }),
      });
      const data = await res.json();
      if (data.result) {
        const stageToUpdate = stages[activeStage];
        if (stageToUpdate.id) {
          await (supabase.from("hbc_stages") as any).update({ ai_feedback: data.result }).eq("id", stageToUpdate.id);
        }
        setStages((prev) => prev.map((s, i) => i === activeStage ? { ...s, ai_feedback: data.result } : s));
      } else {
        notify("error", friendlyAiError(data, "Feedback unavailable. Check AI configuration."));
      }
    } catch {
      notify("error", "Connection error. Try again.");
    }
    setAiLoading(null);
  };

  const isBlueprint = currentStage.ai_feedback?.startsWith("[BLUEPRINT]");
  const aiFeedbackText = isBlueprint
    ? currentStage.ai_feedback?.replace("[BLUEPRINT]\n", "") ?? ""
    : currentStage.ai_feedback ?? "";

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* Stage Sidebar */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
          <p style={{ fontSize: 11, color: "#4A5170", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Progress</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 8px" }}>{completedCount}/6</p>
          <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(completedCount / 6) * 100}%`, background: "linear-gradient(90deg, #4D7FFF, #00E5A3)", borderRadius: 3, transition: "width 0.4s ease" }} />
          </div>
          <p style={{ fontSize: 10, color: "#4A5170", marginTop: 6 }}>stages submitted</p>
        </div>

        {STAGE_DEFS.map((def, idx) => {
          const s = stages[idx];
          const isActive = idx === activeStage;
          const isDone = !!(s.submitted_at || s.completed_at);
          const isApproved = s.is_approved;
          return (
            <button
              key={def.num}
              onClick={() => setActiveStage(idx)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%",
                background: isActive ? "rgba(77,127,255,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? "rgba(77,127,255,0.3)" : "rgba(255,255,255,0.05)"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                background: isApproved ? "rgba(0,229,163,0.12)" : isDone ? "rgba(77,127,255,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isApproved ? "rgba(0,229,163,0.3)" : isDone ? "rgba(77,127,255,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}>
                {isApproved ? "✓" : isDone ? "●" : def.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#4A5170", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage {def.num}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: isActive ? "#CDD6F4" : "#6B7290", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{def.name}</p>
                {isApproved && <p style={{ fontSize: 9, color: "#00E5A3", margin: 0 }}>Teacher Approved</p>}
                {isDone && !isApproved && <p style={{ fontSize: 9, color: "#4D7FFF", margin: 0 }}>Submitted</p>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Stage Header */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "11px", background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {currentStageDef.icon}
            </div>
            <div>
              <p style={{ fontSize: 10, color: "#4A5170", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Stage {currentStageDef.num} of 6</p>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>{currentStageDef.name}</h3>
            </div>
            {currentStage.is_approved && (
              <div style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 20, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", fontSize: 11, fontWeight: 600, color: "#00E5A3" }}>
                ✓ Teacher Approved
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#6B7290", lineHeight: 1.6, margin: 0 }}>{currentStageDef.desc}</p>
          {currentStage.teacher_comment && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(0,229,163,0.06)", border: "1px solid rgba(0,229,163,0.15)", borderRadius: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#00E5A3", marginBottom: 4 }}>💬 Teacher&apos;s Comment</p>
              <p style={{ fontSize: 13, color: "#CDD6F4", margin: 0, lineHeight: 1.6 }}>{currentStage.teacher_comment}</p>
            </div>
          )}
        </div>

        {/* AI Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={getBlueprint}
            disabled={!!aiLoading}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 12, cursor: aiLoading ? "not-allowed" : "pointer",
              background: aiLoading === "blueprint" ? "rgba(189,147,249,0.15)" : "rgba(189,147,249,0.1)",
              border: "1px solid rgba(189,147,249,0.3)", color: "#BD93F9",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {aiLoading === "blueprint" ? (
              <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Generating Blueprint…</>
            ) : (
              <><span>🗺️</span> Generate Stage Blueprint</>
            )}
          </button>
          <button
            onClick={getFeedback}
            disabled={!!aiLoading || !currentStage.content?.trim()}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 12,
              cursor: (aiLoading || !currentStage.content?.trim()) ? "not-allowed" : "pointer",
              background: aiLoading === "feedback" ? "rgba(77,127,255,0.15)" : "rgba(77,127,255,0.1)",
              border: "1px solid rgba(77,127,255,0.3)", color: "#4D7FFF",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: !currentStage.content?.trim() ? 0.5 : 1,
            }}
          >
            {aiLoading === "feedback" ? (
              <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Reviewing…</>
            ) : (
              <><span>🔍</span> Get Sir Taks Feedback</>
            )}
          </button>
        </div>

        {/* AI Output */}
        {currentStage.ai_feedback && (
          <div style={{
            background: isBlueprint ? "rgba(189,147,249,0.06)" : "rgba(77,127,255,0.06)",
            border: `1px solid ${isBlueprint ? "rgba(189,147,249,0.2)" : "rgba(77,127,255,0.2)"}`,
            borderRadius: 14, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{isBlueprint ? "🗺️" : "🎓"}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: isBlueprint ? "#BD93F9" : "#4D7FFF", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {isBlueprint ? "Sir Taks — Stage Blueprint (Your Planning Guide)" : "Sir Taks — Feedback on Your Work"}
              </p>
            </div>
            {isBlueprint && (
              <div style={{ marginBottom: 10, padding: "8px 12px", background: "rgba(189,147,249,0.08)", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span>💡</span>
                <p style={{ fontSize: 11, color: "#BD93F9", margin: 0, lineHeight: 1.5 }}>
                  This is your planning framework — fill in the [YOUR ANSWER HERE] sections yourself. The blueprint guides structure; the content must be your own original work.
                </p>
              </div>
            )}
            <div style={{ fontSize: 13, color: "#CDD6F4", lineHeight: 1.75 }}>
              {renderAIText(aiFeedbackText)}
            </div>
          </div>
        )}

        {/* Content Editor */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7290", margin: 0 }}>Your Work — Stage {currentStageDef.num}</p>
            {currentStage.submitted_at && (
              <span style={{ fontSize: 10, color: "#4D7FFF", padding: "2px 8px", background: "rgba(77,127,255,0.1)", borderRadius: 6, border: "1px solid rgba(77,127,255,0.2)" }}>
                Submitted {new Date(currentStage.submitted_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <textarea
            value={currentStage.content ?? ""}
            onChange={(e) => updateContent(e.target.value)}
            placeholder={`Write your Stage ${currentStageDef.num} content here...\n\nUse the Blueprint above as your planning guide. Write your own original research, ideas, and analysis.`}
            style={{
              width: "100%", minHeight: 220, padding: "14px 16px",
              background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "#CDD6F4", lineHeight: 1.7, fontFamily: "inherit",
              resize: "vertical", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Notification */}
        {notification && (
          <div style={{
            padding: "10px 16px", borderRadius: 10,
            background: notification.type === "success" ? "rgba(0,229,163,0.08)" : "rgba(255,107,107,0.08)",
            border: `1px solid ${notification.type === "success" ? "rgba(0,229,163,0.2)" : "rgba(255,107,107,0.2)"}`,
            color: notification.type === "success" ? "#00E5A3" : "#FF6B6B",
            fontSize: 13,
          }}>
            {notification.type === "success" ? "✓" : "⚠️"} {notification.msg}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={saveStage}
            disabled={saving}
            style={{
              padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#6B7290", transition: "all 0.15s",
            }}
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={submitStage}
            disabled={saving || !!currentStage.submitted_at}
            style={{
              padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: (saving || !!currentStage.submitted_at) ? "not-allowed" : "pointer",
              background: currentStage.submitted_at ? "rgba(0,229,163,0.08)" : "rgba(0,229,163,0.15)",
              border: "1px solid rgba(0,229,163,0.3)", color: "#00E5A3",
              transition: "all 0.15s", opacity: currentStage.submitted_at ? 0.6 : 1,
            }}
          >
            {currentStage.submitted_at ? "✓ Submitted" : currentStageDef.num < 6 ? `Submit Stage ${currentStageDef.num} →` : "Submit Final Project →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
