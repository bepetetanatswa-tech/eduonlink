"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
const STEPS = [
  {
    id: "welcome",
    title: "Welcome to VOA 🎓",
    subtitle: "You're officially part of Zimbabwe's smartest education platform.",
    cta: "Let's set you up",
  },
  {
    id: "features",
    title: "What you can do",
    subtitle: "Here's a quick look at what VOA unlocks for you.",
    cta: "Looks great — continue",
  },
  {
    id: "ready",
    title: "You're all set!",
    subtitle: "Your account is ready. Let's start learning.",
    cta: "Go to my dashboard",
  },
];

const FEATURES = [
  { icon: "✦", title: "Sir Taks AI Tutor", body: "Ask questions on any ZIMSEC subject and get instant, detailed explanations.", accent: "#00E5A3" },
  { icon: "📚", title: "Full Curriculum", body: "Access complete notes and past papers for every O-Level and A-Level subject.", accent: "#4D7FFF" },
  { icon: "🔬", title: "HBC Project Blueprints", body: "Generate AI-powered project blueprints for any Heritage-Based Curriculum stage.", accent: "#F5A623" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i <= step ? "#4D7FFF" : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="font-display font-bold text-white text-3xl mb-3">{current.title}</h1>
            <p className="text-base mb-10 max-w-sm" style={{ color: "#6B7290" }}>{current.subtitle}</p>

            {step === 1 && (
              <div className="w-full grid gap-4 mb-10">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-4 p-4 rounded-2xl text-left"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}20` }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-white text-sm mb-0.5">{f.title}</p>
                      <p className="text-sm" style={{ color: "#6B7290" }}>{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-10"
                style={{ background: "rgba(77,127,255,0.12)", border: "1px solid rgba(77,127,255,0.2)" }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: 1 }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full max-w-xs h-13 px-8 py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #4D7FFF, #6090FF)",
                color: "#07080C",
                boxShadow: "0 4px 20px rgba(77,127,255,0.3)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Setting up…" : current.cta} →
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
