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

export type Provider = "anthropic" | "gemini";

// Optional per-request credentials supplied by the user (from request headers).
export interface Creds {
  provider?: Provider;
  apiKey?: string;
}

interface Resolved {
  provider: Provider;
  apiKey: string;
}

// Work out which provider + key to use for this request.
function resolve(creds?: Creds): Resolved | null {
  // 1. User-supplied key wins (BYOK).
  if (creds?.apiKey && (creds.provider === "anthropic" || creds.provider === "gemini")) {
    return { provider: creds.provider, apiKey: creds.apiKey };
  }
  // 2. Server env fallback. Explicit LLM_PROVIDER wins if its key is present.
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "gemini" && process.env.GEMINI_API_KEY) {
    return { provider: "gemini", apiKey: process.env.GEMINI_API_KEY };
  }
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY };
  }
  if (process.env.GEMINI_API_KEY) {
    return { provider: "gemini", apiKey: process.env.GEMINI_API_KEY };
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
  return r.provider === "anthropic"
    ? anthropicJson<T>(args, r.apiKey)
    : geminiJson<T>(args, r.apiKey);
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

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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
}

// Parse BYOK credentials out of a request's headers (set by the browser).
export function credsFromHeaders(req: Request): Creds {
  const provider = req.headers.get("x-llm-provider");
  const apiKey = req.headers.get("x-llm-key") || undefined;
  return {
    provider: provider === "anthropic" || provider === "gemini" ? provider : undefined,
    apiKey,
  };
}
