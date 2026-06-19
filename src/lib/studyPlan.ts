// A realistic A1 -> B2 study plan. Going from absolute beginner to B2 is a
// ~10-12 month commitment at roughly 1 hour per day — NOT a one-month sprint.
// These numbers reflect typical guided-study estimates (CEFR + exam bodies
// suggest ~150-200 guided hours per level for B-levels).

import type { CEFRLevel } from "./types";

export interface PlanPhase {
  level: CEFRLevel;
  title: string;
  weeks: [number, number]; // inclusive week range within the journey
  approxHours: number; // total study hours to reach the end of this level
  canDo: string[]; // "can-do" statements at the end of the phase
  focus: string[]; // what to drill during this phase
  examNote: string; // how this phase relates to the TEF/TCF
}

export const TOTAL_WEEKS = 52; // ~12 months (10–12 month range)
export const DAILY_MINUTES = 60; // assumed daily study commitment

export const STUDY_PHASES: PlanPhase[] = [
  {
    level: "A1",
    title: "A1 — Absolute beginner",
    weeks: [1, 10],
    approxHours: 90,
    canDo: [
      "Greet people and introduce yourself",
      "Count, tell the time, give your age and nationality",
      "Form simple present-tense sentences with être, avoir and common -er verbs",
      "Understand very slow, clear speech about familiar things",
    ],
    focus: [
      "Core 500 high-frequency words",
      "Present tense + articles (le/la/un/une)",
      "Pronunciation and the French sound system",
      "Daily listening to slow French (RFI français facile)",
    ],
    examNote:
      "Below the exam's target, but this is the foundation everything else stands on. Don't rush it.",
  },
  {
    level: "A2",
    title: "A2 — Elementary",
    weeks: [11, 22],
    approxHours: 110,
    canDo: [
      "Talk about your routine, past events (passé composé) and plans (futur proche)",
      "Handle simple transactions (shops, directions, appointments)",
      "Write short, connected messages and descriptions",
      "Follow short everyday dialogues",
    ],
    focus: [
      "Passé composé vs imparfait (start)",
      "1,000+ word vocabulary",
      "Connectors (et, mais, parce que, donc)",
      "Short writing every day, graded by the AI tutor",
    ],
    examNote:
      "The lower TCF/TEF bands begin to be reachable. Build the habit of timed reading.",
  },
  {
    level: "B1",
    title: "B1 — Intermediate",
    weeks: [23, 38],
    approxHours: 160,
    canDo: [
      "Express and justify opinions in conversation",
      "Narrate experiences and dreams with linked ideas",
      "Use all common tenses, including the conditionnel",
      "Understand the main points of clear standard speech and articles",
    ],
    focus: [
      "All tenses + the conditionnel and start of the subjonctif",
      "2,500+ word vocabulary",
      "Structured opinion paragraphs (intro–arguments–conclusion)",
      "Daily authentic listening (InnerFrench, news)",
    ],
    examNote:
      "This is the gateway to B2. Many TEF/TCF candidates plateau here — push through with active output, not just input.",
  },
  {
    level: "B2",
    title: "B2 — Upper-intermediate (exam target)",
    weeks: [39, 52],
    approxHours: 180,
    canDo: [
      "Argue a point fluently with nuance and the right register",
      "Write structured, formal essays and letters",
      "Use the subjonctif and complex connectors naturally",
      "Understand most TV, radio and newspaper content",
    ],
    focus: [
      "Subjonctif, concordance des temps, discours indirect",
      "4,000–5,000 word vocabulary",
      "Formal register + argumentative essays",
      "Full timed mock exams in the final 6–8 weeks",
    ],
    examNote:
      "This is the B2+ level you're aiming for. Spend the last 2 months almost entirely on exam-format practice and mock tests.",
  },
];

// A few honest principles shown at the top of the plan.
export const PLAN_PRINCIPLES = [
  {
    title: "Consistency beats intensity",
    body: "One focused hour every day beats a 7-hour Sunday. The plan assumes ~60 min/day; if you do more, you'll move faster.",
  },
  {
    title: "Balance the four skills",
    body: "The exam tests listening, reading, speaking and writing separately. Neglecting one (usually speaking) is what caps people's scores.",
  },
  {
    title: "Output from day one",
    body: "Don't just consume. Write and speak from the very start — that's why this app grades your writing and reads French aloud to you.",
  },
  {
    title: "Mock tests at the end",
    body: "Knowledge ≠ a score. The final 6–8 weeks should be dominated by full, timed mock exams under real conditions.",
  },
];
