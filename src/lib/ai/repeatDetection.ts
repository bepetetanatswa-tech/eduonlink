function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}

function similarity(a: string, b: string): number {
  const wordsA = Array.from(new Set(normalize(a).split(" ").filter(Boolean)));
  const wordsB = new Set(normalize(b).split(" ").filter(Boolean));
  if (wordsA.length === 0 || wordsB.size === 0) return 0;
  const intersection = wordsA.filter((w) => wordsB.has(w)).length;
  const union = new Set(wordsA.concat(Array.from(wordsB))).size;
  return intersection / union;
}

/**
 * Counts how many prior user messages in this session are near-duplicates of
 * the current one — used to detect a student asking the same question
 * repeatedly instead of trying to recall the earlier explanation.
 */
const MIN_WORDS = 4; // skip short filler ("ok", "thanks") — not a real repeated question

export function countSimilarPriorQuestions(
  history: { role: string; content: string }[],
  currentMessage: string,
  threshold = 0.6
): number {
  if (normalize(currentMessage).split(" ").filter(Boolean).length < MIN_WORDS) return 0;
  const userMessages = history.filter((m) => m.role === "user").map((m) => m.content);
  return userMessages.filter((m) =>
    normalize(m).split(" ").filter(Boolean).length >= MIN_WORDS && similarity(m, currentMessage) >= threshold
  ).length;
}
