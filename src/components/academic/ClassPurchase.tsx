"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEcoCashCheckout } from "@/lib/subscription/useEcoCashCheckout";
import { EcoCashQrLink } from "@/components/subscription/EcoCashQrLink";

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#A9873F" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

interface Props {
 classId: string;
 className: string;
 price: number;
 onClose: () => void;
}

export function ClassPurchase({ classId, className, price: basePrice, onClose }: Props) {
 const supabase = createClient();
 const { ecocashNumber, ecocashName, amount: price, ussdLink, loading: checkoutLoading } = useEcoCashCheckout(basePrice);
 const [form, setForm] = useState({ transactionId: "", phone: "", amount: "" });
 const [file, setFile] = useState<File | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState("");
 const [done, setDone] = useState(false);

 useEffect(() => { setForm((f) => ({ ...f, amount: price.toString() })); }, [price]);

 const handleSubmit = async () => {
 setError("");
 if (!form.transactionId.trim()) return setError("Transaction ID is required");
 if (!form.phone.trim()) return setError("Phone number is required");
 if (Number(form.amount) !== price) return setError(`Amount must be exactly $${price.toFixed(2)}`);

 setSubmitting(true);
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) { setError("Not signed in"); setSubmitting(false); return; }

 let screenshotUrl: string | null = null;
 if (file) {
 const ext = file.name.split(".").pop();
 const path = `${user.id}/${Date.now()}.${ext}`;
 const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, file);
 if (!uploadErr) {
 const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
 screenshotUrl = urlData?.publicUrl ?? null;
 }
 }

 const res = await fetch("/api/payments/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 transactionId: form.transactionId.trim(),
 phoneNumber: form.phone.trim(),
 amount: price,
 screenshotUrl,
 purchaseType: "class",
 classId,
 }),
 });
 if (!res.ok) {
 const data = await res.json().catch(() => null);
 setError(data?.error ?? "Submission failed. Please try again.");
 setSubmitting(false);
 return;
 }

 setSubmitting(false);
 setDone(true);
 };

 return (
 <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
 <div style={{ background: "#F2EEE3", border: `1px solid ${S.border}`, borderRadius: 18, padding: 26, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 14, maxHeight: "90vh", overflowY: "auto" }}>
 {done ? (
 <div style={{ textAlign: "center", padding: "12px 0" }}>
 <div style={{ fontSize: 44, marginBottom: 10 }}></div>
 <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1F4738", margin: "0 0 8px" }}>Payment submitted</h3>
 <p style={{ fontSize: 13, color: S.muted, margin: "0 0 16px" }}>Your ${price.toFixed(2)} payment for &quot;{className}&quot; is under review. You&apos;ll be enrolled as soon as it&apos;s approved.</p>
 <button onClick={onClose} style={{ padding: "9px 22px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
 </div>
 ) : (
 <>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, margin: 0 }}>Enroll in &quot;{className}&quot;</h3>
 <button onClick={onClose} style={{ background: "none", border: "none", color: S.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
 </div>
 <div style={{ background: "rgba(169,135,63,0.06)", border: "1px solid rgba(169,135,63,0.2)", borderRadius: 12, padding: 14 }}>
 <p style={{ fontSize: 12, color: S.muted, margin: "0 0 6px" }}>Send <strong style={{ color: S.accent }}>${price.toFixed(2)}</strong> to EcoCash <strong style={{ color: S.accent, fontFamily: "monospace" }}>{ecocashNumber}</strong> ({ecocashName}), then fill in the details below.</p>
 </div>
 {!checkoutLoading && <EcoCashQrLink ussdLink={ussdLink} amount={price} />}
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>EcoCash Transaction ID *</label>
 <input value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} placeholder="e.g. MP250101.1234.A12345" style={inp} />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Phone Number Payment Was Sent From *</label>
 <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 0771234567" style={inp} />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Amount Paid (USD) *</label>
 <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" min={0} style={inp} />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Screenshot (optional)</label>
 <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ ...inp, padding: "8px 12px", cursor: "pointer" }} />
 </div>
 {error && <p style={{ fontSize: 12, color: "#A3311E", margin: 0 }}>{error}</p>}
 <button onClick={handleSubmit} disabled={submitting || checkoutLoading}
 style={{ padding: "12px", borderRadius: 10, background: (submitting || checkoutLoading) ? "rgba(169,135,63,0.4)" : S.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (submitting || checkoutLoading) ? "not-allowed" : "pointer" }}>
 {submitting ? "Submitting…" : checkoutLoading ? "Preparing payment details…" : "Submit Payment"}
 </button>
 </>
 )}
 </div>
 </div>
 );
}
