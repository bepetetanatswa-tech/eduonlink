"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlanDefinition, CreditPack } from "@/lib/subscription/plans";
import { useEcoCashCheckout } from "@/lib/subscription/useEcoCashCheckout";
import { EcoCashQrLink } from "@/components/subscription/EcoCashQrLink";

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

interface Props {
 plan?: PlanDefinition;
 creditPack?: CreditPack;
 username: string;
 onSuccess: () => void;
 onBack: () => void;
}

export function EcoCashPayment({ plan, creditPack, username, onSuccess, onBack }: Props) {
 const supabase = createClient();
 const basePrice = plan?.price ?? creditPack?.price ?? 0;
 const itemName = plan?.name ?? creditPack?.name ?? "";
 const { ecocashNumber, ecocashName, amount: price, ussdLink, loading: checkoutLoading } = useEcoCashCheckout(basePrice);
 const [form, setForm] = useState({ transactionId: "", phone: "", amount: "" });
 const [file, setFile] = useState<File | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState("");
 const [done, setDone] = useState(false);

 useEffect(() => { setForm((f) => ({ ...f, amount: price.toString() })); }, [price]);

 const ref = `EDU-${username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`;

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
 purchaseType: plan ? "subscription" : "credits",
 planKey: plan?.key,
 creditPackKey: creditPack?.key,
 creditType: creditPack?.creditType,
 creditAmount: creditPack?.amount,
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

 if (done) return (
 <div style={{ background: "rgba(31,71,56,0.05)", border: "1px solid rgba(31,71,56,0.2)", borderRadius: 16, padding: 32, textAlign: "center" }}>
 <div style={{ fontSize: 52, marginBottom: 14 }}></div>
 <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1F4738", fontFamily: "inherit", margin: "0 0 10px" }}>Payment Submitted!</h3>
 <p style={{ fontSize: 14, color: S.muted, margin: "0 0 4px" }}>Your {itemName} payment of <strong style={{ color: S.accent }}>${price.toFixed(2)}</strong> is being reviewed.</p>
 <p style={{ fontSize: 13, color: S.dim }}>You will receive a notification once approved — usually within a few hours.</p>
 <button onClick={onSuccess} style={{ marginTop: 22, padding: "10px 28px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
 Back to Subscription
 </button>
 </div>
 );

 return (
 <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
 <button onClick={onBack} style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 9, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>
 ← Back
 </button>

 {/* Instructions */}
 <div style={{ background: "rgba(31,71,56,0.04)", border: "1px solid rgba(31,71,56,0.15)", borderRadius: 16, padding: 20 }}>
 <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1F4738", fontFamily: "inherit", margin: "0 0 14px" }}>EcoCash Payment Instructions</h3>
 {[
 { n: "1", t: `Send $${price.toFixed(2)} to EcoCash number ${ecocashNumber} (${ecocashName})` },
 { n: "2", t: `Use reference: ${ref}` },
 { n: "3", t: "Fill in the verification form below with your transaction details" },
 { n: "4", t: "Admin will approve within a few hours and your access activates instantly" },
 ].map(({ n, t }) => (
 <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
 <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(31,71,56,0.15)", border: "1px solid rgba(31,71,56,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: "#1F4738" }}>{n}</span>
 </div>
 <p style={{ fontSize: 13, color: S.muted, margin: 0, lineHeight: 1.5 }}>{t}</p>
 </div>
 ))}
 <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 9, display: "flex", gap: 20, flexWrap: "wrap" }}>
 <span style={{ fontSize: 12 }}><span style={{ color: S.dim }}>Number: </span><strong style={{ color: "#1F4738", fontFamily: "monospace" }}>{ecocashNumber}</strong></span>
 <span style={{ fontSize: 12 }}><span style={{ color: S.dim }}>Reference: </span><strong style={{ color: "#A9873F", fontFamily: "monospace" }}>{ref}</strong></span>
 </div>
 </div>

 {!checkoutLoading && <EcoCashQrLink ussdLink={ussdLink} amount={price} />}

 {/* Item summary */}
 <div style={{ background: "rgba(177,80,43,0.05)", border: "1px solid rgba(177,80,43,0.15)", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <div>
 <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{itemName}</p>
 <p style={{ fontSize: 11, color: S.dim, margin: "3px 0 0" }}>{plan ? "Monthly subscription" : creditPack?.description}</p>
 </div>
 <p style={{ fontSize: 24, fontWeight: 800, color: S.accent, fontFamily: "inherit", margin: 0 }}>${price.toFixed(2)}</p>
 </div>

 {/* Form fields */}
 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>EcoCash Transaction ID *</label>
 <input value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} placeholder="e.g. MP250101.1234.A12345" style={inp} />
 <p style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>Found in your EcoCash SMS confirmation</p>
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>Phone Number Payment Was Sent From *</label>
 <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 0771234567" style={inp} />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>Amount Paid (USD) *</label>
 <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" min={0} style={inp} />
 <p style={{ fontSize: 11, color: "#A3311E", marginTop: 4 }}>Must be exactly ${price.toFixed(2)} — no more, no less</p>
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>Screenshot Proof (optional but speeds up approval)</label>
 <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ ...inp, padding: "8px 12px", cursor: "pointer" }} />
 {file && <p style={{ fontSize: 11, color: "#1F4738", marginTop: 4 }}>✓ {file.name} attached</p>}
 </div>
 {error && (
 <div style={{ background: "rgba(163,49,30,0.08)", border: "1px solid rgba(163,49,30,0.2)", borderRadius: 9, padding: "10px 14px" }}>
 <p style={{ fontSize: 13, color: "#A3311E", margin: 0 }}>{error}</p>
 </div>
 )}
 <button onClick={handleSubmit} disabled={submitting || checkoutLoading}
 style={{ padding: "13px", borderRadius: 10, background: (submitting || checkoutLoading) ? "rgba(177,80,43,0.4)" : S.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (submitting || checkoutLoading) ? "not-allowed" : "pointer", letterSpacing: 0.3 }}>
 {submitting ? "Submitting…" : checkoutLoading ? "Preparing payment details…" : "Submit Payment Verification"}
 </button>
 </div>
 </div>
 );
}
