"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/types";
import { authHeaders } from "@/lib/apiKeys";

interface GradeResult {
  score: number; // 0..100
  level: string; // estimated CEFR
  strengths: string[];
  improvements: string[];
  corrected: string;
  fallback?: boolean;
}

export function WritingGrader({
  ex,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "writing" }>;
  onContinue: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const enough = words >= ex.minWords;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          text,
          task: ex.taskFr,
          targetLevel: ex.targetLevel,
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setResult((await res.json()) as GradeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-700">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-bold">Votre évaluation</h3>
          <span className="text-2xl font-bold text-indigo-600">{result.score}/100</span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">Niveau estimé : {result.level}</p>
        {result.fallback && (
          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            AI grading is offline (no API key set) — this is a basic word-count
            estimate. Add your own AI key in the &ldquo;AI key&rdquo; panel on the
            dashboard for full grammar feedback.
          </p>
        )}
        {result.strengths.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold text-emerald-600">Points forts</p>
            <ul className="ml-5 list-disc text-sm text-zinc-600 dark:text-zinc-300">
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {result.improvements.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold text-amber-600">À améliorer</p>
            <ul className="ml-5 list-disc text-sm text-zinc-600 dark:text-zinc-300">
              {result.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {result.corrected && (
          <div className="mt-4">
            <p className="font-semibold text-indigo-600">Version corrigée</p>
            <p className="mt-1 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
              {result.corrected}
            </p>
          </div>
        )}
        <button
          onClick={onContinue}
          className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Continuer →
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 rounded-xl bg-indigo-50 p-4 font-medium text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200">
        ✍️ {ex.taskFr}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Écrivez en français…"
      />
      <div className="mt-2 flex items-center justify-between text-sm text-zinc-400">
        <span className={enough ? "text-emerald-600" : ""}>
          {words} / {ex.minWords} mots min.
        </span>
        {error && <span className="text-rose-500">{error}</span>}
      </div>
      <div className="mt-3 flex gap-3">
        <button
          onClick={submit}
          disabled={!enough || loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {loading ? "Correction…" : "Corriger mon texte"}
        </button>
        <button
          onClick={onContinue}
          className="rounded-lg border border-zinc-300 px-5 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Passer
        </button>
      </div>
    </div>
  );
}
