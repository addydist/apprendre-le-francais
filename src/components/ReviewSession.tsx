"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/useProgress";
import { dueCards, reviewCard, touchStreak, type SrsCard } from "@/lib/progress";
import { speakFrench, ttsAvailable } from "@/lib/speak";

export function ReviewSession() {
  const { state, update, ready } = useProgress();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Snapshot the due queue once when the session starts so it doesn't shift
  // underneath us as we reschedule cards.
  const queue = useMemo<SrsCard[]>(() => (ready ? dueCards(state) : []), [ready]);

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />;
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center dark:bg-emerald-900/30">
        <div className="text-5xl">✅</div>
        <p className="mt-3 font-semibold">Nothing to review right now!</p>
        <p className="text-sm text-zinc-500">
          Complete lessons to add words to your deck. They&apos;ll come back for
          review over the following days, spaced out so they stick for good.
        </p>
        <Link href="/" className="mt-4 inline-block text-indigo-600 underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (idx >= queue.length) {
    return (
      <div className="rounded-2xl bg-indigo-50 p-8 text-center dark:bg-indigo-900/30">
        <div className="text-5xl">🎉</div>
        <p className="mt-3 font-semibold">Review complete!</p>
        <p className="text-sm text-zinc-500">
          {reviewedCount} card{reviewedCount === 1 ? "" : "s"} reviewed. Come back
          tomorrow to keep the words fresh.
        </p>
        <Link href="/" className="mt-4 inline-block text-indigo-600 underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const card = queue[idx];

  function grade(correct: boolean) {
    update((p) => touchStreak(reviewCard(p, { fr: card.fr, en: card.en }, correct)));
    setReviewedCount((c) => c + 1);
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between text-sm text-zinc-400">
        <Link href="/" className="hover:text-zinc-600">
          ✕ Quit
        </Link>
        <span>
          {idx + 1} / {queue.length}
        </span>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold">{card.fr}</span>
          {ttsAvailable() && (
            <button
              onClick={() => speakFrench(card.fr)}
              className="rounded-md bg-sky-100 px-2 py-1 text-sm text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
            >
              🔊
            </button>
          )}
        </div>
        {revealed && <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-300">{card.en}</p>}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Show answer
        </button>
      ) : (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => grade(false)}
            className="flex-1 rounded-xl border border-rose-300 px-5 py-3 font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/30"
          >
            ✗ Didn&apos;t know
          </button>
          <button
            onClick={() => grade(true)}
            className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            ✓ I knew it
          </button>
        </div>
      )}
    </div>
  );
}
