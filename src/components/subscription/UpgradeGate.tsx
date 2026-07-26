"use client";
import { useState } from "react";
import { IconLock } from "@/components/icons";

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

const FEATURES: Record<string, { name: string; requiredPlan: string }> = {
 live_classes: { name: "Live Classes", requiredPlan: "Student Pro ($5/mo)" },
 pdf_download: { name: "PDF Downloads", requiredPlan: "Student Pro ($5/mo)" },
 unlimited_ai: { name: "20 AI Questions/Day", requiredPlan: "Student Pro ($5/mo)" },
 assignments: { name: "Assignments", requiredPlan: "Student Pro ($5/mo)" },
 grades_view: { name: "Grade Book", requiredPlan: "Student Pro ($5/mo)" },
 exam_prep: { name: "Exam Preparation", requiredPlan: "Student Pro ($5/mo)" },
 mock_exams: { name: "Mock Exams", requiredPlan: "Student Pro or Credits Pack" },
 video_upload: { name: "Video Upload", requiredPlan: "Teacher Pro ($10/mo)" },
 ai_tools: { name: "AI Lesson Builder", requiredPlan: "Teacher Pro ($10/mo)" },
 grade_book: { name: "Grade Book", requiredPlan: "Teacher Pro ($10/mo)" },
 attendance: { name: "Attendance System", requiredPlan: "Teacher Pro ($10/mo)" },
 earnings: { name: "Earnings Dashboard", requiredPlan: "Teacher Pro ($10/mo)" },
 analytics: { name: "Advanced Analytics", requiredPlan: "School Standard ($60/mo)" },
 custom_branding: { name: "Custom Branding", requiredPlan: "School Enterprise ($200/mo)" },
};

interface Props {
 feature: string;
 hasAccess: boolean;
 children: React.ReactNode;
 subscriptionPath?: string;
 compact?: boolean;
}

export function UpgradeGate({ feature, hasAccess, children, subscriptionPath, compact = false }: Props) {
 const [showModal, setShowModal] = useState(false);
 const info = FEATURES[feature] ?? { name: feature, requiredPlan: "a paid plan" };
 const href = subscriptionPath ?? "#";

 if (hasAccess) return <>{children}</>;

 if (compact) {
 return (
 <a href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "rgba(177,80,43,0.08)", border: "1px solid rgba(177,80,43,0.2)", color: S.accent, fontSize: 12, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
 Unlock {info.name} — {info.requiredPlan}
 </a>
 );
 }

 return (
 <>
 <div style={{ position: "relative", userSelect: "none", cursor: "pointer" }} onClick={() => setShowModal(true)}>
 <div style={{ pointerEvents: "none", filter: "blur(4px) grayscale(0.6)", opacity: 0.4 }}>{children}</div>
 <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(7,8,12,0.75)", borderRadius: 12, gap: 10 }}>
 <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(177,80,43,0.12)", border: "1px solid rgba(177,80,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
 <span style={{ display: "flex", color: S.accent }}><IconLock size={20} /></span>
 </div>
 <p style={{ fontSize: 14, fontWeight: 700, color: S.text, margin: 0 }}>{info.name}</p>
 <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>Requires {info.requiredPlan}</p>
 <div style={{ padding: "7px 18px", borderRadius: 9, background: S.accent, color: "#fff", fontSize: 12, fontWeight: 700 }}>
 Upgrade
 </div>
 </div>
 </div>

 {showModal && (
 <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
 onClick={() => setShowModal(false)}>
 <div style={{ background: "#F2EEE3", border: "1px solid rgba(177,80,43,0.2)", borderRadius: 20, padding: 36, maxWidth: 420, width: "100%", textAlign: "center" }}
 onClick={e => e.stopPropagation()}>
 <div style={{ display: "flex", justifyContent: "center", marginBottom: 18, color: S.accent }}><IconLock size={40} /></div>
 <h3 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: "0 0 10px" }}>
 Unlock {info.name}
 </h3>
 <p style={{ fontSize: 14, color: S.muted, margin: "0 0 6px" }}>
 This feature requires <strong style={{ color: S.accent }}>{info.requiredPlan}</strong>.
 </p>
 <p style={{ fontSize: 13, color: S.dim, margin: "0 0 26px" }}>
 Pay via EcoCash and unlock within hours of admin approval.
 </p>
 <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
 <button onClick={() => setShowModal(false)}
 style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(28,38,32,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 13, cursor: "pointer" }}>
 Maybe later
 </button>
 <a href={href} style={{ padding: "10px 22px", borderRadius: 10, background: S.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
 View Plans
 </a>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
