"use client";

import {
  IconChip, IconRadio, IconPencilCheck, IconFlask, IconBook, IconFamily,
} from "@/components/icons";

interface FeatureItem {
  id: string;
  size: "large" | "medium" | "small";
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tag?: string;
  title: string;
  description: string;
  visual?: "ai-chat" | "hexgrid";
}

const items: FeatureItem[] = [
  {
    id: "ai",
    size: "large",
    Icon: IconChip,
    tag: "Gemini-powered",
    title: "Sir Taks marks your work",
    description: "Ask a question, submit an assignment, or paste a past-paper answer — Sir Taks explains it the way a teacher would, marks it up, and tells you exactly what to fix. Available any time, day or night.",
    visual: "ai-chat",
  },
  {
    id: "live",
    size: "small",
    Icon: IconRadio,
    title: "Live classes",
    description: "HD lessons with Zimbabwe's best teachers, built to run smoothly on low bandwidth.",
  },
  {
    id: "exams",
    size: "small",
    Icon: IconPencilCheck,
    title: "Past papers, marked",
    description: "Every ZIMSEC past paper, with AI scoring and a full explanation for each answer.",
  },
  {
    id: "hbc",
    size: "medium",
    Icon: IconFlask,
    tag: "Unique to EduOnLink",
    title: "HBC project support",
    description: "Guided help through all six official HBC stages. Sir Taks drafts your SBP blueprint, tracks your progress, and keeps your teacher in the loop.",
    visual: "hexgrid",
  },
  {
    id: "curriculum",
    size: "small",
    Icon: IconBook,
    tag: "ZIMSEC official",
    title: "The full curriculum",
    description: "ECD to A-Level. Every subject, every syllabus point, exactly as ZIMSEC sets it.",
  },
  {
    id: "roles",
    size: "small",
    Icon: IconFamily,
    title: "One platform, every role",
    description: "Students, teachers, parents, and school admins each get a dashboard built for them.",
  },
];

function AiChatVisual() {
  return (
    <div className="mt-5 border border-edu-slate-200 rounded p-4">
      <p className="text-xs text-edu-slate-500 mb-3">Newton&apos;s 3rd Law — your answer</p>
      <p className="text-sm text-edu-ink leading-relaxed mb-3">
        &ldquo;When a person pushes a hoe into the ground, the ground pushes back with equal force.&rdquo;
      </p>
      <div className="border-t border-edu-slate-200 pt-3 flex gap-2">
        <span className="text-edu-clay font-semibold text-sm flex-shrink-0">Sir Taks:</span>
        <p className="text-sm text-edu-clay leading-relaxed">
          Correct principle, good example. Add the word &ldquo;reaction&rdquo; — examiners look for the action/reaction pair by name.
        </p>
      </div>
    </div>
  );
}

function HexGridVisual() {
  const stages = ["ID", "INV", "DES", "IMP", "EVAL", "PRES"];
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {stages.map((s, i) => (
        <div
          key={s}
          className={`w-10 h-10 flex items-center justify-center text-[10px] font-semibold rounded border ${
            i < 3 ? "bg-edu-gold-100 border-edu-gold-300 text-edu-gold-dark" : "border-edu-slate-200 text-edu-slate-400"
          }`}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

const gridClass: Record<string, string> = {
  large:  "md:col-span-2 md:row-span-2",
  medium: "md:col-span-2",
  small:  "md:col-span-1",
};

function FeatureCard({ item }: { item: FeatureItem }) {
  return (
    <div className={`border border-edu-slate-200 rounded p-6 flex flex-col ${gridClass[item.size]}`}>
      <div className="flex items-start justify-between mb-auto">
        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-edu-slate-100 text-edu-copper">
          <item.Icon size={20} />
        </div>
        {item.tag && (
          <span className="text-[11px] font-semibold text-edu-slate-500 border border-edu-slate-300 rounded-full px-2.5 py-1">
            {item.tag}
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="font-display font-semibold text-edu-ink mb-2" style={{ fontSize: item.size === "large" ? "1.35rem" : "1.05rem" }}>
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed text-edu-slate-600">{item.description}</p>

        {item.visual === "ai-chat" && <AiChatVisual />}
        {item.visual === "hexgrid" && <HexGridVisual />}
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="container-edu">
        <div className="max-w-2xl mb-14">
          <h2 className="font-display font-semibold text-edu-ink mb-4" style={{ fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.1 }}>
            Everything you need, nothing you have to piece together.
          </h2>
          <p className="text-base leading-relaxed text-edu-slate-600">
            Built from the ZIMSEC syllabus outward, with Sir Taks doing the marking most platforms leave to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-auto gap-3">
          {items.map((item) => (
            <FeatureCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
