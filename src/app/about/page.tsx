"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const VALUES = [
  {
    icon: "✦",
    title: "AI for Every Student",
    body: "World-class AI tutoring should not be a privilege. Educonnect puts a personal AI teacher — Sir Taks — in the hands of every Zimbabwean student, whether they are in Harare or a rural Manicaland village.",
    accent: "#00E5A3",
  },
  {
    icon: "📚",
    title: "Rooted in Zimbabwe",
    body: "We are not a foreign platform retrofitted for Zimbabwe. Educonnect was built from the ground up around the ZIMSEC curriculum, HBC projects, and the realities of Zimbabwean classrooms.",
    accent: "#4D7FFF",
  },
  {
    icon: "🔬",
    title: "Honest Technology",
    body: "Sir Taks is powered by Google Gemini — one of the most capable AI systems in the world. We never use AI to replace teachers; we use it to amplify what great teachers already do.",
    accent: "#F5A623",
  },
  {
    icon: "🏫",
    title: "Built for Schools",
    body: "Educonnect is designed to be deployed institution-wide. From student learning to teacher lesson planning, parent progress reports, and school admin dashboards — one platform, every stakeholder.",
    accent: "#A78BFA",
  },
];

const TEAM = [
  {
    name: "Tanatswa Bepete",
    role: "Founder & CEO",
    bio: "Tanatswa built Educonnect to solve the education gap he witnessed firsthand. Sir Taks AI — the platform's tutor — is named after him. He believes every Zimbabwean child deserves a world-class education, regardless of postcode or income.",
    accent: "#4D7FFF",
    initial: "T",
  },
];

const TIMELINE = [
  { year: "2024", event: "Educonnect founded. Mission: bring AI-powered ZIMSEC tutoring to every Zimbabwean student." },
  { year: "Early 2025", event: "Sir Taks AI tutor developed using Google Gemini. Full ZIMSEC O-Level and A-Level curriculum mapped." },
  { year: "Mid 2025", event: "HBC Project Blueprint generator launched. School admin and teacher portals built." },
  { year: "2025 →", event: "Public launch. Opening access to students, teachers, parents, and schools across Zimbabwe." },
];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#07080C" }}>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(77,127,255,0.12) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-6" style={{ color: "#4D7FFF" }}>
              Our Story
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-white mb-6"
            style={{ fontSize: "clamp(36px, 7vw, 72px)", lineHeight: 1.05 }}
          >
            We built the school<br />
            <span style={{ background: "linear-gradient(135deg, #4D7FFF, #00E5A3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Zimbabwe deserves.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: "#6B7290" }}
          >
            Educonnect is an AI-powered education platform built specifically
            for Zimbabwe. Not adapted. Not translated. Built for ZIMSEC, the HBC curriculum, and
            the students who will define Zimbabwe&apos;s next chapter.
          </motion.p>
        </div>
      </section>

      {/* ── Mission statement ───────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div
              className="rounded-3xl p-10 lg:p-16 relative overflow-hidden"
              style={{
                background: "#0D0F1A",
                border: "1px solid rgba(77,127,255,0.18)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(0,229,163,0.08) 0%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-6" style={{ color: "#00E5A3" }}>
                Our Mission
              </p>
              <blockquote
                className="font-display font-bold text-white leading-tight mb-6"
                style={{ fontSize: "clamp(22px, 4vw, 38px)" }}
              >
                &ldquo;Every Zimbabwean student — regardless of where they live,
                what school they attend, or what their family earns — deserves
                a world-class education. Educonnect is how we make that happen.&rdquo;
              </blockquote>
              <p className="text-sm font-semibold" style={{ color: "#4D7FFF" }}>
                — Tanatswa Bepete, Founder
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── The problem we're solving ───────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-5" style={{ color: "#4A5170" }}>
                The Problem
              </p>
              <h2 className="font-display font-bold text-white mb-6" style={{ fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.1 }}>
                Zimbabwe&apos;s students are brilliant.<br />
                The system hasn&apos;t kept up.
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B7290" }}>
                Zimbabwe has some of the highest literacy rates in Africa. Its students are motivated,
                its teachers are dedicated, and its curriculum — ZIMSEC — is rigorous and respected.
                But access to quality resources is deeply unequal. A student in Borrowdale has tutors,
                past papers, and revision guides. A student in Binga has a textbook and a teacher
                managing 60 students.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>
                AI cannot solve every problem in education. But it can ensure that every student,
                no matter where they are, has a patient, knowledgeable tutor available at 3am the
                night before an exam. That is what Educonnect does.
              </p>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="flex flex-col gap-4">
                {[
                  { stat: "28+",  desc: "ZIMSEC subjects — O-Level, A-Level and Primary", accent: "#4D7FFF" },
                  { stat: "24/7", desc: "AI tutor access on any device, urban or rural", accent: "#00E5A3" },
                  { stat: "All 10", desc: "Zimbabwe provinces served — urban and rural", accent: "#F5A623" },
                  { stat: "Free", desc: "For every student. No credit card. No commitment.", accent: "#A78BFA" },
                ].map((s) => (
                  <div
                    key={s.stat}
                    className="flex items-center gap-5 p-5 rounded-2xl"
                    style={{ background: "#0F1018", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="font-display font-bold text-2xl flex-shrink-0 w-20" style={{ color: s.accent }}>
                      {s.stat}
                    </span>
                    <p className="text-sm" style={{ color: "#8892B0" }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-12">
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#4A5170" }}>
              What We Believe
            </p>
            <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
              Our principles
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-4">
            {VALUES.map((v, i) => (
              <FadeIn key={v.title} delay={i * 0.08}>
                <div
                  className="p-7 rounded-2xl h-full"
                  style={{ background: "#0F1018", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-5"
                    style={{ background: `${v.accent}12`, border: `1px solid ${v.accent}20` }}
                  >
                    {v.icon}
                  </div>
                  <h3 className="font-display font-semibold text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>{v.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-12">
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#4A5170" }}>
              Our Journey
            </p>
            <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
              How we got here
            </h2>
          </FadeIn>

          <div className="relative">
            <div
              className="absolute left-[19px] top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(77,127,255,0.3), rgba(0,229,163,0.1))" }}
            />
            <div className="flex flex-col gap-8 pl-12">
              {TIMELINE.map((t, i) => (
                <FadeIn key={t.year} delay={i * 0.1}>
                  <div className="relative">
                    <div
                      className="absolute -left-[49px] top-1 w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{
                        background: "#07080C",
                        borderColor: i === TIMELINE.length - 1 ? "#00E5A3" : "#4D7FFF",
                        boxShadow: `0 0 12px ${i === TIMELINE.length - 1 ? "rgba(0,229,163,0.4)" : "rgba(77,127,255,0.3)"}`,
                      }}
                    />
                    <p className="font-mono text-xs font-semibold mb-1" style={{ color: "#4D7FFF" }}>{t.year}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#8892B0" }}>{t.event}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-12">
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#4A5170" }}>
              The Team
            </p>
            <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
              Who we are
            </h2>
          </FadeIn>

          <div className="flex flex-col gap-4">
            {TEAM.map((m) => (
              <FadeIn key={m.name}>
                <div
                  className="flex flex-col sm:flex-row gap-6 p-7 rounded-2xl"
                  style={{ background: "#0F1018", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl flex-shrink-0"
                    style={{
                      background: `${m.accent}15`,
                      border: `1px solid ${m.accent}25`,
                      color: m.accent,
                    }}
                  >
                    {m.initial}
                  </div>
                  <div>
                    <p className="font-display font-bold text-white text-lg">{m.name}</p>
                    <p className="text-xs font-mono mb-3" style={{ color: m.accent }}>{m.role}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>{m.bio}</p>
                  </div>
                </div>
              </FadeIn>
            ))}

            <FadeIn delay={0.1}>
              <div
                className="p-7 rounded-2xl text-center"
                style={{ background: "rgba(77,127,255,0.04)", border: "1px solid rgba(77,127,255,0.1)" }}
              >
                <p className="text-sm mb-3" style={{ color: "#6B7290" }}>
                  Educonnect is growing. We are looking for educators, engineers, and people who believe
                  in what we are building.
                </p>
                <a
                  href="mailto:vavhimiacademy@gmail.com"
                  className="text-sm font-semibold transition-colors"
                  style={{ color: "#4D7FFF" }}
                >
                  Get in touch about joining the team →
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(26px, 4vw, 44px)", lineHeight: 1.1 }}>
              Ready to be part of it?
            </h2>
            <p className="text-base mb-8" style={{ color: "#6B7290" }}>
              Join Educonnect as a student, teacher, parent, or school. It is free to start.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/register"
                className="btn-primary text-sm px-8 py-3.5"
              >
                Create your account →
              </Link>
              <Link
                href="/contact"
                className="btn-ghost text-sm px-8 py-3.5"
              >
                Contact us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
