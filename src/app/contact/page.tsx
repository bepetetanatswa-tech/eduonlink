"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FormInput, FormSelect } from "@/components/auth/FormInput";
import { IconMail, IconPhone, IconCheck } from "@/components/icons";

const PHONE_NUMBERS = ["0713 150 852", "0785 910 379", "0789 770 941"];
const EMAIL = "bepetetanatswa@gmail.com";

const SUBJECTS = [
  "General question",
  "Student / Parent support",
  "Teacher application",
  "School partnership",
  "Technical issue",
  "Something else",
];

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
    <div className="min-h-screen bg-edu-bottle margin-rule">
      <Navbar theme="dark" />

      <section className="pt-40 pb-12 md:pt-48">
        <div className="container-edu max-w-2xl text-center">
          <h1
            className="font-display font-semibold text-edu-paper mb-5"
            style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.08 }}
          >
            We&apos;d love to hear from you.
          </h1>
          <p className="text-base leading-relaxed max-w-xl mx-auto text-edu-slate-300">
            Questions about EduOnLink, a school partnership, a teacher application, or just want to say hello — reach out below.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-edu max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href={`mailto:${EMAIL}`} className="flex items-center gap-4 p-5 rounded border border-edu-slate-700 hover:border-edu-slate-500 transition-colors duration-150">
            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-edu-slate-800 text-edu-gold">
              <IconMail size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 text-edu-slate-400">Email</p>
              <p className="text-sm font-semibold text-edu-paper">{EMAIL}</p>
            </div>
          </a>

          <div className="flex items-center gap-4 p-5 rounded border border-edu-slate-700">
            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-edu-slate-800 text-edu-gold">
              <IconPhone size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1 text-edu-slate-400">Phone</p>
              <div className="flex flex-col gap-0.5">
                {PHONE_NUMBERS.map((num) => (
                  <a key={num} href={`tel:+263${num.replace(/\s/g, "").slice(1)}`} className="text-sm font-semibold text-edu-paper">
                    {num}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-28">
        <div className="container-edu max-w-lg">
          <div className="border border-edu-slate-700 rounded p-6 md:p-8 flex flex-col gap-4">
            {sent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-edu-gold-100 border border-edu-gold-300">
                  <IconCheck size={22} className="text-edu-gold" strokeWidth={2.2} />
                </div>
                <p className="font-display font-semibold text-edu-paper text-lg mb-2">Message sent</p>
                <p className="text-sm text-edu-slate-300">Thanks for reaching out — we&apos;ll get back to you as soon as we can.</p>
                <button onClick={() => setSent(false)} className="text-sm font-semibold mt-4 text-edu-gold">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="p-3 rounded text-sm" style={{ background: "rgba(227,143,118,0.12)", border: "1px solid rgba(227,143,118,0.35)", color: "#E38F76" }}>
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormInput theme="dark" label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rutendo Moyo" />
                  <FormInput theme="dark" label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <FormInput theme="dark" label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263 7XX XXX XXX" />
                <FormSelect theme="dark" label="What's this about?" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-edu-paper">Message</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind…"
                    className="field field-dark"
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Honeypot — hidden from real users, bots often fill every field */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                <button type="submit" disabled={sending} className="btn-primary text-sm px-6 py-3.5 w-full disabled:opacity-70">
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer theme="dark" />
    </div>
  );
}
