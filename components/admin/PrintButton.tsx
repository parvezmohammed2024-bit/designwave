"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mb-4 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
