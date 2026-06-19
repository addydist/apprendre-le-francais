// Progress, streak, XP and a lightweight SRS (spaced repetition) — all stored
// in localStorage so there is no backend to run. Client-side only.

"use client";

const KEY = "apprendre.progress.v1";

export interface SrsCard {
  fr: string;
  en: string;
  // Leitner-style box (1..5). Higher box = longer interval.
  box: number;
  dueDate: number; // epoch ms when the card is next due
  lapses: number;
}

export interface ProgressState {
  xp: number;
  streak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  completedLessons: string[];
  // per-lesson best score (0..1)
  lessonScores: Record<string, number>;
  srs: Record<string, SrsCard>; // keyed by French term
}

const EMPTY: ProgressState = {
  xp: 0,
  streak: 0,
  lastActiveDay: null,
  completedLessons: [],
  lessonScores: {},
  srs: {},
};

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as ProgressState) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

// Update the streak when the learner does anything today.
export function touchStreak(state: ProgressState): ProgressState {
  const today = todayStr();
  if (state.lastActiveDay === today) return state;
  let streak = 1;
  if (state.lastActiveDay) {
    const diff = dayDiff(state.lastActiveDay, today);
    if (diff === 1) streak = state.streak + 1;
    else if (diff <= 0) streak = state.streak; // clock weirdness, keep it
  }
  return { ...state, streak, lastActiveDay: today };
}

const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16]; // index by box (1..5)

// Record an SRS review outcome and reschedule the card.
export function reviewCard(
  state: ProgressState,
  vocab: { fr: string; en: string },
  correct: boolean,
): ProgressState {
  const existing = state.srs[vocab.fr];
  const box = existing?.box ?? 1;
  const lapses = existing?.lapses ?? 0;
  const newBox = correct ? Math.min(box + 1, 5) : 1;
  const interval = BOX_INTERVAL_DAYS[newBox] ?? 1;
  const card: SrsCard = {
    fr: vocab.fr,
    en: vocab.en,
    box: newBox,
    dueDate: Date.now() + interval * 86_400_000,
    lapses: correct ? lapses : lapses + 1,
  };
  return { ...state, srs: { ...state.srs, [vocab.fr]: card } };
}

export function dueCards(state: ProgressState): SrsCard[] {
  const now = Date.now();
  return Object.values(state.srs)
    .filter((c) => c.dueDate <= now)
    .sort((a, b) => a.dueDate - b.dueDate);
}

// Mark a lesson complete; award XP and bump streak. score is 0..1.
export function completeLesson(
  state: ProgressState,
  lessonId: string,
  score: number,
  earnedXp: number,
): ProgressState {
  let next = touchStreak(state);
  const prevBest = next.lessonScores[lessonId] ?? 0;
  next = {
    ...next,
    xp: next.xp + earnedXp,
    completedLessons: next.completedLessons.includes(lessonId)
      ? next.completedLessons
      : [...next.completedLessons, lessonId],
    lessonScores: {
      ...next.lessonScores,
      [lessonId]: Math.max(prevBest, score),
    },
  };
  return next;
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

// Rough CEFR estimate from how many lessons are completed per level.
export function estimateLevel(state: ProgressState): string {
  const n = state.completedLessons.length;
  if (n >= 40) return "B2";
  if (n >= 24) return "B1";
  if (n >= 12) return "A2";
  if (n >= 4) return "A1+";
  return "A1";
}
