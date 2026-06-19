// Small user-settings store (voice + speed) persisted in localStorage.
"use client";

const KEY = "apprendre.settings.v1";

export interface AppSettings {
  // Preferred French voice name (from the browser's voice list). Empty = auto.
  voiceName: string;
  // Speech rate, 0.5 (slow) .. 1.1 (natural). Beginners benefit from slower.
  rate: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  voiceName: "",
  rate: 0.9,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: AppSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}
