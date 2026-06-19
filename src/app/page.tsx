import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Apprendre <span className="text-indigo-600">le français</span> 🇫🇷
        </h1>
        <p className="mt-1 text-zinc-500">
          A complete, English-friendly path from total beginner (A1) to exam-ready
          B2+ for the TEF &amp; TCF. Built for the long haul — about 10–12 months of
          steady daily practice.
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
