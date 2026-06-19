"use client";

import Link from "next/link";
import { LEVELS, getLessonsByLevel } from "@/lib/curriculum";
import { useProgress } from "@/lib/useProgress";
import { dueCards, estimateLevel, type ProgressState } from "@/lib/progress";
import { VoiceSettings } from "./VoiceSettings";
import { FrenchVoiceWarning } from "./FrenchVoiceWarning";
import { ApiKeySettings } from "./ApiKeySettings";

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`text-3xl font-bold ${accent ?? ""}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-0.5 text-[11px] text-zinc-400">{hint}</div>
    </div>
  );
}

export function Dashboard() {
  const { state, update, ready } = useProgress();

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />;
  }

  const due = dueCards(state).length;
  const level = estimateLevel(state);
  const isNew = state.completedLessons.length === 0 && state.xp === 0;

  return (
    <div className="space-y-8">
      {/* Welcome / orientation banner for new learners */}
      {isNew && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
          <h2 className="text-lg font-bold">Bienvenue ! Welcome 👋</h2>
          <p className="mt-1 text-sm text-indigo-100">
            You&apos;re starting from zero, and that&apos;s exactly right. This app takes
            you from absolute beginner (A1) all the way to exam-ready <strong>B2+</strong>{" "}
            for the TEF and TCF. Realistically that&apos;s a <strong>10–12 month journey</strong> —
            so pace yourself, show up daily, and let the streak do the motivating.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/plan"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              See the full study plan →
            </Link>
            <Link
              href="/lesson/a1-01"
              className="rounded-lg bg-indigo-500/40 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-indigo-500/60"
            >
              Start lesson 1
            </Link>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-3">
        <Stat label="Streak" value={`${state.streak}🔥`} hint="days in a row" />
        <Stat label="XP" value={`${state.xp}`} hint="experience points" accent="text-indigo-600" />
        <Stat label="Level" value={level} hint="estimated CEFR" accent="text-emerald-600" />
      </div>

      {/* Daily-habit nudge */}
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        🎯 <strong>Today&apos;s goal:</strong> complete one lesson and clear your review
        cards. Fifteen focused minutes a day is what gets you to B2 — not cramming.
      </p>

      {/* Setup: AI key + voice */}
      <ApiKeySettings />
      <FrenchVoiceWarning />
      <VoiceSettings />

      {/* Review CTA */}
      <Link
        href="/review"
        className={`block rounded-2xl p-5 transition ${
          due > 0
            ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
            : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">🔁 Spaced-repetition review</p>
            <p className="text-sm text-zinc-500">
              {due > 0
                ? `${due} card${due === 1 ? "" : "s"} are due now — reviewing them locks the words into long-term memory.`
                : "Nothing due right now. Finish lessons to add words to your review deck."}
            </p>
          </div>
          {due > 0 && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-white">
              {due}
            </span>
          )}
        </div>
      </Link>

      {/* Curriculum heading */}
      <div>
        <h2 className="text-2xl font-bold">Your curriculum</h2>
        <p className="text-sm text-zinc-500">
          Work top to bottom. Each lesson mixes vocabulary, grammar, listening (read
          aloud by a French voice), and writing graded by an AI tutor.
        </p>
      </div>

      {/* Levels + lessons */}
      {LEVELS.map((lvl) => {
        const lessons = getLessonsByLevel(lvl.level);
        return (
          <section key={lvl.level}>
            <div className="mb-3">
              <h3 className="text-lg font-bold">{lvl.title}</h3>
              <p className="text-sm text-zinc-500">{lvl.description}</p>
              <p className="mt-1 text-xs italic text-zinc-400">🎯 {lvl.examFocus}</p>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-400 dark:border-zinc-700">
                Lessons for this level are coming soon. For now, use the{" "}
                <Link href="/resources" className="text-indigo-500 underline">
                  curated resources
                </Link>{" "}
                to keep progressing.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {lessons.map((lesson) => {
                  const done = state.completedLessons.includes(lesson.id);
                  const score = state.lessonScores[lesson.id];
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lesson/${lesson.id}`}
                      className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-indigo-500">
                          Lesson {lesson.order}
                        </span>
                        {done && (
                          <span className="text-xs text-emerald-600">
                            ✓ {score ? Math.round(score * 100) : 100}%
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 font-semibold group-hover:text-indigo-600">
                        {lesson.title}
                      </h4>
                      <p className="mt-1 text-sm text-zinc-500">{lesson.goal}</p>
                      {lesson.grammar && (
                        <p className="mt-2 text-xs text-zinc-400">📖 {lesson.grammar}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <ResetButton update={update} />
    </div>
  );
}

function ResetButton({ update }: { update: (fn: (p: ProgressState) => ProgressState) => void }) {
  return (
    <div className="pt-4 text-center">
      <button
        onClick={() => {
          if (confirm("Reset all your progress? This cannot be undone.")) {
            update(() => ({
              xp: 0,
              streak: 0,
              lastActiveDay: null,
              completedLessons: [],
              lessonScores: {},
              srs: {},
            }));
          }
        }}
        className="text-xs text-zinc-400 underline hover:text-rose-500"
      >
        Reset my progress
      </button>
    </div>
  );
}
