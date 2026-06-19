// Provider-agnostic LLM helper. The app can grade writing and translate using
// EITHER Anthropic (Claude) OR Google Gemini.
//
// Credentials are resolved per request in this order:
//   1. User-supplied key (BYOK) — passed in from the browser via request headers
//   2. Server env vars (for the app owner / local dev):
//        ANTHROPIC_API_KEY / GEMINI_API_KEY  (+ optional LLM_PROVIDER)
//
// This means the app can be open to everyone with NO accounts: each user brings
// their own key, stored only in their browser. See src/lib/apiKeys.ts.

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type Provider = "anthropic" | "gemini" | "openai";

// Thrown when every available model/quota is rate-limited, so callers can show
// a clear "try again later" message instead of a generic failure.
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function isRateLimit(err: unknown): boolean {
  if (err instanceof RateLimitError) return true;
  const e = err as { status?: number; code?: number; message?: string } | null;
  if (!e) return false;
  if (e.status === 429 || e.code === 429) return true;
  const m = e.message ?? "";
  return m.includes("429") || m.includes("RESOURCE_EXHAUSTED") || m.includes("quota");
}

// Optional per-request credentials supplied by the user (from request headers).
export interface Creds {
  provider?: Provider;
  apiKey?: string;
}

interface Resolved {
  provider: Provider;
  apiKey: string;
}

const PROVIDERS: Provider[] = ["anthropic", "gemini", "openai"];

function isProvider(p: unknown): p is Provider {
  return typeof p === "string" && (PROVIDERS as string[]).includes(p);
}

const ENV_KEY: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
};

// Work out which provider + key to use for this request.
function resolve(creds?: Creds): Resolved | null {
  // 1. User-supplied key wins (BYOK).
  if (creds?.apiKey && isProvider(creds.provider)) {
    return { provider: creds.provider, apiKey: creds.apiKey };
  }
  // 2. Server env fallback. Explicit LLM_PROVIDER wins if its key is present.
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (isProvider(explicit) && process.env[ENV_KEY[explicit]]) {
    return { provider: explicit, apiKey: process.env[ENV_KEY[explicit]] as string };
  }
  // Otherwise use whichever key is configured (in this order).
  for (const provider of PROVIDERS) {
    const key = process.env[ENV_KEY[provider]];
    if (key) return { provider, apiKey: key };
  }
  return null;
}

export function activeProvider(creds?: Creds): Provider | null {
  return resolve(creds)?.provider ?? null;
}

export function llmAvailable(creds?: Creds): boolean {
  return resolve(creds) !== null;
}

export interface GenerateJsonArgs {
  system: string;
  user: string;
  // JSON Schema describing the expected output object.
  schema: Record<string, unknown>;
  maxTokens?: number;
}

export async function generateJson<T>(args: GenerateJsonArgs, creds?: Creds): Promise<T> {
  const r = resolve(creds);
  if (!r) throw new Error("No LLM provider configured");
  switch (r.provider) {
    case "anthropic":
      return anthropicJson<T>(args, r.apiKey);
    case "gemini":
      return geminiJson<T>(args, r.apiKey);
    case "openai":
      return openaiJson<T>(args, r.apiKey);
  }
}

// --- Anthropic (Claude) --------------------------------------------------

async function anthropicJson<T>(
  { system, user, schema, maxTokens }: GenerateJsonArgs,
  apiKey: string,
): Promise<T> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
    max_tokens: maxTokens ?? 2000,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema } },
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic: no text content in response");
  }
  return JSON.parse(textBlock.text) as T;
}

// --- Google Gemini -------------------------------------------------------

// Gemini occasionally wraps JSON in ```json fences despite the JSON mime type.
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

// The Gemini free tier limits requests PER MODEL per day, so trying several
// models in turn multiplies the daily allowance: each one has its own quota.
// Order: cheapest / highest-limit first. Override with GEMINI_MODEL (single) or
// GEMINI_MODELS (comma-separated list).
function geminiModels(): string[] {
  if (process.env.GEMINI_MODEL) return [process.env.GEMINI_MODEL];
  if (process.env.GEMINI_MODELS) {
    return process.env.GEMINI_MODELS.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];
}

async function geminiJson<T>(
  { system, user, schema, maxTokens }: GenerateJsonArgs,
  apiKey: string,
): Promise<T> {
  const ai = new GoogleGenAI({ apiKey });
  // Gemini's responseSchema uses a different (OpenAPI subset) format than JSON
  // Schema, so instead we ask for JSON output and embed the schema in the
  // instruction — robust across SDK versions.
  const instruction = `${system}

Respond with ONLY valid, minified JSON that matches this JSON schema. Do not include markdown, code fences, or any commentary.
JSON schema:
${JSON.stringify(schema)}`;

  const models = geminiModels();
  let lastErr: unknown;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: instruction,
          responseMimeType: "application/json",
          maxOutputTokens: maxTokens ?? 2000,
        },
      });
      const text = response.text ?? "";
      if (!text) throw new Error("Gemini: empty response");
      return JSON.parse(stripFences(text)) as T;
    } catch (err) {
      lastErr = err;
      // On a quota hit, try the next model (separate quota bucket).
      if (isRateLimit(err)) continue;
      throw err;
    }
  }

  // Every model was rate-limited.
  if (isRateLimit(lastErr)) {
    throw new RateLimitError(
      "All configured Gemini models hit their free-tier quota. Try again later, switch provider, or enable billing.",
    );
  }
  throw lastErr;
}

// --- OpenAI --------------------------------------------------------------

async function openaiJson<T>(
  { system, user, schema, maxTokens }: GenerateJsonArgs,
  apiKey: string,
): Promise<T> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    max_tokens: maxTokens ?? 2000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "result", schema, strict: true },
    },
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI: empty response");
  return JSON.parse(content) as T;
}

// Parse BYOK credentials out of a request's headers (set by the browser).
export function credsFromHeaders(req: Request): Creds {
  const provider = req.headers.get("x-llm-provider");
  const apiKey = req.headers.get("x-llm-key") || undefined;
  return {
    provider: isProvider(provider) ? provider : undefined,
    apiKey,
  };
}
