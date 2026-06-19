import { ReviewSession } from "@/components/ReviewSession";

export default function ReviewPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">🔁 Spaced-repetition review</h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        Quick recall practice. Be honest with yourself — words you mark as
        &ldquo;didn&apos;t know&rdquo; come back sooner, and ones you know get spaced
        further out. This is the most efficient way to build lasting vocabulary.
      </p>
      <ReviewSession />
    </main>
  );
}
