"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [
  {
    id: "primary",
    code: "01",
    name: "Primary",
    range: "ECD – Grade 7",
    accent: "#4D7FFF",
    description: "Heritage-Based Curriculum foundations. Literacy, numeracy, cultural knowledge and environmental awareness — building the base everything else rests on.",
    subjects: ["Mathematics","English Language","Shona / Ndebele","Environmental Science","Social Studies","Creative Arts","Physical Education","Heritage Studies"],
    badge: "8 Subjects",
  },
  {
    id: "o-level",
    code: "02",
    name: "O-Level",
    range: "Form 1 – 4",
    accent: "#F5A623",
    description: "Full ZIMSEC O-Level coverage. Every syllabus, every topic, with AI tutoring, past papers, and HBC project support built in.",
    subjects: ["Mathematics","English Language","Combined Science","Physics","Chemistry","Biology","Geography","History","Commerce","Accounts","Shona / Ndebele","French"],
    badge: "12 Subjects",
  },
  {
    id: "a-level",
    code: "03",
    name: "A-Level",
    range: "Form 5 – 6",
    accent: "#00E5A3",
    description: "University-entry depth. Zimbabwe's best A-Level teachers, comprehensive ZIMSEC alignment, and AI-powered exam preparation that knows how examiners think.",
    subjects: ["Pure Mathematics","Statistics","Physics","Chemistry","Biology","Economics","Business Studies","Geography","History","English Literature","Computer Science","Divinity"],
    badge: "University Prep",
  },
];

export default function CurriculumSection() {
  const [active, setActive] = useState("o-level");
  const lvl = LEVELS.find((l) => l.id === active)!;

  return (
    <section className="section" id="curriculum">
      <div className="container-voa">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div>
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#F5A623" }}>
              ZIMSEC Curriculum
            </p>
            <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.1 }}>
              Every level.<br />
              <span className="text-gradient-amber">Exactly ZIMSEC.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "#6B7290" }}>
            Not adapted from a foreign platform. Every syllabus point, every HBC requirement,
            every past-paper question type — built from the Zimbabwe curriculum outward.
          </p>
        </motion.div>

        {/* Level selector */}
        <div
          className="inline-flex rounded-xl p-1 mb-10"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setActive(l.id)}
              className="relative px-5 py-2.5 rounded-lg text-sm font-semibold font-display transition-all duration-200"
              style={{ color: active === l.id ? "#fff" : "#4A5170" }}
            >
              {active === l.id && (
                <motion.div
                  layoutId="pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `${l.accent}18`, border: `1px solid ${l.accent}30` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{l.name}</span>
              <span className="relative z-10 ml-2 text-[11px] font-mono opacity-50">{l.range}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid lg:grid-cols-5 gap-4"
          >
            {/* Left: info */}
            <div
              className="lg:col-span-2 rounded-2xl p-8 flex flex-col justify-between"
              style={{ background: "#0F1018", border: `1px solid ${lvl.accent}20` }}
            >
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold mb-6"
                  style={{ background: `${lvl.accent}12`, color: lvl.accent, border: `1px solid ${lvl.accent}25` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: lvl.accent }} />
                  {lvl.badge}
                </div>

                <div
                  className="font-display font-bold mb-1 opacity-10"
                  style={{ fontSize: "5rem", lineHeight: 1, color: lvl.accent }}
                >
                  {lvl.code}
                </div>

                <h3 className="font-display font-bold text-white text-3xl mb-1">{lvl.name}</h3>
                <p className="text-sm font-mono mb-6" style={{ color: lvl.accent }}>{lvl.range}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>{lvl.description}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 px-6 py-3 rounded-xl text-sm font-semibold font-display transition-all"
                style={{
                  background: `${lvl.accent}15`,
                  color: lvl.accent,
                  border: `1px solid ${lvl.accent}30`,
                }}
              >
                Explore {lvl.name} Courses →
              </motion.button>
            </div>

            {/* Right: subjects */}
            <div
              className="lg:col-span-3 rounded-2xl p-8"
              style={{ background: "#0F1018", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] mb-6" style={{ color: "#4A5170" }}>
                Subjects Available
              </p>
              <div className="grid grid-cols-2 gap-2">
                {lvl.subjects.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg group transition-colors"
                    style={{ border: "1px solid transparent" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${lvl.accent}08`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${lvl.accent}15`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: lvl.accent }} />
                    <span className="text-sm" style={{ color: "#8892B0" }}>{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
