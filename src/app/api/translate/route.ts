import { NextResponse } from "next/server";
import { credsFromHeaders, generateJson, llmAvailable } from "@/lib/llm";

// Translate English -> French and produce a Hindi (Devanagari) phonetic
// pronunciation guide, word by word, so a Hindi/English speaker can pronounce
// the French correctly. Uses the configured LLM provider (Claude or Gemini).

interface TranslateBody {
  text: string;
}

interface TranslateResult {
  french: string;
  pronunciationHi: string;
  words: { french: string; hindi: string; meaning: string }[];
}

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    french: {
      type: "string",
      description: "Natural French translation of the English input.",
    },
    pronunciationHi: {
      type: "string",
      description:
        "Devanagari (Hindi script) phonetic transcription of the whole French sentence, as it should be spoken.",
    },
    words: {
      type: "array",
      description: "Word-by-word breakdown of the French sentence.",
      items: {
        type: "object",
        properties: {
          french: { type: "string", description: "The French word." },
          hindi: {
            type: "string",
            description:
              "Devanagari phonetic spelling of how this French word sounds (NOT a Hindi translation of meaning).",
          },
          meaning: {
            type: "string",
            description: "Short English meaning of this French word.",
          },
        },
        required: ["french", "hindi", "meaning"],
        additionalProperties: false,
      },
    },
  },
  required: ["french", "pronunciationHi", "words"],
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
  if (!llmAvailable(creds)) {
    // Can't translate or transliterate reliably offline — tell the UI.
    return NextResponse.json({ unavailable: true });
  }

  const system = `You are a French teacher who helps native Hindi and English speakers pronounce French correctly.

For the user's English text:
1. Translate it into natural, idiomatic French.
2. Give a Devanagari (Hindi script) phonetic transcription of the WHOLE French sentence — write how it actually SOUNDS when spoken by a French native, not a Hindi translation of the meaning. Respect French sounds (nasal vowels, silent final consonants, the French "r", the "u"/"ü" sound, liaisons).
3. Break it down word by word. For each French word give: the word itself, its Devanagari phonetic spelling (how it sounds), and a short English meaning.

Important: the "hindi" field is always a PRONUNCIATION guide in Devanagari, never a Hindi-meaning translation. Keep meanings concise.`;

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
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 },
    );
  }
}
