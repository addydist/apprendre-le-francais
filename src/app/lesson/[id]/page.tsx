import { notFound } from "next/navigation";
import { LESSONS, getLesson } from "@/lib/curriculum";
import { LessonPlayer } from "@/components/LessonPlayer";

// Pre-render every lesson route at build time.
export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-indigo-500">
          {lesson.level} · Leçon {lesson.order}
        </p>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-zinc-500">{lesson.goal}</p>
      </div>
      <LessonPlayer lesson={lesson} />
    </main>
  );
}
