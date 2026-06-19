// Core data model for the French learning app (A1 -> B2+ for TEF/TCF)

export type CEFRLevel = "A1" | "A2" | "B1" | "B2";

// All supported exercise kinds. The lesson player renders a component per kind.
export type ExerciseType =
  | "flashcard" // see/hear a word, reveal meaning
  | "multipleChoice" // pick the correct option
  | "fillBlank" // type the missing word
  | "translate" // translate a sentence (checked loosely)
  | "listening" // hear French (TTS), pick/type what was said
  | "matchPairs" // match French <-> English pairs
  | "writing"; // free writing, optionally AI-graded

export interface VocabItem {
  fr: string;
  en: string;
  // optional example sentence to give context
  exampleFr?: string;
  exampleEn?: string;
  // gender hint for nouns: "m" | "f"
  gender?: "m" | "f";
}

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: string; // instruction shown to the learner
  // optional grammar/usage tip shown after answering
  explanation?: string;
}

export interface FlashcardExercise extends BaseExercise {
  type: "flashcard";
  vocab: VocabItem;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: "multipleChoice";
  question: string;
  options: string[];
  answerIndex: number;
  // optional French audio for the question (read aloud)
  speak?: string;
}

export interface FillBlankExercise extends BaseExercise {
  type: "fillBlank";
  // sentence with a single blank marked as "___"
  sentence: string;
  answers: string[]; // accepted answers (case/accent-insensitive compare)
  hintEn?: string;
}

export interface TranslateExercise extends BaseExercise {
  type: "translate";
  source: string; // text to translate
  direction: "enToFr" | "frToEn";
  answers: string[]; // accepted answers (loose compare)
}

export interface ListeningExercise extends BaseExercise {
  type: "listening";
  audioText: string; // French text spoken via TTS
  answers: string[]; // accepted typed answers
  showText?: boolean; // reveal text after answering
}

export interface MatchPairsExercise extends BaseExercise {
  type: "matchPairs";
  pairs: { fr: string; en: string }[];
}

export interface WritingExercise extends BaseExercise {
  type: "writing";
  taskFr: string; // the writing task description (in French at higher levels)
  minWords: number;
  targetLevel: CEFRLevel; // what level the response is graded against
}

export type Exercise =
  | FlashcardExercise
  | MultipleChoiceExercise
  | FillBlankExercise
  | TranslateExercise
  | ListeningExercise
  | MatchPairsExercise
  | WritingExercise;

export interface Lesson {
  id: string; // e.g. "a1-01"
  level: CEFRLevel;
  order: number; // position within the level
  title: string;
  goal: string; // one-line "what you'll be able to do"
  grammar?: string; // short grammar focus note
  vocab: VocabItem[]; // the lesson's target vocabulary
  exercises: Exercise[];
}

export interface LevelMeta {
  level: CEFRLevel;
  title: string;
  description: string;
  examFocus: string; // how this level maps to TEF/TCF
}
