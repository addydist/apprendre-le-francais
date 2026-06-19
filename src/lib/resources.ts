// Hand-curated web resources for cracking the TEF / TCF exams.
// These are well-known, established French-learning resources (no live web
// search) — grouped so a learner knows exactly what each one is for.

export interface Resource {
  name: string;
  url: string;
  description: string;
  free: "free" | "freemium" | "paid";
  bestFor: string; // which CEFR levels / exam skills it helps most
}

export interface ResourceCategory {
  id: string;
  title: string;
  icon: string;
  intro: string;
  resources: Resource[];
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: "official",
    title: "Official exam info & sample papers",
    icon: "🏛️",
    intro:
      "Start here. Read the exact format, scoring, and try real past papers so there are no surprises on exam day.",
    resources: [
      {
        name: "France Éducation International — TCF",
        url: "https://www.france-education-international.fr/test/tcf",
        description:
          "The official body behind the TCF. Exam structure, dates, and official sample questions for every section.",
        free: "free",
        bestFor: "Understanding TCF format (all levels)",
      },
      {
        name: "Le français des affaires — TEF",
        url: "https://www.lefrancaisdesaffaires.fr/tests-diplomes/test-evaluation-francais-tef/",
        description:
          "Official TEF site (CCI Paris). Section breakdown, scoring scale, and sample materials for the TEF Canada / TEF IRN.",
        free: "free",
        bestFor: "Understanding TEF format (all levels)",
      },
      {
        name: "RFI — Préparer le TCF",
        url: "https://francaisfacile.rfi.fr/fr/test-tcf/",
        description:
          "Free TCF practice activities built around real audio and articles, with answer keys. Excellent listening + reading drills.",
        free: "free",
        bestFor: "TCF listening & reading (A2–B2)",
      },
    ],
  },
  {
    id: "listening",
    title: "Listening (compréhension orale)",
    icon: "🎧",
    intro:
      "The hardest section for most candidates. Listen daily — even passively — to train your ear to real French speed and accents.",
    resources: [
      {
        name: "RFI — Journal en français facile",
        url: "https://francaisfacile.rfi.fr/fr/podcasts/journal-en-fran%C3%A7ais-facile/",
        description:
          "A 10-minute daily news bulletin in slow, clear French with full transcripts. The single best free listening resource for exam prep.",
        free: "free",
        bestFor: "Listening + vocabulary (A2–B2)",
      },
      {
        name: "InnerFrench (podcast)",
        url: "https://innerfrench.com/",
        description:
          "Intermediate podcast spoken entirely in clear French about interesting topics. Perfect for the B1→B2 jump.",
        free: "freemium",
        bestFor: "Listening fluency (B1–B2)",
      },
      {
        name: "Coffee Break French",
        url: "https://coffeebreaklanguages.com/coffeebreakfrench/",
        description:
          "Structured audio lessons that build from absolute beginner upward. Great for commutes.",
        free: "freemium",
        bestFor: "Guided listening (A1–B1)",
      },
      {
        name: "Easy French (YouTube)",
        url: "https://www.youtube.com/@EasyFrench",
        description:
          "Street interviews with real people, dual French/English subtitles. Trains you for the unscripted speech the exam uses.",
        free: "free",
        bestFor: "Authentic listening (A2–B2)",
      },
    ],
  },
  {
    id: "grammar",
    title: "Grammar & structure",
    icon: "📐",
    intro:
      "B2 examiners reward correct, varied structures (subjonctif, conditionnel, connecteurs logiques). Use these to drill the rules.",
    resources: [
      {
        name: "Lawless French",
        url: "https://www.lawlessfrench.com/",
        description:
          "Clear English-language explanations of every French grammar point, with quizzes. Ideal because you're learning in English.",
        free: "freemium",
        bestFor: "Grammar explained in English (all levels)",
      },
      {
        name: "Le Point du FLE",
        url: "https://www.lepointdufle.net/",
        description:
          "A huge free directory of grammar and vocabulary exercises sorted by topic and level. Endless practice.",
        free: "free",
        bestFor: "Targeted grammar drills (A1–B2)",
      },
      {
        name: "Kwiziq French",
        url: "https://french.kwiziq.com/",
        description:
          "Adaptive AI that finds your grammar gaps and builds a personalised study plan mapped to CEFR levels.",
        free: "freemium",
        bestFor: "Adaptive grammar (A1–C1)",
      },
      {
        name: "Le Conjugueur",
        url: "https://leconjugueur.lefigaro.fr/",
        description:
          "Look up the full conjugation of any French verb in any tense — indispensable while writing.",
        free: "free",
        bestFor: "Verb conjugation reference (all levels)",
      },
    ],
  },
  {
    id: "vocab",
    title: "Vocabulary & flashcards",
    icon: "🗂️",
    intro:
      "B2 needs roughly 4,000–5,000 words. Spaced-repetition is the most efficient way to get there — use it every single day.",
    resources: [
      {
        name: "Anki",
        url: "https://apps.ankiweb.net/",
        description:
          "The gold-standard spaced-repetition app. Download a shared 'French frequency' or 'TCF/TEF' deck and review daily.",
        free: "free",
        bestFor: "Long-term vocabulary retention (all levels)",
      },
      {
        name: "TV5MONDE — Apprendre",
        url: "https://apprendre.tv5monde.com/fr",
        description:
          "Free exercises built on real TV clips, sorted by CEFR level (A1–B2). Combines vocab, listening and culture.",
        free: "free",
        bestFor: "Vocabulary in context (A1–B2)",
      },
      {
        name: "WordReference (FR↔EN)",
        url: "https://www.wordreference.com/fren/",
        description:
          "The best French–English dictionary, with example sentences and an active forum for tricky usage.",
        free: "free",
        bestFor: "Dictionary & usage (all levels)",
      },
      {
        name: "Linguee / DeepL",
        url: "https://www.linguee.com/english-french",
        description:
          "Shows your word used in thousands of real, professionally translated sentences — great for learning natural phrasing.",
        free: "free",
        bestFor: "Natural phrasing & collocations (B1–B2)",
      },
    ],
  },
  {
    id: "reading",
    title: "Reading (compréhension écrite)",
    icon: "📰",
    intro:
      "Read something French every day. Start with simplified news, then move to real newspapers as you reach B1+.",
    resources: [
      {
        name: "RFI — Français facile (articles)",
        url: "https://francaisfacile.rfi.fr/fr/",
        description:
          "News articles written in graded French with audio. The reading companion to their famous podcast.",
        free: "free",
        bestFor: "Graded reading (A2–B2)",
      },
      {
        name: "1jour1actu",
        url: "https://www.1jour1actu.com/",
        description:
          "Daily news written for French children — simple sentences, real current events. A gentle on-ramp to native text.",
        free: "free",
        bestFor: "Beginner-friendly reading (A2–B1)",
      },
      {
        name: "Le Monde",
        url: "https://www.lemonde.fr/",
        description:
          "France's paper of record. Once you're B1+, read one article a day to reach genuine B2 reading speed.",
        free: "freemium",
        bestFor: "Authentic reading (B1–B2)",
      },
    ],
  },
  {
    id: "speaking",
    title: "Speaking & writing practice",
    icon: "🗣️",
    intro:
      "The expression sections (oral & écrite) are where this app's AI grader and a real conversation partner matter most.",
    resources: [
      {
        name: "Tandem",
        url: "https://www.tandem.net/",
        description:
          "Free language-exchange app — chat or call native French speakers who want to learn your language. Real speaking practice.",
        free: "freemium",
        bestFor: "Speaking practice (A2–B2)",
      },
      {
        name: "italki",
        url: "https://www.italki.com/",
        description:
          "Book affordable 1-on-1 lessons with professional French tutors, many of whom specialise in TEF/TCF prep.",
        free: "paid",
        bestFor: "Tutored speaking & mock orals (A1–B2)",
      },
      {
        name: "Français avec Pierre (YouTube)",
        url: "https://www.youtube.com/@Francaisavecpierre",
        description:
          "A French teacher's channel with clear lessons on pronunciation, expressions, and exam strategy.",
        free: "freemium",
        bestFor: "Pronunciation & expression (A2–B2)",
      },
    ],
  },
  {
    id: "mock",
    title: "Mock tests & exam strategy",
    icon: "📝",
    intro:
      "In your final 6–8 weeks, do full timed mock exams. Simulating the pressure is what turns knowledge into a passing score.",
    resources: [
      {
        name: "Frenchify with Vyom (Vyom Sharma)",
        url: "https://frenchifywithvyom.com/",
        description:
          "TEF Canada-focused coaching by Vyom Sharma, who reached the level for Canadian PR by learning French in about a year. Step-by-step roadmaps, exam strategy, and live weekly doubt sessions. Free tips on his YouTube: youtube.com/@frenchify_with_vyom",
        free: "freemium",
        bestFor: "TEF Canada strategy & coaching (A1–B2)",
      },
      {
        name: "PrepMyFuture — TEF/TCF",
        url: "https://www.prepmyfuture.com/",
        description:
          "Realistic timed online mock exams for the TEF and TCF, with detailed scoring. The closest thing to the real test.",
        free: "freemium",
        bestFor: "Full mock exams (B1–B2)",
      },
      {
        name: "Bonjour de France",
        url: "https://www.bonjourdefrance.com/",
        description:
          "Free graded exercises and exam-style tasks organised by level, including TCF-type activities.",
        free: "free",
        bestFor: "Exam-style practice (A1–B2)",
      },
      {
        name: "Hexagonie / TCF prep books",
        url: "https://www.bonjourdefrance.com/exercices/contenu/tests-de-niveau-en-francais.html",
        description:
          "Level-placement tests to benchmark where you actually are before booking the real exam.",
        free: "free",
        bestFor: "Self-assessment (A1–B2)",
      },
    ],
  },
];
