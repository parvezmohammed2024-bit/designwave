"use client";

import { useState } from "react";

/** Download every receipt issued in a date range, zipped, for bookkeeping. */
export default function ReceiptBulkExport() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const download = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/receipts/bulk?from=${from}&to=${to}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error ?? "Could not build the ZIP.");
        setBusy(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-wave-receipts-${from}_${to}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Downloaded.");
    } catch {
      setMsg("Could not build the ZIP.");
    }
    setBusy(false);
  };

  const input = "rounded-lg border border-ink/20 px-3 py-2 text-sm";

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <h2 className="font-bold">Receipts export</h2>
      <p className="mt-1 text-xs text-ink/55">
        All receipts issued in the range, as one ZIP.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`${input} mt-1 block font-normal`}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`${input} mt-1 block font-normal`}
          />
        </label>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Building…" : "Download ZIP"}
        </button>
        {msg && <span className="text-sm font-semibold text-brand-700">{msg}</span>}
      </div>
    </section>
  );
}
