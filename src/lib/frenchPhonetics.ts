// Offline French → Devanagari (Hindi lipi) pronunciation hint.
//
// This is a rules-based grapheme-to-phoneme (G2P) approximation, NOT a perfect
// phonetic transcription. French orthography is regular enough that a rule
// engine gives a useful "how do I say this" crutch for a Hindi/English speaker,
// with zero API calls, instantly and offline.
//
// Limitations (by design — it's a hint):
//  - French has sounds Devanagari lacks (nasal vowels, the « u »/« ü », « eu »,
//    the uvular « r »); these are approximated.
//  - Liaisons between words and a few irregular words won't be perfect.
//
// Pipeline:  word → strip silent endings → scan to phoneme symbols → render
//            phonemes to Devanagari (matras + virama for clusters).

// --- Phoneme → Devanagari render tables -----------------------------------

// Consonant symbols → their Devanagari base letter (carrying inherent "a").
const CONS: Record<string, string> = {
  p: "प", b: "ब", t: "त", d: "द", k: "क", g: "ग",
  f: "फ़", v: "व", s: "स", z: "ज़", S: "श", Z: "झ़",
  m: "म", n: "न", l: "ल", r: "र", w: "व", y: "य",
};

// Vowel symbols → independent form (i) and matra (m, attaches to a consonant).
const VOW: Record<string, { i: string; m: string }> = {
  a: { i: "अ", m: "ा" },
  e: { i: "ए", m: "े" },
  i: { i: "इ", m: "ी" },
  o: { i: "ओ", m: "ो" },
  u: { i: "उ", m: "ू" },
  q: { i: "अ", m: "" }, // « e »/« eu »/« œ » schwa-ish — keep inherent "a"
  A: { i: "आं", m: "ां" }, // nasal « an/en » (ɑ̃)
  O: { i: "ओं", m: "ों" }, // nasal « on » (ɔ̃)
  E: { i: "एं", m: "ें" }, // nasal « in/un/ain » (ɛ̃)
};

function isVowelSym(s: string): boolean {
  return s in VOW;
}

// Plain (non-nasal) vowels — used to decide « s » voicing (rose = roze).
const PLAIN_VOWELS = new Set(["a", "e", "i", "o", "u", "q"]);

function isVowelChar(c: string | undefined): boolean {
  return !!c && /[aeiouyàâäéèêëîïôöûùüœ]/.test(c);
}

function isFront(c: string | undefined): boolean {
  return !!c && /[eéèêiîy]/.test(c);
}

// --- Render phoneme symbols → Devanagari ----------------------------------

function render(symbols: string[]): string {
  let out = "";
  let pend: string[] = []; // consonant bases awaiting a vowel

  const flush = (matra?: string) => {
    if (pend.length === 0) return;
    for (let j = 0; j < pend.length - 1; j++) out += pend[j] + "्"; // virama
    const last = pend[pend.length - 1];
    // matra undefined → word-final consonant: suppress the inherent vowel.
    out += matra === undefined ? last + "्" : last + matra;
    pend = [];
  };

  for (const s of symbols) {
    if (s in CONS) {
      pend.push(CONS[s]);
    } else if (isVowelSym(s)) {
      const v = VOW[s];
      if (pend.length === 0) out += v.i;
      else flush(v.m);
    }
  }
  flush(); // trailing consonants
  return out;
}

// --- Strip silent endings before scanning ---------------------------------

function hasVowel(s: string): boolean {
  return /[aeiouyàâäéèêëîïôöûùüœ]/.test(s);
}

function stripSilent(w: string): string {
  let s = w;
  // « -er » infinitive/agent ending → « é » sound, the r is silent
  // (manger → mangé, parler → parlé). Guarded to avoid tiny words like « mer ».
  if (/er$/.test(s) && s.length > 3) s = s.slice(0, -2) + "é";
  // Silent final -e (not é/è) — but only if a vowel still remains (keep « je »).
  if (/(?<=[a-zà-ÿ])e$/.test(s)) {
    const t = s.slice(0, -1);
    if (hasVowel(t)) s = t;
  }
  // Silent final consonant (French keeps c, r, f, l) — only if a vowel remains.
  if (/[sdtxzp]$/.test(s)) {
    const t = s.slice(0, -1);
    if (hasVowel(t)) s = t;
  }
  return s;
}

// --- Read a vowel nucleus at position i -----------------------------------

interface Nucleus {
  syms: string[];
  nasal: string | null; // symbol to use if a nasal coda (n/m) follows
  len: number;
}

function readVowel(s: string, i: number): Nucleus | null {
  const c3 = s.slice(i, i + 3);
  const c2 = s.slice(i, i + 2);
  const c1 = s[i];

  if (c3 === "eau") return { syms: ["o"], nasal: "O", len: 3 };
  if (c3 === "oeu") return { syms: ["q"], nasal: "A", len: 3 };

  if (c2 === "œu" || c2 === "eu") return { syms: ["q"], nasal: "A", len: 2 };
  if (c2 === "ou") return { syms: ["u"], nasal: null, len: 2 };
  if (c2 === "au") return { syms: ["o"], nasal: "O", len: 2 };
  if (c2 === "ai" || c2 === "ei") return { syms: ["e"], nasal: "E", len: 2 };
  if (c2 === "oi") return { syms: ["w", "a"], nasal: null, len: 2 };

  switch (c1) {
    case "a": case "à": case "â": return { syms: ["a"], nasal: "A", len: 1 };
    case "é": return { syms: ["e"], nasal: "E", len: 1 };
    case "è": case "ê": case "ë": return { syms: ["e"], nasal: "E", len: 1 };
    case "e": return { syms: ["q"], nasal: "A", len: 1 };
    case "i": case "î": case "ï": return { syms: ["i"], nasal: "E", len: 1 };
    case "o": case "ô": return { syms: ["o"], nasal: "O", len: 1 };
    case "u": case "û": case "ù": case "ü": return { syms: ["u"], nasal: "E", len: 1 };
    case "œ": return { syms: ["q"], nasal: "A", len: 1 };
    case "y": return { syms: ["i"], nasal: "E", len: 1 };
    default: return null;
  }
}

// --- Scan a single word into phoneme symbols ------------------------------

function scan(word: string): string[] {
  const s = word;
  const sym: string[] = [];
  let i = 0;

  const lastSym = () => sym[sym.length - 1];

  while (i < s.length) {
    const c = s[i];
    const c2 = s.slice(i, i + 2);
    const c3 = s.slice(i, i + 3);

    // Consonant digraphs first.
    if (c2 === "ch") { sym.push("S"); i += 2; continue; }
    if (c2 === "gn") { sym.push("n", "y"); i += 2; continue; }
    if (c2 === "ph") { sym.push("f"); i += 2; continue; }
    if (c2 === "th") { sym.push("t"); i += 2; continue; }
    if (c2 === "qu") { sym.push("k"); i += 2; continue; }
    if (c2 === "gu" && isFront(s[i + 2])) { sym.push("g"); i += 2; continue; }
    // « -ill- » as in « fille » → semivowel y.
    if (c3 === "ill") { sym.push("i", "y"); i += 3; continue; }
    // « oin » nasal (wɛ̃).
    if (c3 === "oin") { sym.push("w", "E"); i += 3; continue; }
    // « oui » → wi.
    if (c3 === "oui") { sym.push("w", "i"); i += 3; continue; }

    // Vowel nucleus (+ optional nasal coda).
    if (isVowelChar(c)) {
      const nuc = readVowel(s, i);
      if (nuc) {
        i += nuc.len;
        const coda = s[i];
        const after = s[i + 1];
        const nasalCtx =
          (coda === "n" || coda === "m") &&
          nuc.nasal !== null &&
          (after === undefined || (!isVowelChar(after) && after !== "n" && after !== "m"));
        if (nasalCtx) {
          sym.push(nuc.nasal as string);
          i += 1; // consume the n/m
        } else {
          sym.push(...nuc.syms);
        }
        continue;
      }
    }

    // Single consonants (collapse doubles).
    let pushed: string[] | null = null;
    switch (c) {
      case "c": pushed = [isFront(s[i + 1]) ? "s" : "k"]; break;
      case "ç": pushed = ["s"]; break;
      case "g": pushed = [isFront(s[i + 1]) ? "Z" : "g"]; break;
      case "j": pushed = ["Z"]; break;
      case "s":
        // « s » between two vowels sounds like « z » (rose, oiseau).
        pushed = [PLAIN_VOWELS.has(lastSym() ?? "") && isVowelChar(s[i + 1]) ? "z" : "s"];
        break;
      case "x": pushed = ["k", "s"]; break;
      case "h": pushed = []; break; // silent
      case "p": case "b": case "t": case "d": case "k": case "f":
      case "v": case "z": case "m": case "n": case "l": case "r":
      case "w": case "y":
        pushed = [c === "w" ? "w" : c];
        break;
      default:
        pushed = []; // unknown char — skip
    }
    if (pushed) sym.push(...pushed);
    // collapse a doubled consonant letter (e.g. « ll », « tt »)
    i += s[i + 1] === c ? 2 : 1;
  }

  return sym;
}

// --- Public API -----------------------------------------------------------

export function frenchWordToDevanagari(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-zà-ÿœ'’-]/g, "");
  if (!clean) return "";
  // Handle elision like « l'eau », « j'ai » — pronounce each piece.
  const parts = clean.split(/['’-]/).filter(Boolean);
  return parts.map((p) => render(scan(stripSilent(p)))).join("");
}

// Convert a whole French phrase, word by word (keeps spacing).
export function frenchToDevanagari(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const lead = tok.match(/^[«"'(]+/)?.[0] ?? "";
      const tail = tok.match(/[.,!?;:»")]+$/)?.[0] ?? "";
      const core = tok.slice(lead.length, tok.length - tail.length);
      return lead + frenchWordToDevanagari(core) + tail;
    })
    .join(" ");
}
