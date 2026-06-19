import { RESOURCE_CATEGORIES } from "@/lib/resources";

const FREE_BADGE: Record<string, { label: string; cls: string }> = {
  free: { label: "Free", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  freemium: { label: "Freemium", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  paid: { label: "Paid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
};

export const metadata = {
  title: "Best resources to crack the TEF / TCF",
};

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">📚 Best resources to crack the exam</h1>
        <p className="mt-2 text-zinc-500">
          A hand-picked toolkit of the most effective French resources on the web for
          passing the <strong>TEF</strong> and <strong>TCF</strong> at B2+. You don&apos;t
          need all of them — pick one or two per category and use them consistently.
          Everything opens in a new tab.
        </p>
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200">
          💡 <strong>How to use this page:</strong> as a beginner, lean on the
          Listening, Grammar and Vocabulary sections daily. Save the Mock tests
          for your final 6–8 weeks before the exam.
        </div>
      </header>

      <div className="space-y-10">
        {RESOURCE_CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-xl font-bold">
              {cat.icon} {cat.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{cat.intro}</p>

            <div className="mt-4 grid gap-3">
              {cat.resources.map((r) => {
                const badge = FREE_BADGE[r.free];
                return (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold group-hover:text-indigo-600">
                        {r.name} <span className="text-zinc-400 transition group-hover:translate-x-0.5">↗</span>
                      </h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{r.description}</p>
                    <p className="mt-2 text-xs text-zinc-400">🎯 Best for: {r.bestFor}</p>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
