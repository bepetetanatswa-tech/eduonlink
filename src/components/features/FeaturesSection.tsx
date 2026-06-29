"use client";

import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";

interface Feature {
  icon: string;
  title: string;
  description: string;
  tag?: string;
  color: "blue" | "gold";
}

const features: Feature[] = [
  {
    icon: "📚",
    title: "ZIMSEC HBC Curriculum",
    description:
      "Every lesson aligned to the Heritage-Based Curriculum. ECD, Primary, O-Level, and A-Level — all subjects, all forms, exactly how ZIMSEC defines them.",
    tag: "ZIMSEC Aligned",
    color: "blue",
  },
  {
    icon: "🤖",
    title: "AI Tutor — Always On",
    description:
      "Your personal tutor that never sleeps. Ask anything, get instant explanations, practice problems, and feedback — powered by the latest AI, trained on the ZIMSEC syllabus.",
    tag: "AI Powered",
    color: "gold",
  },
  {
    icon: "📹",
    title: "Live Classes & Recordings",
    description:
      "Join live lessons with top Zimbabwean teachers, or watch recorded sessions on demand. Never miss a class. HD video, low-bandwidth optimized for Zimbabwe.",
    color: "blue",
  },
  {
    icon: "📝",
    title: "ZIMSEC Exam Preparation",
    description:
      "Past papers, model answers, and timed mock exams. The AI scores your work and shows you exactly where to improve — before the real exam.",
    tag: "Coming Soon",
    color: "gold",
  },
  {
    icon: "🔬",
    title: "HBC Project Workflow",
    description:
      "Guided support for all 6 stages of the Heritage-Based Curriculum project: Identification → Investigation → Design → Implementation → Evaluation → Presentation.",
    tag: "Unique to VOA",
    color: "blue",
  },
  {
    icon: "👥",
    title: "Multi-Role Platform",
    description:
      "One platform for students, teachers, parents, and school admins. Track progress, assign work, monitor attendance, and communicate — all in one place.",
    color: "gold",
  },
];

const tagColors = {
  "ZIMSEC Aligned": "bg-voa-blue/15 text-voa-blue",
  "AI Powered": "bg-voa-gold/15 text-voa-gold",
  "Coming Soon": "bg-white/10 text-white/60",
  "Unique to VOA": "bg-voa-blue/15 text-voa-blue",
};

export default function FeaturesSection() {
  return (
    <section className="py-24 relative" id="features">
      {/* Background grid */}
      <div
        className="absolute inset-0 pattern-grid opacity-20"
        style={{ maskImage: "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <p className="text-voa-blue text-sm font-semibold tracking-widest uppercase mb-4">
            Platform Features
          </p>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-6">
            Everything a Zimbabwean student needs.{" "}
            <span className="text-gradient-gold">Nothing they don&apos;t.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Built from scratch for the ZIMSEC system. Not adapted, not repurposed — purpose-built
            for Zimbabwe&apos;s education.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <GlassCard key={feature.title} delay={i * 0.08} variant={feature.color === "blue" ? "blue" : "gold"}>
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  {feature.tag && (
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        tagColors[feature.tag as keyof typeof tagColors] || "bg-white/10 text-white/60"
                      }`}
                    >
                      {feature.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed flex-1">{feature.description}</p>
                <motion.div
                  className={`mt-5 flex items-center gap-2 text-sm font-medium cursor-pointer group ${
                    feature.color === "blue" ? "text-voa-blue" : "text-voa-gold"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  Learn more
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
