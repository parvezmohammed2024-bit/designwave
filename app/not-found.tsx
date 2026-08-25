import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <div
        aria-hidden
        className="h-28 w-20 rotate-6 rounded-lg border-2 border-dashed border-ink/40"
      />
      <h1 className="bangla-safe mt-8 text-3xl font-bold md:text-4xl">
        পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
      </h1>
      <p className="mt-3 max-w-sm leading-bangla text-ink/70">
        মনে হচ্ছে কার্ডটা ভুল খামে ঢুকে গেছে। চলুন, শুরু থেকে আবার দেখি।
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-7 py-3 font-semibold text-paper transition-colors hover:bg-brand-700"
      >
        হোমে ফিরে যান
      </Link>
    </main>
  );
}
