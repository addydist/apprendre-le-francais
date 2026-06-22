// Keyless English -> French translation, so the Pronounce tool works with NO
// LLM and NO API key. Two backends:
//
//   - MyMemory (default): free, no key, no setup. Limited words/day per IP.
//     Set MYMEMORY_EMAIL for a higher anonymous limit.
//   - LibreTranslate (optional): set LIBRETRANSLATE_URL to your own instance
//     (e.g. `docker run -p 5000:5000 libretranslate/libretranslate`) for
//     unlimited, no-rate-limit translation. Optional LIBRETRANSLATE_API_KEY.
//
// Word meanings are produced by reverse-translating each French word (FR->EN).
// The Hindi pronunciation is added separately on the client by the offline
// engine (src/lib/frenchPhonetics.ts).

export interface FreeTranslateResult {
  french: string;
  words: { french: string; meaning: string }[];
  source: "mymemory" | "libretranslate";
}

const useLibre = () => !!process.env.LIBRETRANSLATE_URL;

async function myMemory(text: string, langpair: string): Promise<string> {
  const email = process.env.MYMEMORY_EMAIL
    ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}`
    : "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}${email}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const json = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  const t = json?.responseData?.translatedText;
  if (!t) throw new Error("MyMemory: no translation");
  return t;
}

async function libreTranslate(text: string, source: string, target: string): Promise<string> {
  const base = process.env.LIBRETRANSLATE_URL!.replace(/\/$/, "");
  const res = await fetch(`${base}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: "text",
      ...(process.env.LIBRETRANSLATE_API_KEY
        ? { api_key: process.env.LIBRETRANSLATE_API_KEY }
        : {}),
    }),
  });
  if (!res.ok) throw new Error(`LibreTranslate ${res.status}`);
  const json = (await res.json()) as { translatedText?: string };
  if (!json?.translatedText) throw new Error("LibreTranslate: no translation");
  return json.translatedText;
}

function enToFr(text: string): Promise<string> {
  return useLibre() ? libreTranslate(text, "en", "fr") : myMemory(text, "en|fr");
}

function frToEn(text: string): Promise<string> {
  return useLibre() ? libreTranslate(text, "fr", "en") : myMemory(text, "fr|en");
}

function tokenize(sentence: string): string[] {
  return sentence
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-zÀ-ÿ'’-]+|[^A-Za-zÀ-ÿ'’-]+$/g, ""))
    .filter(Boolean);
}

export async function freeTranslate(text: string): Promise<FreeTranslateResult> {
  const french = await enToFr(text);

  // Word meanings: reverse-translate each unique word (capped to limit calls).
  const tokens = tokenize(french);
  const unique = [...new Set(tokens)].slice(0, 12);
  const meanings = new Map<string, string>();
  await Promise.all(
    unique.map(async (w) => {
      try {
        meanings.set(w, await frToEn(w));
      } catch {
        meanings.set(w, "");
      }
    }),
  );

  const seen = new Set<string>();
  const words = tokens
    .filter((w) => (seen.has(w) ? false : (seen.add(w), true)))
    .map((w) => ({ french: w, meaning: meanings.get(w) ?? "" }));

  return { french, words, source: useLibre() ? "libretranslate" : "mymemory" };
}
