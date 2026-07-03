"use client";

import { motion } from "framer-motion";

interface BentoItem {
  id: string;
  size: "large" | "medium" | "small";
  accent: string;
  tag?: string;
  tagColor?: string;
  icon: string;
  title: string;
  description: string;
  visual?: "ai-chat" | "chart" | "calendar" | "hexgrid" | "stats";
}

const items: BentoItem[] = [
  {
    id: "ai",
    size: "large",
    accent: "#00E5A3",
    tag: "Powered by Gemini",
    tagColor: "#00E5A3",
    icon: "✦",
    title: "Sir Taks AI Tutor",
    description: "The most intelligent ZIMSEC tutor ever built. Explains concepts, marks your work, generates SBP blueprints, and coaches you through every HBC stage — 24/7.",
    visual: "ai-chat",
  },
  {
    id: "live",
    size: "small",
    accent: "#4D7FFF",
    icon: "📡",
    title: "Live Classes",
    description: "HD live lessons with Zimbabwe's best teachers. Low-bandwidth optimised.",
  },
  {
    id: "exams",
    size: "small",
    accent: "#F5A623",
    icon: "📋",
    title: "Past Papers + AI Marking",
    description: "Every ZIMSEC past paper. AI scores and explains each answer.",
  },
  {
    id: "hbc",
    size: "medium",
    accent: "#4D7FFF",
    tag: "Unique to Educonnect",
    tagColor: "#4D7FFF",
    icon: "🔬",
    title: "HBC Project Suite",
    description: "Guided support for all 6 HBC stages. AI generates your SBP blueprint, tracks your progress, and alerts your teacher in real-time.",
    visual: "hexgrid",
  },
  {
    id: "curriculum",
    size: "small",
    accent: "#F5A623",
    tag: "ZIMSEC Official",
    tagColor: "#F5A623",
    icon: "📚",
    title: "Full ZIMSEC Curriculum",
    description: "ECD to A-Level. Every subject, every syllabus, exactly how ZIMSEC defines it.",
  },
  {
    id: "roles",
    size: "small",
    accent: "#00E5A3",
    icon: "👥",
    title: "Multi-Role Platform",
    description: "One platform for students, teachers, parents, and school admins.",
  },
];

function AiChatVisual() {
  const messages = [
    { role: "user", text: "Explain Newton's 3rd Law using a Zimbabwean example" },
    { role: "ai",   text: "Great question! When a person pushes a hoe into the ground..." },
  ];
  return (
    <div className="mt-4 space-y-2.5">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-mono"
            style={{
              background: m.role === "user" ? "rgba(77,127,255,0.15)" : "rgba(0,229,163,0.1)",
              color: m.role === "user" ? "#90ABFF" : "#00E5A3",
              border: `1px solid ${m.role === "user" ? "rgba(77,127,255,0.25)" : "rgba(0,229,163,0.2)"}`,
            }}
          >
            {m.role === "ai" && <span className="text-[10px] font-semibold block mb-1 opacity-60">Sir Taks</span>}
            {m.text}
            {m.role === "ai" && <span className="caret" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function HexGridVisual() {
  const stages = ["ID", "INV", "DES", "IMP", "EVAL", "PRES"];
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {stages.map((s, i) => (
        <div
          key={s}
          className="w-10 h-10 flex items-center justify-center text-[10px] font-mono font-bold rounded-lg"
          style={{
            background: i < 3 ? "rgba(77,127,255,0.15)" : "rgba(255,255,255,0.04)",
            color: i < 3 ? "#4D7FFF" : "#4A5170",
            border: `1px solid ${i < 3 ? "rgba(77,127,255,0.3)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          {s}
        </div>
      ))}
      <div className="w-full h-1 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: "50%", background: "linear-gradient(90deg, #4D7FFF, #00E5A3)" }} />
      </div>
    </div>
  );
}

const gridClass: Record<string, string> = {
  large:  "md:col-span-2 md:row-span-2",
  medium: "md:col-span-2",
  small:  "md:col-span-1",
};

function BentoCard({ item, index }: { item: BentoItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`bento p-6 flex flex-col cursor-default ${gridClass[item.size]}`}
    >
      {/* Accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-[20px] transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 30% 30%, ${item.accent}10 0%, transparent 70%)` }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-auto">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${item.accent}12`, border: `1px solid ${item.accent}25` }}
        >
          {item.icon}
        </div>
        {item.tag && (
          <span
            className="badge text-[11px]"
            style={{
              background: `${item.tagColor}12`,
              color: item.tagColor,
              border: `1px solid ${item.tagColor}25`,
            }}
          >
            {item.tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-5">
        <h3 className="font-display font-bold text-white mb-2"
          style={{ fontSize: item.size === "large" ? "1.4rem" : "1.05rem" }}
        >
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>
          {item.description}
        </p>

        {/* Visuals */}
        {item.visual === "ai-chat" && <AiChatVisual />}
        {item.visual === "hexgrid" && <HexGridVisual />}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${item.accent}60, transparent)` }}
      />
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="container-voa">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#4D7FFF" }}>
            Platform
          </p>
          <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.1 }}>
            Everything your education needs.{" "}
            <span className="text-gradient-cobalt">Nothing it doesn&apos;t.</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "#6B7290" }}>
            Not adapted. Not repurposed. Built from scratch for the ZIMSEC system, with AI at the core.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-auto gap-3">
          {items.map((item, i) => (
            <BentoCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
