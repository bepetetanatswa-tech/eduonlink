"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconChevronRight } from "@/components/icons";

const LEVELS = [
  {
    id: "primary",
    code: "01",
    name: "Primary",
    range: "ECD – Grade 7",
    description: "Heritage-Based Curriculum foundations. Literacy, numeracy, cultural knowledge and environmental awareness — building the base everything else rests on.",
    subjects: ["Mathematics","English Language","Shona / Ndebele","Environmental Science","Social Studies","Creative Arts","Physical Education","Heritage Studies"],
    badge: "8 subjects",
  },
  {
    id: "o-level",
    code: "02",
    name: "O-Level",
    range: "Form 1 – 4",
    description: "Full ZIMSEC O-Level coverage. Every syllabus, every topic, with AI tutoring, past papers, and HBC project support built in.",
    subjects: ["Mathematics","English Language","Combined Science","Physics","Chemistry","Biology","Geography","History","Commerce","Accounts","Shona / Ndebele","French"],
    badge: "12 subjects",
  },
  {
    id: "a-level",
    code: "03",
    name: "A-Level",
    range: "Form 5 – 6",
    description: "University-entry depth. Zimbabwe's best A-Level teachers, comprehensive ZIMSEC alignment, and AI-powered exam preparation that knows how examiners think.",
    subjects: ["Pure Mathematics","Statistics","Physics","Chemistry","Biology","Economics","Business Studies","Geography","History","English Literature","Computer Science","Divinity"],
    badge: "University prep",
  },
];

export default function CurriculumSection() {
  const router = useRouter();
  const [active, setActive] = useState("o-level");
  const [query, setQuery] = useState("");
  const lvl = LEVELS.find((l) => l.id === active)!;

  const filteredSubjects = useMemo(
    () => lvl.subjects.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase())),
    [lvl, query]
  );

  return (
    <section className="section" id="curriculum">
      <div className="container-edu">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <h2 className="font-display font-semibold text-edu-ink" style={{ fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.1 }}>
            Every level, exactly as ZIMSEC teaches it.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-edu-slate-600">
            Every syllabus point, every HBC requirement, every past-paper question type — built from the Zimbabwe curriculum outward.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="inline-flex border border-edu-slate-300 rounded">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setActive(l.id)}
                className={`px-5 py-2.5 text-sm font-semibold font-display transition-colors duration-150 ${
                  active === l.id ? "bg-edu-copper text-edu-paper" : "text-edu-slate-600 hover:bg-edu-slate-100 hover:text-edu-ink"
                }`}
              >
                {l.name}
                <span className="ml-2 text-[11px] opacity-70">{l.range}</span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-edu-slate-400">
              <IconSearch size={16} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${lvl.name} subjects…`}
              className="field pl-6"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 border border-edu-slate-200 rounded p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border border-edu-copper-300 text-edu-copper-dark">
                {lvl.badge}
              </div>
              <p className="font-display font-semibold text-edu-slate-300 mb-1" style={{ fontSize: "3.5rem", lineHeight: 1 }}>
                {lvl.code}
              </p>
              <h3 className="font-display font-semibold text-edu-ink text-3xl mb-1">{lvl.name}</h3>
              <p className="text-sm font-semibold mb-6 text-edu-copper">{lvl.range}</p>
              <p className="text-sm leading-relaxed text-edu-slate-600">{lvl.description}</p>
            </div>

            <button onClick={() => router.push("/auth/register")} className="btn-primary mt-8 self-start">
              Explore {lvl.name} courses
              <IconChevronRight size={16} />
            </button>
          </div>

          <div className="lg:col-span-3 border border-edu-slate-200 rounded p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-5 text-edu-slate-500">
              Subjects available
            </p>
            {filteredSubjects.length === 0 ? (
              <p className="text-sm text-edu-slate-500">No subject matches &ldquo;{query}&rdquo; in {lvl.name}.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {filteredSubjects.map((s) => (
                  <div key={s} className="flex items-center gap-3 py-2.5 border-b border-edu-slate-100">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 bg-edu-copper" />
                    <span className="text-sm text-edu-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
