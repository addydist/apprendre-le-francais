"use client";

import { useEffect, useState } from "react";
import {
  clearCreds,
  loadCreds,
  saveCreds,
  type Provider,
} from "@/lib/apiKeys";

const PROVIDER_INFO: Record<
  Provider,
  { label: string; placeholder: string; getKeyUrl: string }
> = {
  anthropic: {
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-...",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    label: "Google Gemini",
    placeholder: "AIza... / your Gemini key",
    getKeyUrl: "https://aistudio.google.com/apikey",
  },
};

export function ApiKeySettings({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [provider, setProvider] = useState<Provider>("gemini");
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const c = loadCreds();
    if (c) {
      setProvider(c.provider);
      setHasKey(true);
    }
  }, []);

  function save() {
    if (!key.trim()) return;
    saveCreds({ provider, key: key.trim() });
    setHasKey(true);
    setSaved(true);
    setKey(""); // don't keep the raw key in component state / inputs
    setTimeout(() => setSaved(false), 2500);
  }

  function remove() {
    clearCreds();
    setHasKey(false);
    setKey("");
  }

  const info = PROVIDER_INFO[provider];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-semibold">
          🔑 AI key{" "}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              hasKey
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
            }`}
          >
            {hasKey ? "connected" : "not set"}
          </span>
        </span>
        <span className="text-sm text-zinc-400">{open ? "▲ Hide" : "▼ Set up"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-zinc-500">
            The AI features (writing feedback &amp; the Pronounce tool) run on your own
            API key. Paste a key once and it&apos;s saved <strong>only in this browser</strong> —
            no account, no login, and it&apos;s never stored on our servers.
          </p>

          {/* Provider toggle */}
          <div className="flex gap-2">
            {(Object.keys(PROVIDER_INFO) as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  provider === p
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {PROVIDER_INFO[p].label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-sm font-medium">API key</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder={hasKey ? "•••••••• (saved) — paste a new key to replace" : info.placeholder}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <a
              href={info.getKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-indigo-500 underline"
            >
              Get a {info.label} key ↗
            </a>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={!key.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              Save key
            </button>
            {hasKey && (
              <button
                onClick={remove}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Remove
              </button>
            )}
            {saved && <span className="text-sm text-emerald-600">✓ Saved</span>}
          </div>

          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            🔒 Security tip: create a key with a low monthly spending limit. It&apos;s
            stored in your browser and sent through this app only to make your own
            requests — but a capped key keeps you safe on any shared computer. Use
            &ldquo;Remove&rdquo; when you&apos;re on a device that isn&apos;t yours.
          </p>
        </div>
      )}
    </div>
  );
}
