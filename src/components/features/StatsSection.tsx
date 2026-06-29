"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { value: 10000,   suffix: "+", label: "Active Students",    sub: "and growing daily",      accent: "#4D7FFF" },
  { value: 500,     suffix: "+", label: "Schools Onboarded",  sub: "urban & rural Zimbabwe",  accent: "#F5A623" },
  { value: 2000,    suffix: "+", label: "Verified Teachers",  sub: "across all subjects",     accent: "#00E5A3" },
  { value: 4.9,     suffix: "",  label: "Average Rating",     sub: "from 3,000+ reviews",     accent: "#4D7FFF", isFloat: true },
];

function Counter({ value, suffix, active, isFloat }: { value: number; suffix: string; active: boolean; isFloat?: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const start = performance.now();
    const raf = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(isFloat ? parseFloat((value * eased).toFixed(1)) : Math.floor(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [active, value, isFloat]);

  return (
    <>
      {isFloat ? display.toFixed(1) : display.toLocaleString()}
      {suffix}
    </>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="container-voa">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col p-8 group transition-colors duration-300"
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
                <Counter value={s.value} suffix={s.suffix} active={inView} isFloat={s.isFloat} />
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
