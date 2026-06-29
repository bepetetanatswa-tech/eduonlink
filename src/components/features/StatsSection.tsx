"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  color: "blue" | "gold";
}

const stats: Stat[] = [
  { value: 10000, suffix: "+", label: "Active Students", sublabel: "Across Zimbabwe", color: "blue" },
  { value: 500, suffix: "+", label: "Schools Onboarded", sublabel: "Urban & Rural", color: "gold" },
  { value: 2000, suffix: "+", label: "Teachers", sublabel: "Verified Educators", color: "blue" },
  { value: 12, suffix: "", label: "ZIMSEC Subjects", sublabel: "O & A Level + Primary", color: "gold" },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);

  return count;
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const count = useCountUp(stat.value, 2000, inView);

  const colorMap = {
    blue: { text: "text-voa-blue", glow: "glow-blue", border: "border-voa-blue/20" },
    gold: { text: "text-voa-gold", glow: "glow-gold", border: "border-voa-gold/20" },
  };
  const c = colorMap[stat.color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className={`glass rounded-2xl p-8 border ${c.border} relative overflow-hidden group cursor-default`}
    >
      {/* Background glow on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
        style={{
          background:
            stat.color === "blue"
              ? "radial-gradient(circle at 30% 30%, rgba(0,212,255,0.08) 0%, transparent 70%)"
              : "radial-gradient(circle at 30% 30%, rgba(255,215,0,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        <div className={`font-display font-bold text-5xl lg:text-6xl ${c.text} mb-2 leading-none`}>
          {count.toLocaleString()}
          <span className="text-3xl">{stat.suffix}</span>
        </div>
        <div className="text-white font-semibold text-lg mb-1">{stat.label}</div>
        <div className="text-white/40 text-sm">{stat.sublabel}</div>
      </div>

      {/* Corner accent */}
      <div
        className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20`}
        style={{
          background:
            stat.color === "blue"
              ? "linear-gradient(225deg, rgba(0,212,255,0.6) 0%, transparent 100%)"
              : "linear-gradient(225deg, rgba(255,215,0,0.6) 0%, transparent 100%)",
        }}
      />
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-24 relative overflow-hidden" id="stats">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-voa-blue text-sm font-semibold tracking-widest uppercase mb-4">
            By The Numbers
          </p>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white">
            Zimbabwe&apos;s education is{" "}
            <span className="text-gradient-blue">levelling up</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
