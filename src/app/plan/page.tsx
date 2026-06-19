import {
  STUDY_PHASES,
  PLAN_PRINCIPLES,
  TOTAL_WEEKS,
  DAILY_MINUTES,
} from "@/lib/studyPlan";

export const metadata = {
  title: "Your A1 → B2 study plan",
};

const LEVEL_COLOR: Record<string, string> = {
  A1: "border-sky-400",
  A2: "border-emerald-400",
  B1: "border-amber-400",
  B2: "border-rose-400",
};

export default function PlanPage() {
  const totalHours = STUDY_PHASES.reduce((s, p) => s + p.approxHours, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">🗺️ Your road to B2+</h1>
        <p className="mt-2 text-zinc-500">
          Be realistic: going from a complete beginner (A1) to exam-ready B2+ is a{" "}
          <strong>10–12 month journey</strong>, not a quick sprint. At about{" "}
          {DAILY_MINUTES} minutes of focused study a day, that&apos;s roughly{" "}
          <strong>{totalHours} hours</strong> of work across {TOTAL_WEEKS} weeks.
          Here&apos;s how that breaks down — and what to focus on at each stage.
        </p>
      </header>

      {/* Principles */}
      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        {PLAN_PRINCIPLES.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="font-semibold text-indigo-600">{p.title}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{p.body}</p>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <h2 className="mb-4 text-xl font-bold">The 4 phases</h2>
      <div className="space-y-6">
        {STUDY_PHASES.map((phase) => (
          <div
            key={phase.level}
            className={`rounded-2xl border-l-4 ${LEVEL_COLOR[phase.level]} border-y border-r border-zinc-200 bg-white p-5 dark:border-y-zinc-800 dark:border-r-zinc-800 dark:bg-zinc-900`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold">{phase.title}</h3>
              <span className="text-sm text-zinc-400">
                Weeks {phase.weeks[0]}–{phase.weeks[1]} · ~{phase.approxHours} hrs
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  ✅ By the end you can…
                </p>
                <ul className="mt-1 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {phase.canDo.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="text-emerald-500">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-600">🎯 Focus on</p>
                <ul className="mt-1 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {phase.focus.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-indigo-500">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              📌 <strong>Exam note:</strong> {phase.examNote}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-indigo-600 p-6 text-center text-white">
        <p className="text-lg font-bold">Ready to start Phase 1?</p>
        <p className="mt-1 text-sm text-indigo-100">
          Head to the Learn tab and begin with A1. Small daily wins compound into a B2.
        </p>
        <a
          href="/"
          className="mt-4 inline-block rounded-xl bg-white px-5 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Start learning →
        </a>
      </div>
    </main>
  );
}
