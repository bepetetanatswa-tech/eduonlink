"use client";

import { motion } from "framer-motion";

const stages = [
  {
    number: "01",
    name: "Identification",
    description: "Identify a problem or opportunity in your community using traditional and modern methods.",
    icon: "🔍",
    color: "#00D4FF",
  },
  {
    number: "02",
    name: "Investigation",
    description: "Research your topic, gather data, consult elders and experts, review relevant literature.",
    icon: "📊",
    color: "#4DE8FF",
  },
  {
    number: "03",
    name: "Design",
    description: "Plan your solution or project. Create prototypes, models, and detailed project plans.",
    icon: "✏️",
    color: "#FFD700",
  },
  {
    number: "04",
    name: "Implementation",
    description: "Execute your plan, track progress, document every step with evidence and reflections.",
    icon: "⚙️",
    color: "#FFC107",
  },
  {
    number: "05",
    name: "Evaluation",
    description: "Assess your project outcomes against goals. What worked? What would you improve?",
    icon: "📋",
    color: "#00D4FF",
  },
  {
    number: "06",
    name: "Presentation",
    description: "Present your work to peers, teachers, and community. Showcase Zimbabwe's next generation of innovators.",
    icon: "🎤",
    color: "#FFD700",
  },
];

export default function HbcSection() {
  return (
    <section className="py-24 relative overflow-hidden" id="hbc">
      {/* Gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(255,215,0,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-voa-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Heritage-Based Curriculum
          </p>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-6">
            The{" "}
            <span className="text-shimmer">HBC Project</span>{" "}
            — guided, step by step
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Zimbabwe&apos;s HBC project is unique. VOA is the only platform with built-in support for
            all 6 official HBC stages — from identification to final presentation.
          </p>
        </motion.div>

        {/* Stages */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-voa-blue/20 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-6 relative group"
                style={{ borderColor: `${stage.color}22` }}
              >
                {/* Stage number */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="font-display font-bold text-5xl leading-none"
                    style={{ color: stage.color, opacity: 0.2 }}
                  >
                    {stage.number}
                  </span>
                  <span className="text-3xl">{stage.icon}</span>
                </div>

                <h3
                  className="font-display font-bold text-xl mb-3 transition-colors"
                  style={{ color: stage.color }}
                >
                  {stage.name}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{stage.description}</p>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${stage.color}, transparent)`,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-white/40 text-sm mb-4">
            Students get AI-powered guidance at every stage. Teachers can track all projects in real-time.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-gold px-8 py-3 rounded-xl font-semibold text-voa-gold text-sm hover:glow-gold transition-all"
          >
            See How HBC Projects Work →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
