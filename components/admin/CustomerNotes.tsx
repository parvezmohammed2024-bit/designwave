"use client";

import { useState, useTransition } from "react";
import { saveCustomer } from "@/app/admin/customers/actions";

const TAGS = ["corporate", "wedding", "repeat", "wholesale"];

export default function CustomerNotes({
  phone,
  tags,
  notes,
  followUp,
}: {
  phone: string;
  tags: string[];
  notes: string;
  followUp: string | null;
}) {
  const [t, setT] = useState<string[]>(tags);
  const [n, setN] = useState(notes);
  const [f, setF] = useState(followUp ?? "");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const toggle = (tag: string) =>
    setT((x) => (x.includes(tag) ? x.filter((y) => y !== tag) : [...x, tag]));

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <h2 className="font-bold">Tags &amp; notes</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <button key={tag} type="button" onClick={() => toggle(tag)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              t.includes(tag) ? "bg-brand-700 text-paper" : "border border-ink/20 hover:bg-ink/5"
            }`}>
            {tag}
          </button>
        ))}
      </div>
      <textarea rows={4} value={n} onChange={(e) => setN(e.target.value)}
        placeholder="Notes about this customer…"
        className="mt-3 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700" />
      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink/50">
        Follow-up reminder
        <input type="date" value={f} onChange={(e) => setF(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm font-normal" />
      </label>
      {msg && <p className="mt-2 text-xs font-semibold text-brand-700">{msg}</p>}
      <button type="button" disabled={pending}
        onClick={() => start(async () => {
          const r = await saveCustomer(phone, t, n, f || null);
          setMsg(r.error ?? "Saved.");
        })}
        className="mt-3 w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60">
        {pending ? "Saving…" : "Save"}
      </button>
    </section>
  );
}
