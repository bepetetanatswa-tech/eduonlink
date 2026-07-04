export interface RubricCriterion { name: string; maxPoints: number }

// Rubric criteria are stored as JSON inside the existing assignments.rubric
// text column (no schema change needed). Older freeform-text rubrics fail
// JSON.parse (or parse to something that isn't a criteria array) and are
// treated as legacy plain text instead.
export function parseRubric(raw: string | null): RubricCriterion[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((c) => typeof c?.name === "string" && typeof c?.maxPoints === "number")) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
