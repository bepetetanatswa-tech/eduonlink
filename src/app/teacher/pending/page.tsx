"use client";

import { useEffect, useState } from "react";
import { FormInput } from "@/components/auth/FormInput";
import { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { DocumentUpload } from "@/components/profile/DocumentUpload";
import type { Profile } from "@/types/database";

export default function TeacherPendingPage() {
 const [profile, setProfile] = useState<Profile | null>(null);
 const [loading, setLoading] = useState(true);
 const [editing, setEditing] = useState(false);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [done, setDone] = useState(false);

 const [ztcNumber, setZtcNumber] = useState("");
 const [qualificationDocKey, setQualificationDocKey] = useState<string | null>(null);
 const [idDocKey, setIdDocKey] = useState<string | null>(null);

 useEffect(() => {
 (async () => {
 const res = await fetch("/api/profile");
 if (res.ok) {
 const data = await res.json();
 const p: Profile = data.profile;
 setProfile(p);
 setZtcNumber(p.ztc_number ?? "");
 setQualificationDocKey(p.qualification_doc_key);
 setIdDocKey(p.id_doc_key);
 }
 setLoading(false);
 })();
 }, []);

 const resubmit = async () => {
 setError(null);
 if (!ztcNumber.trim()) { setError("Please enter your ZTC registration number."); return; }
 if (!qualificationDocKey) { setError("Please upload proof of your qualifications."); return; }
 if (!idDocKey) { setError("Please upload your national ID or passport."); return; }

 setSaving(true);
 try {
 const res = await fetch("/api/teacher/submit-verification", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ztcNumber: ztcNumber.trim(), qualificationDocKey, idDocKey }),
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) throw new Error(data.error ?? "Could not resubmit your application.");
 setDone(true);
 setEditing(false);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Something went wrong.");
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <p style={{ color: "#6E7A6C", fontSize: 14 }}>Loading…</p>
 </div>
 );
 }

 const rejected = !!profile?.teacher_rejection_reason;

 return (
 <div className="flex justify-center py-10 px-4">
 <div className="w-full max-w-lg">
 <div
 className="rounded-2xl p-6 flex flex-col gap-4"
 style={{ background: "rgba(11,12,19,0.8)", border: "1px solid rgba(28,38,32,0.07)" }}
 >
 <div className="text-center">
 <div className="text-4xl mb-3">{rejected ? "⚠" : ""}</div>
 <h1 className="font-display font-bold text-white text-xl mb-2">
 {rejected ? "Application needs changes" : "Your application is under review"}
 </h1>
 <p className="text-sm" style={{ color: "#566257" }}>
 {rejected
 ? "Our team couldn't verify your details. Update them below and resubmit."
 : "We're verifying your ZTC number and documents. This usually takes 1-2 business days — we'll email you the decision."}
 </p>
 </div>

 {rejected && profile?.teacher_rejection_reason && (
 <div
 className="p-4 rounded-xl text-sm"
 style={{ background: "rgba(163,49,30,0.06)", border: "1px solid rgba(163,49,30,0.2)", color: "#A3311E" }}
 >
 Reason: {profile.teacher_rejection_reason}
 </div>
 )}

 {done && (
 <div
 className="p-4 rounded-xl text-sm text-center"
 style={{ background: "rgba(31,71,56,0.06)", border: "1px solid rgba(31,71,56,0.2)", color: "#1F4738" }}
 >
 Resubmitted — we&apos;ll email you once it&apos;s reviewed.
 </div>
 )}

 {rejected && !editing && !done && (
 <button
 onClick={() => setEditing(true)}
 className="text-sm font-semibold self-center"
 style={{ color: "#B1502B" }}
 >
 Update details & resubmit →
 </button>
 )}

 {editing && !done && (
 <div className="flex flex-col gap-4">
 <AuthError message={error} />
 <FormInput
 label="Zimbabwe Teachers Council (ZTC) number"
 value={ztcNumber}
 onChange={(e) => setZtcNumber(e.target.value)}
 placeholder="e.g. ZTC-2019-04521"
 />
 <DocumentUpload
 category="qualification"
 ids={{ teacherId: profile?.user_id ?? "" }}
 label="Proof of qualifications"
 hint="PDF, JPG or PNG. Max 20MB."
 currentKey={qualificationDocKey}
 onUploaded={setQualificationDocKey}
 />
 <DocumentUpload
 category="teacher-id"
 ids={{ teacherId: profile?.user_id ?? "" }}
 label="National ID or passport"
 hint="PDF, JPG or PNG. Max 20MB."
 currentKey={idDocKey}
 onUploaded={setIdDocKey}
 />
 <AuthButton onClick={resubmit} loading={saving}>Resubmit for review</AuthButton>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
