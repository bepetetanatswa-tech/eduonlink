import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { IconChip, IconBook, IconFlask, IconSchool, IconChevronRight } from "@/components/icons";

const VALUES = [
  {
    Icon: IconChip,
    title: "AI for every student",
    body: "World-class AI tutoring shouldn't be a privilege. EduOnLink puts a personal AI teacher — Sir Taks — in the hands of every Zimbabwean student, whether they're in Harare or a rural Manicaland village.",
  },
  {
    Icon: IconBook,
    title: "Rooted in Zimbabwe",
    body: "EduOnLink was built from the ground up around the ZIMSEC curriculum, HBC projects, and the realities of Zimbabwean classrooms.",
  },
  {
    Icon: IconFlask,
    title: "Honest technology",
    body: "Sir Taks is powered by Google Gemini. We never use AI to replace teachers — we use it to amplify what great teachers already do.",
  },
  {
    Icon: IconSchool,
    title: "Built for schools",
    body: "From student learning to teacher lesson planning, parent progress reports, and school admin dashboards — one platform, every stakeholder.",
  },
];

const TEAM = [
  {
    name: "Tanatswa Bepete",
    role: "Founder & CEO",
    bio: "Tanatswa built EduOnLink to solve the education gap he witnessed firsthand. Sir Taks — the platform's tutor — is named after him. He believes every Zimbabwean child deserves a world-class education, regardless of postcode or income.",
    initial: "T",
  },
];

const TIMELINE = [
  { year: "2024", event: "EduOnLink founded. Mission: bring AI-powered ZIMSEC tutoring to every Zimbabwean student." },
  { year: "Early 2025", event: "Sir Taks AI tutor developed using Google Gemini. Full ZIMSEC O-Level and A-Level curriculum mapped." },
  { year: "Mid 2025", event: "HBC project blueprint generator launched. School admin and teacher portals built." },
  { year: "2025 →", event: "Public launch. Opening access to students, teachers, parents, and schools across Zimbabwe." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-edu-paper margin-rule">
      <Navbar />

      <section className="pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="container-edu max-w-3xl">
          <h1
            className="font-display font-semibold text-edu-ink mb-6"
            style={{ fontSize: "clamp(36px, 6vw, 60px)", lineHeight: 1.08 }}
          >
            We built the school Zimbabwe deserves.
          </h1>
          <p className="text-lg leading-relaxed text-edu-slate-600 max-w-2xl">
            EduOnLink is an AI-powered education platform built specifically for Zimbabwe, for the ZIMSEC curriculum and the HBC project, and for the students who will define the country&apos;s next chapter.
          </p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container-edu max-w-4xl">
          <div className="border border-edu-copper-300 rounded p-8 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-5 text-edu-copper-dark">Our mission</p>
            <blockquote className="font-display font-semibold text-edu-ink leading-tight mb-5" style={{ fontSize: "clamp(22px, 4vw, 34px)" }}>
              &ldquo;Every Zimbabwean student — regardless of where they live, what school they attend, or what their family earns — deserves a world-class education. EduOnLink is how we make that happen.&rdquo;
            </blockquote>
            <p className="text-sm font-semibold text-edu-copper">— Tanatswa Bepete, Founder</p>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container-edu max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-4 text-edu-slate-500">The problem</p>
              <h2 className="font-display font-semibold text-edu-ink mb-5" style={{ fontSize: "clamp(26px, 4vw, 38px)", lineHeight: 1.1 }}>
                Zimbabwe&apos;s students are brilliant. The system hasn&apos;t kept up.
              </h2>
              <p className="text-sm leading-relaxed mb-4 text-edu-slate-600">
                Zimbabwe has some of the highest literacy rates in Africa. Its students are motivated, its teachers are dedicated, and its curriculum — ZIMSEC — is rigorous and respected. But access to quality resources is deeply unequal. A student in Borrowdale has tutors, past papers, and revision guides. A student in Binga has a textbook and a teacher managing 60 students.
              </p>
              <p className="text-sm leading-relaxed text-edu-slate-600">
                AI can&apos;t solve every problem in education. But it can make sure every student, no matter where they are, has a patient, knowledgeable tutor available at 3am the night before an exam. That&apos;s what EduOnLink does.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { stat: "28+",    desc: "ZIMSEC subjects — O-Level, A-Level and Primary" },
                { stat: "24/7",   desc: "AI tutor access on any device, urban or rural" },
                { stat: "All 10", desc: "Zimbabwe provinces served — urban and rural" },
                { stat: "Free",   desc: "For every student. No credit card. No commitment." },
              ].map((s) => (
                <div key={s.stat} className="flex items-center gap-5 p-5 border border-edu-slate-200 rounded">
                  <span className="font-display font-semibold text-2xl flex-shrink-0 w-20 text-edu-copper">{s.stat}</span>
                  <p className="text-sm text-edu-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container-edu max-w-4xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-4 text-edu-slate-500">What we believe</p>
            <h2 className="font-display font-semibold text-edu-ink" style={{ fontSize: "clamp(26px, 4vw, 38px)" }}>Our principles</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {VALUES.map((v) => (
              <div key={v.title} className="p-6 border border-edu-slate-200 rounded h-full">
                <div className="w-10 h-10 rounded flex items-center justify-center mb-4 bg-edu-slate-100 text-edu-copper">
                  <v.Icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-edu-ink text-lg mb-2">{v.title}</h3>
                <p className="text-sm leading-relaxed text-edu-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container-edu max-w-4xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-4 text-edu-slate-500">Our journey</p>
            <h2 className="font-display font-semibold text-edu-ink" style={{ fontSize: "clamp(26px, 4vw, 38px)" }}>How we got here</h2>
          </div>

          <div className="relative">
            <div className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-edu-clay opacity-40" />
            <div className="flex flex-col gap-7 pl-8">
              {TIMELINE.map((t) => (
                <div key={t.year} className="relative">
                  <div className="absolute -left-[33px] top-1 w-3.5 h-3.5 rounded-full border-2 border-edu-clay bg-edu-paper" />
                  <p className="text-xs font-semibold mb-1 text-edu-copper">{t.year}</p>
                  <p className="text-sm leading-relaxed text-edu-slate-600">{t.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container-edu max-w-4xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-4 text-edu-slate-500">The team</p>
            <h2 className="font-display font-semibold text-edu-ink" style={{ fontSize: "clamp(26px, 4vw, 38px)" }}>Who we are</h2>
          </div>

          <div className="flex flex-col gap-3">
            {TEAM.map((m) => (
              <div key={m.name} className="flex flex-col sm:flex-row gap-5 p-6 border border-edu-slate-200 rounded">
                <div className="w-14 h-14 rounded flex items-center justify-center font-display font-semibold text-xl flex-shrink-0 bg-edu-copper-100 border border-edu-copper-300 text-edu-copper-dark">
                  {m.initial}
                </div>
                <div>
                  <p className="font-display font-semibold text-edu-ink text-lg">{m.name}</p>
                  <p className="text-xs mb-2.5 text-edu-copper">{m.role}</p>
                  <p className="text-sm leading-relaxed text-edu-slate-600">{m.bio}</p>
                </div>
              </div>
            ))}

            <div className="p-6 border border-edu-copper-200 bg-edu-copper-50 rounded text-center">
              <p className="text-sm mb-3 text-edu-slate-600">
                EduOnLink is growing. We&apos;re looking for educators, engineers, and people who believe in what we&apos;re building.
              </p>
              <a href="mailto:vavhimiacademy@gmail.com" className="text-sm font-semibold text-edu-copper inline-flex items-center gap-1">
                Get in touch about joining the team <IconChevronRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm pb-24">
        <div className="container-edu max-w-2xl text-center">
          <h2 className="font-display font-semibold text-edu-ink mb-4" style={{ fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.1 }}>
            Ready to be part of it?
          </h2>
          <p className="text-base mb-8 text-edu-slate-600">
            Join EduOnLink as a student, teacher, parent, or school. It&apos;s free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary text-sm px-8 py-3.5">
              Create your account
              <IconChevronRight size={14} />
            </Link>
            <Link href="/contact" className="btn-ghost text-sm px-8 py-3.5">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
