"use client";

import { useEffect, useState } from "react";
import { speakFrench, ttsAvailable } from "@/lib/speak";
import { frenchToDevanagari, frenchWordToDevanagari } from "@/lib/frenchPhonetics";
import { authHeaders } from "@/lib/apiKeys";
import { FrenchVoiceWarning } from "./FrenchVoiceWarning";

interface WordBreakdown {
  french: string;
  hindi: string;
  meaning: string;
}

interface TranslateResult {
  french: string;
  pronunciationHi: string;
  words: WordBreakdown[];
  unavailable?: boolean;
  error?: string;
}

// Fill in the Hindi pronunciation from the offline engine. The LLM only
// returns french + word meanings now; pronunciation is computed here so it's
// consistent with the flashcards, instant, and free.
function withPronunciation(data: TranslateResult): TranslateResult {
  if (data.unavailable || !data.french) return data;
  return {
    ...data,
    pronunciationHi: frenchToDevanagari(data.french),
    words: (data.words ?? []).map((w) => ({
      ...w,
      hindi: frenchWordToDevanagari(w.french),
    })),
  };
}

const EXAMPLES = [
  "Hello, how are you?",
  "I would like a coffee, please.",
  "Where is the train station?",
  "I am learning French to pass the exam.",
];

// Cache translations in localStorage so repeating a phrase costs no API quota.
const CACHE_KEY = "apprendre.translate.cache.v1";

function cacheId(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCache(text: string): TranslateResult | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
    return all[cacheId(text)] ?? null;
  } catch {
    return null;
  }
}

function writeCache(text: string, data: TranslateResult): void {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
    all[cacheId(text)] = data;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / serialization errors
  }
}

// Remember the last input + result so they survive leaving and returning to
// the tab (the component unmounts on route change, which would reset state).
const LAST_TEXT_KEY = "apprendre.translate.lastText";
const LAST_RESULT_KEY = "apprendre.translate.lastResult";

function saveLastText(t: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_TEXT_KEY, t);
  } catch {}
}

function saveLastResult(r: TranslateResult | null): void {
  if (typeof window === "undefined") return;
  try {
    if (r) window.localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(r));
    else window.localStorage.removeItem(LAST_RESULT_KEY);
  } catch {}
}

function loadLastText(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(LAST_TEXT_KEY) || "";
}

function loadLastResult(): TranslateResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_RESULT_KEY);
    return raw ? (JSON.parse(raw) as TranslateResult) : null;
  } catch {
    return null;
  }
}

export function Translator() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore the last input + result when the tab is reopened.
  useEffect(() => {
    setText(loadLastText());
    const last = loadLastResult();
    if (last) setResult(withPronunciation(last));
  }, []);

  function updateText(v: string) {
    setText(v);
    saveLastText(v);
  }

  async function translate(input?: string) {
    const value = (input ?? text).trim();
    if (!value) return;
    if (input) updateText(input);
    else saveLastText(value);
    setLoading(true);
    setError(null);
    setResult(null);
    saveLastResult(null);

    // Serve from cache first — repeat phrases cost zero API quota.
    const cached = readCache(value);
    if (cached) {
      const enriched = withPronunciation(cached);
      setResult(enriched);
      saveLastResult(enriched);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text: value }),
      });
      const raw = (await res.json()) as TranslateResult;
      if (!res.ok) throw new Error(raw.error || `Server error ${res.status}`);
      // Generate the Hindi pronunciation locally (offline engine), not the LLM.
      const data = withPronunciation(raw);
      setResult(data);
      if (!data.unavailable) {
        writeCache(value, data);
        saveLastResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <FrenchVoiceWarning />

      {/* Input */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="text-sm font-medium">Type something in English</label>
        <textarea
          value={text}
          onChange={(e) => updateText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) translate();
          }}
          rows={3}
          placeholder="e.g. Hello, I would like a coffee."
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Tip: ⌘/Ctrl + Enter</span>
          <button
            onClick={() => translate()}
            disabled={loading || !text.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {loading ? "Translating…" : "Translate & pronounce →"}
          </button>
        </div>

        {/* Example chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => translate(ex)}
              disabled={loading}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </p>
      )}

      {result && !result.unavailable && (
        <div className="space-y-5">
          {/* French sentence + full pronunciation */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-500">French 🇫🇷</p>
                <p className="mt-1 text-2xl font-bold">{result.french}</p>
              </div>
              {ttsAvailable() && (
                <button
                  onClick={() => speakFrench(result.french)}
                  className="shrink-0 rounded-xl bg-sky-100 px-4 py-3 text-xl hover:bg-sky-200 dark:bg-sky-900/40"
                  aria-label="Play French sentence"
                  title="Listen (female voice)"
                >
                  🔊
                </button>
              )}
            </div>
            <div className="mt-4 rounded-xl bg-orange-50 p-3 dark:bg-orange-900/20">
              <p className="text-xs uppercase tracking-wide text-orange-600">
                Hindi pronunciation 🗣️
              </p>
              <p className="mt-1 text-xl" lang="hi">
                {result.pronunciationHi}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Read the Devanagari above to approximate the French sounds, then press 🔊 to
                hear the real thing and copy it.
              </p>
            </div>
          </div>

          {/* Word by word */}
          <div>
            <h2 className="mb-3 text-lg font-bold">Word by word</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.words.map((w, i) => (
                <div
                  key={`${w.french}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{w.french}</p>
                    <p className="truncate text-orange-600 dark:text-orange-400" lang="hi">
                      {w.hindi}
                    </p>
                    <p className="truncate text-sm text-zinc-500">{w.meaning}</p>
                  </div>
                  {ttsAvailable() && (
                    <button
                      onClick={() => speakFrench(w.french)}
                      className="shrink-0 rounded-lg bg-sky-100 px-3 py-2 hover:bg-sky-200 dark:bg-sky-900/40"
                      aria-label={`Play ${w.french}`}
                    >
                      🔊
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
