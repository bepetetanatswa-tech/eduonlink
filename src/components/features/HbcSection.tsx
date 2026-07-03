"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";

const STAGES = [
  {
    n: "01",
    name: "Topic Selection & Rationale",
    description: "Spot a problem or opportunity in your community. Consult local leaders, elders, and peers. Explain why the topic matters and its connection to Zimbabwean heritage.",
    accent: "#4D7FFF",
    icon: "🔍",
  },
  {
    n: "02",
    name: "Research & Data Collection",
    description: "Deep research. Gather data, conduct interviews, review heritage literature. Sir Taks helps you structure findings from multiple sources.",
    accent: "#6A8FFF",
    icon: "📊",
  },
  {
    n: "03",
    name: "Analysis & Interpretation",
    description: "Go beyond the facts — analyse what your findings mean. Identify patterns and interpret the heritage significance, not just describe it.",
    accent: "#F5A623",
    icon: "✏️",
  },
  {
    n: "04",
    name: "Presentation Planning",
    description: "Plan your structure, visuals, and multimedia elements. Sir Taks generates your full SBP blueprint automatically.",
    accent: "#F5C423",
    icon: "⚙️",
  },
  {
    n: "05",
    name: "Product/Presentation Creation",
    description: "Create your final product. Document every step with photos, notes, and evidence reflecting genuine, original effort.",
    accent: "#00E5A3",
    icon: "📋",
  },
  {
    n: "06",
    name: "Evaluation & Reflection",
    description: "Reflect honestly on what worked and what you'd do differently, then present your work to peers, teachers, and community.",
    accent: "#00B882",
    icon: "🎤",
  },
];

export default function HbcSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section ref={sectionRef} className="section" id="hbc">
      <div className="container-voa">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#F5A623" }}>
            Heritage-Based Curriculum
          </p>
          <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.1 }}>
            The HBC project —{" "}
            <span className="text-gradient-amber">guided by AI,</span><br />
            owned by you.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>
            Zimbabwe&apos;s HBC project is unlike anything in global education. Educonnect is the only platform
            with built-in AI support for all 6 official stages — from community identification to final presentation.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical progress line */}
          <div
            className="absolute left-[19px] top-5 bottom-5 w-px hidden lg:block"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="w-full"
              style={{
                height: lineHeight,
                background: "linear-gradient(to bottom, #4D7FFF, #F5A623, #00E5A3)",
              }}
            />
          </div>

          <div className="space-y-3 lg:space-y-2">
            {STAGES.map((stage, i) => (
              <motion.div
                key={stage.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-6 group"
              >
                {/* Node */}
                <div className="flex-shrink-0 relative z-10">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `${stage.accent}15`,
                      border: `1px solid ${stage.accent}35`,
                      color: stage.accent,
                    }}
                  >
                    {stage.n}
                  </div>
                </div>

                {/* Card */}
                <motion.div
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="flex-1 rounded-xl p-5 mb-0 transition-all duration-300 group"
                  style={{
                    background: "rgba(15,16,24,0.6)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${stage.accent}30`;
                    (e.currentTarget as HTMLElement).style.background = `${stage.accent}05`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(15,16,24,0.6)";
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{stage.icon}</span>
                    <h3 className="font-display font-bold text-white text-base" style={{ color: stage.accent }}>
                      {stage.name}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed pl-7" style={{ color: "#6B7290" }}>
                    {stage.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SBP blueprint CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          style={{
            background: "rgba(245,166,35,0.06)",
            border: "1px solid rgba(245,166,35,0.15)",
          }}
        >
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#F5A623" }}>
              New in Educonnect
            </p>
            <h4 className="font-display font-bold text-white text-xl mb-1">SBP Blueprint Generator</h4>
            <p className="text-sm" style={{ color: "#6B7290" }}>
              Describe your project idea — Sir Taks generates a full, ZIMSEC-compliant SBP blueprint in seconds.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/auth/register")}
            className="flex-shrink-0 px-6 py-3 rounded-xl text-sm font-semibold font-display"
            style={{
              background: "rgba(245,166,35,0.15)",
              color: "#F5A623",
              border: "1px solid rgba(245,166,35,0.3)",
            }}
          >
            Generate My Blueprint →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
