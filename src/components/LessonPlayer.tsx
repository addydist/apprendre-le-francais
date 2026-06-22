"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Exercise, Lesson, VocabItem } from "@/lib/types";
import { isAnswerCorrect } from "@/lib/compare";
import { speakFrench, ttsAvailable } from "@/lib/speak";
import { frenchWordToDevanagari } from "@/lib/frenchPhonetics";
import { useProgress } from "@/lib/useProgress";
import { completeLesson, reviewCard } from "@/lib/progress";
import { getNextLesson } from "@/lib/curriculum";
import { WritingGrader } from "./WritingGrader";

function SpeakBtn({ text }: { text: string }) {
  if (!ttsAvailable()) return null;
  return (
    <button
      type="button"
      onClick={() => speakFrench(text)}
      className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-1 text-sm text-sky-700 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300"
      aria-label="Listen"
    >
      🔊 Listen
    </button>
  );
}

type Feedback = { correct: boolean; show: boolean };

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const { update } = useProgress();
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [done, setDone] = useState(false);

  const total = lesson.exercises.length;
  const ex = lesson.exercises[idx];
  const next = useMemo(() => getNextLesson(lesson.id), [lesson.id]);

  function recordVocab(vocab: VocabItem | undefined, correct: boolean) {
    if (!vocab) return;
    update((p) => reviewCard(p, vocab, correct));
  }

  function handleResult(correct: boolean, vocab?: VocabItem) {
    setAnsweredCount((c) => c + 1);
    if (correct) setCorrectCount((c) => c + 1);
    recordVocab(vocab, correct);
  }

  function advance() {
    if (idx + 1 >= total) {
      finish();
    } else {
      setIdx((i) => i + 1);
    }
  }

  function finish() {
    const score = answeredCount > 0 ? correctCount / answeredCount : 1;
    const earnedXp = 10 + correctCount * 5;
    update((p) => completeLesson(p, lesson.id, score, earnedXp));
    setDone(true);
  }

  if (done) {
    const score = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 100;
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold">Lesson complete!</h2>
        <p className="mt-2 text-zinc-500">
          Score: {score}% · +{10 + correctCount * 5} XP earned
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          The words you saw have been added to your spaced-repetition deck — review
          them over the next few days to make them stick.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {next && (
            <button
              onClick={() => router.push(`/lesson/${next.id}`)}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Next lesson: {next.title} →
            </button>
          )}
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-zinc-300 px-5 py-3 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-zinc-400 hover:text-zinc-600"
          aria-label="Quit"
        >
          ✕
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-zinc-400">
          {idx + 1}/{total}
        </span>
      </div>

      <ExerciseView
        key={ex.id}
        exercise={ex}
        onResult={handleResult}
        onContinue={advance}
      />
    </div>
  );
}

// ---- Per-exercise rendering -------------------------------------------------

function ExerciseView({
  exercise,
  onResult,
  onContinue,
}: {
  exercise: Exercise;
  onResult: (correct: boolean, vocab?: VocabItem) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-indigo-500">
        {exercise.prompt}
      </p>
      {exercise.type === "flashcard" && (
        <Flashcard ex={exercise} onResult={onResult} onContinue={onContinue} />
      )}
      {exercise.type === "multipleChoice" && (
        <MultipleChoice ex={exercise} onResult={onResult} onContinue={onContinue} />
      )}
      {exercise.type === "fillBlank" && (
        <FillBlank ex={exercise} onResult={onResult} onContinue={onContinue} />
      )}
      {exercise.type === "translate" && (
        <Translate ex={exercise} onResult={onResult} onContinue={onContinue} />
      )}
      {exercise.type === "listening" && (
        <Listening ex={exercise} onResult={onResult} onContinue={onContinue} />
      )}
      {exercise.type === "matchPairs" && (
        <MatchPairs ex={exercise} onResult={onResult} onContinue={onContinue} />
      )}
      {exercise.type === "writing" && (
        <WritingGrader ex={exercise} onContinue={onContinue} />
      )}
    </div>
  );
}

function ContinueBar({
  feedback,
  explanation,
  onContinue,
}: {
  feedback: Feedback;
  explanation?: string;
  onContinue: () => void;
}) {
  if (!feedback.show) return null;
  return (
    <div
      className={`mt-6 rounded-xl p-4 ${
        feedback.correct
          ? "bg-emerald-50 dark:bg-emerald-900/30"
          : "bg-rose-50 dark:bg-rose-900/30"
      }`}
    >
      <p
        className={`font-semibold ${
          feedback.correct ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
        }`}
      >
        {feedback.correct ? "✓ Correct!" : "✗ Not quite"}
      </p>
      {explanation && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{explanation}</p>}
      <button
        onClick={onContinue}
        className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
      >
        Continue →
      </button>
    </div>
  );
}

function Flashcard({
  ex,
  onResult,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "flashcard" }>;
  onResult: (c: boolean, v?: VocabItem) => void;
  onContinue: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="text-center">
      <button
        onClick={() => setRevealed(true)}
        className="w-full rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold">{ex.vocab.fr}</span>
          <span onClick={(e) => e.stopPropagation()}>
            <SpeakBtn text={ex.vocab.exampleFr || ex.vocab.fr} />
          </span>
        </div>
        {/* Offline Hindi pronunciation hint (no API) */}
        <p className="mt-2 text-lg text-orange-600 dark:text-orange-400" lang="hi">
          {frenchWordToDevanagari(ex.vocab.fr)}
        </p>
        {revealed ? (
          <div className="mt-4">
            <p className="text-xl text-zinc-600 dark:text-zinc-300">{ex.vocab.en}</p>
            {ex.vocab.exampleFr && (
              <p className="mt-3 text-sm italic text-zinc-400">
                {ex.vocab.exampleFr} — {ex.vocab.exampleEn}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-400">Tap to reveal</p>
        )}
      </button>
      {revealed && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              onResult(false, ex.vocab);
              onContinue();
            }}
            className="rounded-lg border border-zinc-300 px-5 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Still learning
          </button>
          <button
            onClick={() => {
              onResult(true, ex.vocab);
              onContinue();
            }}
            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white hover:bg-emerald-700"
          >
            I know it ✓
          </button>
        </div>
      )}
    </div>
  );
}

function MultipleChoice({
  ex,
  onResult,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "multipleChoice" }>;
  onResult: (c: boolean) => void;
  onContinue: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const feedback: Feedback = { correct: picked === ex.answerIndex, show: picked !== null };
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <p className="text-lg font-semibold">{ex.question}</p>
        {ex.speak && <SpeakBtn text={ex.speak} />}
      </div>
      <div className="grid gap-3">
        {ex.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = i === ex.answerIndex;
          let cls =
            "rounded-xl border px-4 py-3 text-left transition border-zinc-200 hover:border-indigo-400 dark:border-zinc-700";
          if (picked !== null) {
            if (isAnswer) cls = "rounded-xl border px-4 py-3 text-left border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30";
            else if (isPicked) cls = "rounded-xl border px-4 py-3 text-left border-rose-500 bg-rose-50 dark:bg-rose-900/30";
            else cls = "rounded-xl border px-4 py-3 text-left border-zinc-200 opacity-60 dark:border-zinc-700";
          }
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                onResult(i === ex.answerIndex);
              }}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <ContinueBar feedback={feedback} explanation={ex.explanation} onContinue={onContinue} />
    </div>
  );
}

function TextAnswer({
  label,
  accepted,
  speakText,
  explanation,
  onResult,
  onContinue,
  showAnswerAfter,
}: {
  label: React.ReactNode;
  accepted: string[];
  speakText?: string;
  explanation?: string;
  onResult: (c: boolean) => void;
  onContinue: () => void;
  showAnswerAfter?: boolean;
}) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({ correct: false, show: false });

  function check() {
    if (feedback.show) return;
    const correct = isAnswerCorrect(value, accepted);
    setFeedback({ correct, show: true });
    onResult(correct);
  }

  const expl =
    !feedback.correct && showAnswerAfter
      ? `Answer: ${accepted[0]}${explanation ? " — " + explanation : ""}`
      : explanation;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="text-lg font-semibold">{label}</div>
        {speakText && <SpeakBtn text={speakText} />}
      </div>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && check()}
        disabled={feedback.show}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Type your answer…"
      />
      {!feedback.show && (
        <button
          onClick={check}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700"
        >
          Check
        </button>
      )}
      <ContinueBar feedback={feedback} explanation={expl} onContinue={onContinue} />
    </div>
  );
}

function FillBlank({
  ex,
  onResult,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "fillBlank" }>;
  onResult: (c: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <TextAnswer
      label={
        <span>
          {ex.sentence.split("___")[0]}
          <span className="mx-1 rounded bg-indigo-100 px-2 text-indigo-600 dark:bg-indigo-900/40">____</span>
          {ex.sentence.split("___")[1]}
          {ex.hintEn && <span className="ml-2 text-sm text-zinc-400">({ex.hintEn})</span>}
        </span>
      }
      accepted={ex.answers}
      explanation={ex.explanation}
      onResult={onResult}
      onContinue={onContinue}
      showAnswerAfter
    />
  );
}

function Translate({
  ex,
  onResult,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "translate" }>;
  onResult: (c: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <TextAnswer
      label={
        <span>
          <span className="text-zinc-400">
            {ex.direction === "enToFr" ? "EN → FR" : "FR → EN"}:
          </span>{" "}
          {ex.source}
        </span>
      }
      accepted={ex.answers}
      speakText={ex.direction === "frToEn" ? ex.source : undefined}
      explanation={ex.explanation}
      onResult={onResult}
      onContinue={onContinue}
      showAnswerAfter
    />
  );
}

function Listening({
  ex,
  onResult,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "listening" }>;
  onResult: (c: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => speakFrench(ex.audioText)}
          className="rounded-2xl bg-sky-100 px-8 py-6 text-3xl hover:bg-sky-200 dark:bg-sky-900/40"
          aria-label="Play audio"
        >
          🔊
        </button>
      </div>
      <TextAnswer
        label={<span className="text-zinc-400">Type what you hear (in French)</span>}
        accepted={ex.answers}
        explanation={ex.explanation}
        onResult={onResult}
        onContinue={onContinue}
        showAnswerAfter={ex.showText}
      />
    </div>
  );
}

function MatchPairs({
  ex,
  onResult,
  onContinue,
}: {
  ex: Extract<Exercise, { type: "matchPairs" }>;
  onResult: (c: boolean) => void;
  onContinue: () => void;
}) {
  const shuffledEn = useMemo(
    () => [...ex.pairs].sort(() => Math.random() - 0.5),
    [ex],
  );
  const [selectedFr, setSelectedFr] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const allMatched = Object.keys(matched).length === ex.pairs.length;

  function tryMatch(en: string) {
    if (!selectedFr) return;
    const pair = ex.pairs.find((p) => p.fr === selectedFr);
    if (pair && pair.en === en) {
      const nm = { ...matched, [selectedFr]: en };
      setMatched(nm);
      setSelectedFr(null);
      if (Object.keys(nm).length === ex.pairs.length) onResult(true);
    } else {
      setWrong(en);
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          {ex.pairs.map((p) => {
            const isMatched = matched[p.fr] !== undefined;
            return (
              <button
                key={p.fr}
                disabled={isMatched}
                onClick={() => setSelectedFr(p.fr)}
                className={`rounded-lg border px-3 py-2 ${
                  isMatched
                    ? "border-emerald-400 bg-emerald-50 opacity-50 dark:bg-emerald-900/30"
                    : selectedFr === p.fr
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {p.fr}
              </button>
            );
          })}
        </div>
        <div className="grid gap-2">
          {shuffledEn.map((p) => {
            const isUsed = Object.values(matched).includes(p.en);
            return (
              <button
                key={p.en}
                disabled={isUsed}
                onClick={() => tryMatch(p.en)}
                className={`rounded-lg border px-3 py-2 ${
                  isUsed
                    ? "border-emerald-400 bg-emerald-50 opacity-50 dark:bg-emerald-900/30"
                    : wrong === p.en
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30"
                      : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {p.en}
              </button>
            );
          })}
        </div>
      </div>
      {allMatched && (
        <ContinueBar
          feedback={{ correct: true, show: true }}
          explanation={ex.explanation}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}
