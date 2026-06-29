"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CurriculumLevel {
  id: string;
  name: string;
  badge: string;
  forms: string;
  description: string;
  subjects: string[];
  highlight: string;
  color: "blue" | "gold";
}

const levels: CurriculumLevel[] = [
  {
    id: "primary",
    name: "Primary School",
    badge: "ECD – Grade 7",
    forms: "ECD to Grade 7",
    description:
      "Heritage-Based Curriculum for Primary School. Building strong foundations in literacy, numeracy, and cultural understanding.",
    subjects: [
      "Mathematics",
      "English Language",
      "Shona / Ndebele",
      "Environmental Science",
      "Social Studies",
      "Creative Arts",
      "Physical Education",
      "Heritage Studies",
    ],
    highlight: "HBC Integrated",
    color: "blue",
  },
  {
    id: "o-level",
    name: "O-Level",
    badge: "Form 1 – 4",
    forms: "Form 1 to Form 4",
    description:
      "Full ZIMSEC O-Level coverage aligned to current syllabi. Comprehensive content, past papers, and exam strategies for all subjects.",
    subjects: [
      "Mathematics",
      "English Language",
      "Combined Science",
      "Physics",
      "Chemistry",
      "Biology",
      "Geography",
      "History",
      "Commerce",
      "Accounts",
      "Shona / Ndebele",
      "French",
    ],
    highlight: "12 Subjects",
    color: "blue",
  },
  {
    id: "a-level",
    name: "A-Level",
    badge: "Form 5 – 6",
    forms: "Form 5 to Form 6",
    description:
      "Advanced Level content with university-entry depth. Subject expertise from Zimbabwe's best teachers, aligned exactly to ZIMSEC A-Level syllabi.",
    subjects: [
      "Pure Mathematics",
      "Statistics",
      "Physics",
      "Chemistry",
      "Biology",
      "Economics",
      "Business Studies",
      "Geography",
      "History",
      "English Literature",
      "Divinity",
      "Computer Science",
    ],
    highlight: "University Prep",
    color: "gold",
  },
];

export default function CurriculumSection() {
  const [active, setActive] = useState("o-level");
  const activeLevel = levels.find((l) => l.id === active)!;

  return (
    <section className="py-24 relative overflow-hidden" id="curriculum">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(0,212,255,0.06) 0%, transparent 60%)",
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
          <p className="text-voa-blue text-sm font-semibold tracking-widest uppercase mb-4">
            ZIMSEC Curriculum
          </p>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-6">
            Every level. Every subject.{" "}
            <span className="text-gradient-blue">Exactly ZIMSEC.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            We don&apos;t adapt foreign curricula. VOA was built from scratch around the Zimbabwe
            school system — every topic, every syllabus, every HBC project stage.
          </p>
        </motion.div>

        {/* Level tabs */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {levels.map((level) => (
            <motion.button
              key={level.id}
              onClick={() => setActive(level.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active === level.id
                  ? "text-voa-navy shadow-blue-glow"
                  : "glass text-white/60 hover:text-white"
              }`}
              style={
                active === level.id
                  ? {
                      background:
                        level.color === "blue"
                          ? "linear-gradient(135deg, #00D4FF, #0099CC)"
                          : "linear-gradient(135deg, #FFD700, #B8960C)",
                    }
                  : {}
              }
            >
              <span>{level.name}</span>
              <span
                className={`ml-2 text-xs opacity-70 ${
                  active === level.id ? "text-voa-navy/70" : "text-white/40"
                }`}
              >
                {level.badge}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Active level content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`grid lg:grid-cols-2 gap-8 glass rounded-3xl p-8 lg:p-12 border ${
              activeLevel.color === "blue" ? "border-voa-blue/15" : "border-voa-gold/15"
            }`}
          >
            {/* Left: Info */}
            <div className="flex flex-col justify-between">
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${
                    activeLevel.color === "blue"
                      ? "bg-voa-blue/15 text-voa-blue"
                      : "bg-voa-gold/15 text-voa-gold"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeLevel.color === "blue" ? "bg-voa-blue" : "bg-voa-gold"
                    }`}
                  />
                  {activeLevel.highlight}
                </div>

                <h3 className="font-display font-bold text-3xl text-white mb-2">
                  {activeLevel.name}
                </h3>
                <p
                  className={`text-sm font-medium mb-4 ${
                    activeLevel.color === "blue" ? "text-voa-blue" : "text-voa-gold"
                  }`}
                >
                  {activeLevel.forms}
                </p>
                <p className="text-white/60 leading-relaxed">{activeLevel.description}</p>
              </div>

              <div className="mt-8">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-xl font-semibold text-voa-navy text-sm"
                  style={{
                    background:
                      activeLevel.color === "blue"
                        ? "linear-gradient(135deg, #00D4FF, #0099CC)"
                        : "linear-gradient(135deg, #FFD700, #B8960C)",
                  }}
                >
                  Explore {activeLevel.name} Courses →
                </motion.button>
              </div>
            </div>

            {/* Right: Subjects */}
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                Subjects Available
              </p>
              <div className="grid grid-cols-2 gap-2">
                {activeLevel.subjects.map((subject, i) => (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2 py-2"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        activeLevel.color === "blue" ? "bg-voa-blue" : "bg-voa-gold"
                      }`}
                    />
                    <span className="text-white/70 text-sm">{subject}</span>
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
