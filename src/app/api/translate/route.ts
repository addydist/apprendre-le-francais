import { NextResponse } from "next/server";
import { credsFromHeaders, generateJson, isRateLimit, llmAvailable } from "@/lib/llm";
import { freeTranslate } from "@/lib/translateFree";

// Translate English -> French and give a word-by-word breakdown with meanings.
// The Hindi (Devanagari) PRONUNCIATION is generated separately on the client by
// an offline rules engine (src/lib/frenchPhonetics.ts) — the LLM is no longer
// asked for it, which keeps pronunciation consistent and saves tokens.

interface TranslateBody {
  text: string;
}

interface TranslateResult {
  french: string;
  words: { french: string; meaning: string }[];
}

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    french: {
      type: "string",
      description: "Natural French translation of the English input.",
    },
    words: {
      type: "array",
      description: "Word-by-word breakdown of the French sentence.",
      items: {
        type: "object",
        properties: {
          french: { type: "string", description: "The French word." },
          meaning: {
            type: "string",
            description: "Short English meaning of this French word.",
          },
        },
        required: ["french", "meaning"],
        additionalProperties: false,
      },
    },
  },
  required: ["french", "words"],
  additionalProperties: false,
} as const;

export async function POST(req: Request) {
  let body: TranslateBody;
  try {
    body = (await req.json()) as TranslateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.text?.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const creds = credsFromHeaders(req);

  // Set TRANSLATE_BACKEND=free to always use the keyless backend (no LLM),
  // even if an AI key is configured (e.g. you keep a key for writing grading
  // but want translation to stay off the LLM).
  const forceFree = process.env.TRANSLATE_BACKEND === "free";

  // No LLM key (or forced free)? Use the keyless free-translation backend so
  // the tool still works (MyMemory by default, or LibreTranslate if
  // configured). The Hindi pronunciation is added client-side by the offline
  // engine either way.
  if (forceFree || !llmAvailable(creds)) {
    try {
      const free = await freeTranslate(body.text);
      return NextResponse.json(free);
    } catch (err) {
      console.error("Free translation failed:", err);
      return NextResponse.json(
        { error: "Free translation service is unavailable right now. Please try again, or add an AI key for higher quality." },
        { status: 502 },
      );
    }
  }

  const system = `You are a French teacher helping English speakers.

For the user's English text:
1. Translate it into natural, idiomatic French.
2. Break it down word by word. For each French word give the word itself and a short English meaning.

Keep meanings concise. Split contractions/elisions sensibly (e.g. « je », « m'appelle »).`;

  try {
    const result = await generateJson<TranslateResult>(
      {
        system,
        user: `English: "${body.text}"`,
        schema: RESULT_SCHEMA,
        maxTokens: 2000,
      },
      creds,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Translation failed:", err);
    if (isRateLimit(err)) {
      return NextResponse.json(
        {
          error:
            "Rate limit reached on the free tier. Wait a minute and retry, switch to Claude, or add billing to your Google key for higher limits.",
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 },
    );
  }
}
