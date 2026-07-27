"use client";

import { useRouter } from "next/navigation";
import { IconGraduate, IconChalkboard, IconSchool, IconFamily, IconChevronRight } from "@/components/icons";

const ROLES = [
  { Icon: IconGraduate,   title: "Students", sub: "Learn at your pace and get AI help whenever you're stuck.", cta: "Start free", href: "/auth/register" },
  { Icon: IconChalkboard, title: "Teachers", sub: "Teach, earn, and grow your reach beyond one classroom.", cta: "Join as an educator", href: "/auth/register" },
  { Icon: IconSchool,     title: "Schools",  sub: "Roll EduOnLink out to your whole institution.", cta: "Talk to us", href: "/contact" },
  { Icon: IconFamily,     title: "Parents",  sub: "See your child's progress without having to ask.", cta: "Track progress", href: "/auth/register" },
];

export default function CTASection() {
  const router = useRouter();
  return (
    <section className="section" id="cta">
      <div className="container-edu">
        <h2 className="font-display font-semibold text-edu-ink mb-12" style={{ fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.1 }}>
          Who are you signing up as?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-16">
          {ROLES.map((r) => (
            <button
              key={r.title}
              onClick={() => router.push(r.href)}
              className="group text-left border border-edu-slate-200 rounded p-6 flex flex-col gap-4 transition-all duration-200 hover:border-edu-copper-300 hover:shadow-elevated hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded flex items-center justify-center bg-edu-slate-100 text-edu-copper transition-colors duration-200 group-hover:bg-edu-copper group-hover:text-edu-paper">
                <r.Icon size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-edu-ink text-lg mb-1">{r.title}</h3>
                <p className="text-sm leading-relaxed text-edu-slate-600">{r.sub}</p>
              </div>
              <span className="w-full btn-ghost py-2.5 text-sm pointer-events-none">
                {r.cta}
              </span>
            </button>
          ))}
        </div>

        <div className="border border-edu-slate-300 rounded p-10 lg:p-16 text-center">
          <h3 className="font-display font-semibold text-edu-ink mb-4" style={{ fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.1 }}>
            Get your first lesson marked today.
          </h3>
          <p className="text-base mb-10 max-w-xl mx-auto text-edu-slate-600">
            28+ ZIMSEC subjects. All 10 provinces. Free for every student — no credit card, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push("/auth/register")} className="btn-primary text-base px-10 py-4">
              Start learning free
              <IconChevronRight size={16} />
            </button>
            <button onClick={() => router.push("/contact")} className="btn-ghost text-base px-10 py-4">
              Book a school demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
