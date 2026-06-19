import { Translator } from "@/components/Translator";

export const metadata = {
  title: "Translate & Pronounce — French with Hindi pronunciation",
};

export default function TranslatePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          🗣️ Translate &amp; Pronounce
        </h1>
        <p className="mt-2 text-zinc-500">
          Type any English phrase and get its French translation, a{" "}
          <strong>Hindi (Devanagari) pronunciation guide</strong>, and a word-by-word
          breakdown — each with a French voice-over. Reading the Hindi spelling helps you
          nail tricky French sounds (nasal vowels, the French «&nbsp;r&nbsp;», silent
          endings) far more easily than English spelling can.
        </p>
      </header>
      <Translator />
    </main>
  );
}
