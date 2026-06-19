"use client";

import { useEffect, useState } from "react";
import { listFrenchVoices, resetVoiceCache, speakFrench, ttsAvailable } from "@/lib/speak";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/settings";

export function VoiceSettings() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  useEffect(() => {
    setSettings(loadSettings());
    const load = () => setVoices(listFrenchVoices());
    load();
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) return;
    // addEventListener (not onvoiceschanged=) so we don't clobber other handlers.
    synth.addEventListener("voiceschanged", load);
    synth.getVoices(); // nudge some browsers to populate the list
    return () => synth.removeEventListener("voiceschanged", load);
  }, []);

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    resetVoiceCache();
  }

  if (!ttsAvailable()) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-semibold">🔊 Voice &amp; pronunciation</span>
        <span className="text-sm text-zinc-400">{open ? "▲ Hide" : "▼ Adjust"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-zinc-500">
            All French audio is read by a female voice. Pick the one that sounds
            most natural on your device, and slow it down while you&apos;re a beginner.
          </p>

          <label className="block">
            <span className="text-sm font-medium">French voice</span>
            <select
              value={settings.voiceName}
              onChange={(e) => update({ voiceName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">Auto (best female voice)</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            {voices.length === 0 && (
              <span className="mt-1 block text-xs text-amber-600">
                No French voice detected yet — your OS may need a French language
                pack installed for the best quality.
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Speaking speed: {Math.round(settings.rate * 100)}%
            </span>
            <input
              type="range"
              min={0.5}
              max={1.1}
              step={0.05}
              value={settings.rate}
              onChange={(e) => update({ rate: Number(e.target.value) })}
              className="mt-1 w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>🐢 Slow (learning)</span>
              <span>Natural 🗣️</span>
            </div>
          </label>

          <button
            onClick={() =>
              speakFrench("Bonjour ! Je suis votre professeur de français. Commençons !")
            }
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            ▶ Test the voice
          </button>
        </div>
      )}
    </div>
  );
}
