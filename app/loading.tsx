export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Design Wave"
          width={92}
          height={64}
          className="animate-pulse"
        />
        <p className="text-sm font-semibold text-ink/50">লোড হচ্ছে…</p>
      </div>
    </div>
  );
}
