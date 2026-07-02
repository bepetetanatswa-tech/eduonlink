// Heuristic "does this look like real input" filter — catches lazy fake
// submissions (keyboard mashing, repeated characters, "asdf"-style junk)
// on name/school/qualification fields. This is NOT a real-identity
// verifier: a bad actor typing a plausible-looking fake name ("John
// Banda") sails straight through, as it should — actually confirming a
// teacher's identity is what the ZTC number + document admin review
// step is for (see /admin/dashboard/teachers). This just raises the bar
// against the laziest, most common junk input.

const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];

// Exact-match only (never substring) — short fragments like "na" or "test"
// are common inside real names/words (Tanatswa, Testimony, contest...), so
// only reject when the ENTIRE field is one of these placeholder words.
const PLACEHOLDER_WORDS = new Set([
  "na", "n/a", "none", "nil", "unknown", "test", "testing", "sample",
  "example", "todo", "whatever", "asdf", "asdasd", "qwerty", "xxxx", "n a",
]);

function longestRepeatedRun(s: string): number {
  let longest = 1, current = 1;
  for (let i = 1; i < s.length; i++) {
    current = s[i] === s[i - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function containsKeyboardRun(s: string, minLen = 4): boolean {
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - minLen; i++) {
      const forward = row.slice(i, i + minLen);
      const backward = forward.split("").reverse().join("");
      if (s.includes(forward) || s.includes(backward)) return true;
    }
  }
  return false;
}

/**
 * Returns a human-readable reason if `text` looks like fake/junk input,
 * or null if it looks plausible enough to accept.
 */
export function gibberishReason(text: string, opts: { minLength?: number } = {}): string | null {
  const trimmed = text.trim();
  const minLength = opts.minLength ?? 2;

  if (trimmed.length < minLength) return "This looks too short to be real — please enter the full value.";

  const lower = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!lower) return null; // pure punctuation/symbols isn't our concern here, other validation handles it

  if (longestRepeatedRun(lower) >= 4) return "This looks like repeated characters rather than a real entry.";
  if (containsKeyboardRun(lower)) return "This looks like keyboard-mashing rather than a real entry.";
  if (PLACEHOLDER_WORDS.has(lower)) return "Please enter your real details, not placeholder text.";

  // Words of 5+ letters with no vowel at all are almost never real English
  // names/words (allow short acronyms like initials or codes to pass).
  const lettersOnly = lower.replace(/[0-9]/g, "");
  if (lettersOnly.length >= 5 && !/[aeiou]/.test(lettersOnly)) {
    return "This doesn't look like a real entry — please double-check.";
  }

  return null;
}

export function isGibberish(text: string, opts?: { minLength?: number }): boolean {
  return gibberishReason(text, opts) !== null;
}

/**
 * Reference/ID-code fields (e.g. a ZTC registration number) aren't
 * English words, so the vowel-ratio check doesn't apply — but they
 * should still contain a digit, be a plausible length, and not be
 * keyboard-mashed or all-repeated-characters.
 */
export function invalidCodeReason(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 5) return "This looks too short to be a real registration number.";

  const lower = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!/[0-9]/.test(lower)) return "A registration number should include digits.";
  if (longestRepeatedRun(lower) >= 4) return "This looks like repeated characters rather than a real number.";
  if (containsKeyboardRun(lower)) return "This looks like keyboard-mashing rather than a real number.";

  return null;
}
