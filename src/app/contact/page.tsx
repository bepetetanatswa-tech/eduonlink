"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FormInput, FormSelect } from "@/components/auth/FormInput";

const PHONE_NUMBERS = ["0713 150 852", "0785 910 379", "0789 770 941"];
const EMAIL = "vavhimiacademy@gmail.com";

const SUBJECTS = [
  "General question",
  "Student / Parent support",
  "Teacher application",
  "School partnership",
  "Technical issue",
  "Something else",
];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Could not send your message. Please try again."); return; }
      setSent(true);
      setName(""); setEmail(""); setPhone(""); setMessage(""); setSubject(SUBJECTS[0]);
    } catch {
      setError("Could not send your message. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#07080C" }}>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-28 md:pt-36 pb-12 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(77,127,255,0.12) 0%, transparent 60%)" }}
        />
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-6"
            style={{ color: "#4D7FFF" }}
          >
            Get in touch
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-white mb-6"
            style={{ fontSize: "clamp(32px, 6vw, 56px)", lineHeight: 1.08 }}
          >
            We&apos;d love to<br />
            <span style={{ background: "linear-gradient(135deg, #4D7FFF, #00E5A3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              hear from you.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base leading-relaxed max-w-xl mx-auto"
            style={{ color: "#8892B0" }}
          >
            Questions about VOA, a school partnership, a teacher application, or just want to say hello — reach out below.
          </motion.p>
        </div>
      </section>

      {/* ── Contact info cards ─────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FadeIn>
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-4 p-5 rounded-2xl h-full transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.25)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#4D7FFF" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#4A5170" }}>Email</p>
                <p className="text-sm font-semibold text-white">{EMAIL}</p>
              </div>
            </a>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div
              className="flex items-center gap-4 p-5 rounded-2xl h-full"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#00E5A3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#4A5170" }}>Phone</p>
                <div className="flex flex-col gap-0.5">
                  {PHONE_NUMBERS.map((num) => (
                    <a
                      key={num}
                      href={`tel:+263${num.replace(/\s/g, "").slice(1)}`}
                      className="text-sm font-semibold text-white transition-colors"
                    >
                      {num}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Form ────────────────────────────────────────────────── */}
      <section className="px-6 pb-28">
        <FadeIn className="max-w-lg mx-auto">
          <div
            className="rounded-2xl p-6 md:p-8 flex flex-col gap-4"
            style={{ background: "rgba(11,12,19,0.8)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
          >
            {sent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-display font-bold text-white text-lg mb-2">Message sent</p>
                <p className="text-sm" style={{ color: "#8892B0" }}>Thanks for reaching out — we&apos;ll get back to you as soon as we can.</p>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm font-semibold mt-4"
                  style={{ color: "#4D7FFF" }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B" }}>
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rutendo Moyo" />
                  <FormInput label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <FormInput label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263 7XX XXX XXX" />
                <FormSelect label="What's this about?" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: "#8892B0" }}>Message</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind…"
                    className="w-full rounded-xl text-sm text-white outline-none p-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "DM Sans, sans-serif", resize: "vertical" }}
                  />
                </div>

                {/* Honeypot — hidden from real users, bots often fill every field */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary text-sm px-6 py-3.5 w-full flex items-center justify-center gap-2"
                  style={{ opacity: sending ? 0.7 : 1 }}
                >
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
