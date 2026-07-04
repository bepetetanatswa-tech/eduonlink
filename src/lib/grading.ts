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
    { l: "A", c: "#00E5A3", min: 90 },
    { l: "B", c: "#4D7FFF", min: 80 },
    { l: "C", c: "#F5A623", min: 70 },
    { l: "D", c: "#FF9B6B", min: 60 },
    { l: "E", c: "#FFD166", min: 50 },
    { l: "F", c: "#FF6B6B", min: 0 },
  ],
  o_level: [
    { l: "A", c: "#00E5A3", min: 75 },
    { l: "B", c: "#4D7FFF", min: 60 },
    { l: "C", c: "#F5A623", min: 50 },
    { l: "D", c: "#FF9B6B", min: 40 },
    { l: "E", c: "#FFD166", min: 30 },
    { l: "U", c: "#FF6B6B", min: 0 },
  ],
  a_level: [
    { l: "A", c: "#00E5A3", min: 80 },
    { l: "B", c: "#4D7FFF", min: 70 },
    { l: "C", c: "#F5A623", min: 60 },
    { l: "D", c: "#FF9B6B", min: 50 },
    { l: "E", c: "#FFD166", min: 40 },
    { l: "U", c: "#FF6B6B", min: 0 },
  ],
};

export function gradeForScore(score: number, level: ZimsecLevel): GradeBand {
  const bands = BANDS[level];
  return bands.find(b => score >= b.min) ?? bands[bands.length - 1];
}

export const GRADE_COLOR: Record<string, string> = {
  A: "#00E5A3", B: "#4D7FFF", C: "#F5A623", D: "#FF9B6B", E: "#FFD166", F: "#FF6B6B", U: "#FF6B6B",
};
