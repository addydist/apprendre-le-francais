"use client";

import { useEffect, useState } from "react";
import { hasFrenchVoice, ttsAvailable } from "@/lib/speak";

// Shows a banner only when text-to-speech works but NO French voice is
// installed — the situation where French gets read with an English accent.
// Gives OS-specific instructions for installing a French voice.
export function FrenchVoiceWarning() {
  // null = still checking; true/false = decided.
  const [hasFr, setHasFr] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ttsAvailable()) {
      setHasFr(true); // nothing to warn about if TTS isn't available at all
      return;
    }
    const check = () => setHasFr(hasFrenchVoice());
    check();
    const synth = window.speechSynthesis;
    synth.addEventListener("voiceschanged", check);
    synth.getVoices();
    // Voices can arrive a moment after mount on some browsers.
    const t = setTimeout(check, 1200);
    return () => {
      synth.removeEventListener("voiceschanged", check);
      clearTimeout(t);
    };
  }, []);

  if (hasFr !== false) return null;

  return (
    <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
      <p className="font-semibold">⚠️ No French voice installed on this device</p>
      <p className="mt-1">
        Your browser is reading French with an English voice (so the accent sounds
        wrong). Install a French voice once, then restart your browser:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Windows:</strong> Settings → Time &amp; Language → Language &amp; region
          → <em>Add a language</em> → <em>Français (France)</em>, and tick{" "}
          <em>Speech</em> when choosing features.
        </li>
        <li>
          <strong>macOS / iOS:</strong> System Settings → Accessibility → Spoken
          Content → System Voice → <em>Manage Voices</em> → download a French voice
          (e.g. Amélie / Audrey).
        </li>
        <li>
          <strong>Android:</strong> Settings → Accessibility → Text-to-speech →
          install the French language data for your TTS engine.
        </li>
      </ul>
      <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
        Tip: Chrome usually ships a built-in &ldquo;Google français&rdquo; voice — try
        Chrome if you can&apos;t install a system voice.
      </p>
    </div>
  );
}
