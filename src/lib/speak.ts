// French text-to-speech via the browser's built-in Web Speech API.
// Prefers a FEMALE French voice (a "lady" reading the French), and respects the
// user's saved voice + speed settings. No external service; works offline once
// the OS voices are loaded.
//
// IMPORTANT: browsers load the voice list asynchronously. If we speak before
// the list is ready, no French voice is found and the browser reads French with
// an English voice/accent. So every speak call waits for voices first.

"use client";

import { loadSettings } from "./settings";

// Known female French voice names across Windows / macOS / iOS / Chrome.
const FEMALE_FR_NAMES = [
  "amélie", "amelie", "audrey", "aurelie", "aurélie", "marie", "virginie",
  "julie", "hortense", "denise", "léa", "lea", "céline", "celine", "chantal",
  "sandrine", "google français", "google french", "eloise", "éloïse",
];

// Known male French voice names — used to avoid picking a man's voice.
const MALE_FR_NAMES = ["thomas", "paul", "nicolas", "daniel", "henri", "claude", "guillaume", "mathieu"];

let cachedVoice: SpeechSynthesisVoice | null = null;

function isFrench(v: SpeechSynthesisVoice): boolean {
  return v.lang === "fr-FR" || v.lang?.toLowerCase().startsWith("fr");
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not loaded yet

  const french = voices.filter(isFrench);
  if (french.length === 0) return null;

  // 1. Honour an explicit user choice if it's still available.
  const wanted = loadSettings().voiceName;
  if (wanted) {
    const match = french.find((v) => v.name === wanted);
    if (match) return match;
  }

  const lower = (v: SpeechSynthesisVoice) => v.name.toLowerCase();

  // 2. Explicit female name match.
  const female = french.find((v) => FEMALE_FR_NAMES.some((n) => lower(v).includes(n)));
  if (female) return female;

  // 3. Anything that isn't a known male voice.
  const notMale = french.find((v) => !MALE_FR_NAMES.some((n) => lower(v).includes(n)));
  if (notMale) return notMale;

  // 4. Fall back to the first French voice.
  return french[0];
}

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  cachedVoice = pickVoice();
  return cachedVoice;
}

// Resolve once the browser's voice list is populated (it may already be).
function whenVoicesReady(cb: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;

  if (synth.getVoices().length > 0) {
    cb();
    return;
  }

  // Trigger loading and wait for the list to arrive (with a timeout fallback so
  // we still attempt to speak even if the event never fires).
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    synth.removeEventListener("voiceschanged", onChange);
    cachedVoice = null; // recompute now that voices exist
    cb();
  };
  const onChange = () => run();
  synth.addEventListener("voiceschanged", onChange);
  // Some browsers only populate the list after this call.
  synth.getVoices();
  setTimeout(run, 1000);
}

function doSpeak(text: string, rate?: number): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = getVoice();
  if (voice) utter.voice = voice;
  utter.lang = "fr-FR"; // always French, even if we had to fall back
  utter.rate = rate ?? loadSettings().rate;
  utter.pitch = 1.05; // a touch higher reads as a warmer, feminine tone
  synth.speak(utter);
}

export function speakFrench(text: string, rate?: number): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  whenVoicesReady(() => doSpeak(text, rate));
}

export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

// True only when an actual French voice is installed on this device.
export function hasFrenchVoice(): boolean {
  return listFrenchVoices().length > 0;
}

// List available French voices for the settings picker.
export function listFrenchVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter(isFrench);
}

// Force the cached voice to refresh after the user changes settings.
export function resetVoiceCache(): void {
  cachedVoice = null;
}
