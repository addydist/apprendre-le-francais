// Loose comparison for learner answers: ignore case, accents, punctuation,
// and extra whitespace. Good enough for A1/A2; tighten later if needed.

export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[.,!?;:«»"']/g, "") // strip common punctuation
    .replace(/\s+/g, " ");
}

export function isAnswerCorrect(input: string, accepted: string[]): boolean {
  const n = normalize(input);
  return accepted.some((a) => normalize(a) === n);
}
