"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STATS = [
  { value: "28+",   label: "ZIMSEC Subjects",      sub: "O-Level, A-Level & Primary",   accent: "#4D7FFF" },
  { value: "10",    label: "Provinces Covered",     sub: "Every corner of Zimbabwe",      accent: "#F5A623" },
  { value: "24/7",  label: "AI Tutor Access",       sub: "Sir Taks, always available",    accent: "#00E5A3" },
  { value: "Free",  label: "For Every Student",     sub: "No credit card, ever",          accent: "#A78BFA" },
];

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="container-voa">
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col p-8 transition-colors duration-300"
              style={{ background: "#07080C" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = `${s.accent}06`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#07080C";
              }}
            >
              <span
                className="font-display font-bold mb-1 tabular-nums"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1, color: s.accent }}
              >
                {s.value}
              </span>
              <span className="font-semibold text-sm text-white mb-1">{s.label}</span>
              <span className="text-xs" style={{ color: "#4A5170" }}>{s.sub}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
