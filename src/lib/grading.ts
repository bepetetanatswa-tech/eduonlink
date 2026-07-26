export type ZimsecLevel = "primary" | "o_level" | "a_level";

export interface GradeBand { l: string; c: string; min: number }

// ECD A/B and Grade 1-7 -> primary; Form 1-4 -> O-Level; Form 5-6 -> A-Level.
export function levelFromGradeLevel(gradeLevel: string | null | undefined): ZimsecLevel {
  const gl = (gradeLevel ?? "").trim().toLowerCase();
  if (/^form\s*[56]\b/.test(gl) || gl.includes("lower six") || gl.includes("upper six")) return "a_level";
  if (/^form\b/.test(gl)) return "o_level";
  return "primary";
}

const BANDS: Record<ZimsecLevel, GradeBand[]> = {
  primary: [
    { l: "A", c: "#1F4738", min: 90 },
    { l: "B", c: "#4C7A63", min: 80 },
    { l: "C", c: "#A9873F", min: 70 },
    { l: "D", c: "#C9A15A", min: 60 },
    { l: "E", c: "#B1502B", min: 50 },
    { l: "F", c: "#A3311E", min: 0 },
  ],
  o_level: [
    { l: "A", c: "#1F4738", min: 75 },
    { l: "B", c: "#4C7A63", min: 60 },
    { l: "C", c: "#A9873F", min: 50 },
    { l: "D", c: "#C9A15A", min: 40 },
    { l: "E", c: "#B1502B", min: 30 },
    { l: "U", c: "#A3311E", min: 0 },
  ],
  a_level: [
    { l: "A", c: "#1F4738", min: 80 },
    { l: "B", c: "#4C7A63", min: 70 },
    { l: "C", c: "#A9873F", min: 60 },
    { l: "D", c: "#C9A15A", min: 50 },
    { l: "E", c: "#B1502B", min: 40 },
    { l: "U", c: "#A3311E", min: 0 },
  ],
};

export function gradeForScore(score: number, level: ZimsecLevel): GradeBand {
  const bands = BANDS[level];
  return bands.find(b => score >= b.min) ?? bands[bands.length - 1];
}

export const GRADE_COLOR: Record<string, string> = {
  A: "#1F4738", B: "#4C7A63", C: "#A9873F", D: "#C9A15A", E: "#B1502B", F: "#A3311E", U: "#A3311E",
};
