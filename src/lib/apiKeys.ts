// Bring-Your-Own-Key (BYOK) store. The user's API key lives ONLY in their
// browser's localStorage — never on a server, never in a database. No accounts,
// no login. Each browser remembers its own key.
//
// The key is sent to our own API routes (as headers) only so the server can
// proxy the call to Anthropic/Gemini (Anthropic blocks direct browser calls).
// Our routes never store or log it.

"use client";

export type Provider = "anthropic" | "gemini" | "openai";

export interface ApiCreds {
  provider: Provider;
  key: string;
}

const STORAGE_KEY = "apprendre.apikey.v1";

export function loadCreds(): ApiCreds | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApiCreds;
    const ok = parsed.provider === "anthropic" || parsed.provider === "gemini" || parsed.provider === "openai";
    if (!parsed.key || !ok) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCreds(creds: ApiCreds): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function clearCreds(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasCreds(): boolean {
  return loadCreds() !== null;
}

// Headers to attach to fetch() calls so the server can use the user's key.
export function authHeaders(): Record<string, string> {
  const c = loadCreds();
  if (!c?.key) return {};
  return { "x-llm-provider": c.provider, "x-llm-key": c.key };
}
