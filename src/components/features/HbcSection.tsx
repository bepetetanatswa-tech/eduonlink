"use client";

import { useRouter } from "next/navigation";
import { IconChevronRight } from "@/components/icons";

const STAGES = [
  {
    n: "01",
    name: "Topic identification & rationale",
    description: "Spot a problem or opportunity in your community. Consult local leaders, elders, and peers. Explain why the topic matters and its connection to Zimbabwean heritage.",
  },
  {
    n: "02",
    name: "Research & data collection",
    description: "Gather data, conduct interviews, review heritage literature. Sir Taks helps you structure findings from multiple sources.",
  },
  {
    n: "03",
    name: "Analysis & interpretation",
    description: "Go beyond the facts — analyse what your findings mean. Identify patterns and interpret the heritage significance, not just describe it.",
  },
  {
    n: "04",
    name: "Presentation planning",
    description: "Plan your structure, visuals, and multimedia elements. Sir Taks drafts your full SBP blueprint automatically.",
  },
  {
    n: "05",
    name: "Product & presentation creation",
    description: "Build your final product. Document every step with photos, notes, and evidence that reflects genuine, original effort.",
  },
  {
    n: "06",
    name: "Evaluation & reflection",
    description: "Reflect honestly on what worked and what you'd do differently, then present your work to peers, teachers, and community.",
  },
];

export default function HbcSection() {
  const router = useRouter();

  return (
    <section className="section" id="hbc">
      <div className="container-edu">
        <div className="max-w-2xl mb-16">
          <h2 className="font-display font-semibold text-edu-ink mb-4" style={{ fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.1 }}>
            The HBC project, guided stage by stage.
          </h2>
          <p className="text-sm leading-relaxed text-edu-slate-600">
            Zimbabwe&apos;s HBC project is unlike anything in global education. EduOnLink is the only platform with AI support built into all six official stages — from community identification to final presentation.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-edu-clay opacity-40 hidden lg:block" aria-hidden="true" />

          <div className="flex flex-col gap-3 lg:gap-2">
            {STAGES.map((stage) => (
              <div key={stage.n} className="flex gap-6">
                <div className="flex-shrink-0 relative z-10">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border border-edu-clay-200 bg-edu-paper text-edu-clay">
                    {stage.n}
                  </div>
                </div>

                <div className="flex-1 border border-edu-slate-200 rounded p-5">
                  <h3 className="font-display font-semibold text-edu-ink text-base mb-2">
                    {stage.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-edu-slate-600">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border border-edu-gold-300 rounded p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-edu-gold-50">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2 text-edu-gold-dark">
              New in EduOnLink
            </p>
            <h4 className="font-display font-semibold text-edu-ink text-xl mb-1">SBP blueprint generator</h4>
            <p className="text-sm text-edu-slate-600">
              Describe your project idea — Sir Taks drafts a full, ZIMSEC-compliant SBP blueprint in seconds.
            </p>
          </div>
          <button onClick={() => router.push("/auth/register")} className="flex-shrink-0 btn-gold">
            Generate my blueprint
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
