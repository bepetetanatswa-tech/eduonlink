"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { IconChevronRight } from "@/components/icons";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => null });

export default function HeroSection() {
  const router = useRouter();
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEnd =
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency < 4;
    // Desktop-only decorative render — skipped on narrow/mobile viewports
    // entirely, where budget-Android bandwidth and battery matter most.
    const narrow = typeof window !== "undefined" && window.innerWidth < 1024;
    if (!reduced && !lowEnd && !narrow) setShow3D(true);
  }, []);

  return (
    <section className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden">
      <div className="container-edu grid lg:grid-cols-[1fr_320px] gap-8 items-center">
        <div className="max-w-3xl animate-chalk-in">
          <h1
            className="font-display font-semibold text-edu-ink mb-6"
            style={{ fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.08 }}
          >
            Study for ZIMSEC the way your best teacher would explain it.
          </h1>

          <p className="text-lg leading-relaxed text-edu-slate-600 mb-8 max-w-xl">
            Sir Taks marks your work and explains what you got wrong. The full curriculum from ECD to A-Level, live classes, and every past paper — free for every student.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button onClick={() => router.push("/auth/register")} className="btn-primary text-base px-7 py-3.5">
              Start learning free
              <IconChevronRight size={16} />
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ghost text-base px-7 py-3.5"
            >
              See how it works
            </button>
          </div>

          <p className="text-sm text-edu-slate-500">
            28+ ZIMSEC subjects. All 10 provinces. No credit card, ever.
          </p>
        </div>

        {show3D && (
          <div className="hidden lg:block" style={{ height: 320 }} aria-hidden="true">
            <HeroScene />
          </div>
        )}
      </div>
    </section>
  );
}
