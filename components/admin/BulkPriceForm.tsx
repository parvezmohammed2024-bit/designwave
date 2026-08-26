"use client";

import { useState, useTransition } from "react";
import { bulkPriceChange } from "@/app/admin/products/actions";

export default function BulkPriceForm({
  categories,
}: {
  categories: { slug: string; name_bn: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("");
  const [pct, setPct] = useState("10");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const apply = () => {
    const n = parseFloat(pct);
    const label = cat || "ALL categories";
    if (!confirm(`Change every price slab in ${label} by ${n > 0 ? "+" : ""}${n}%? This cannot be undone automatically.`)) return;
    start(async () => {
      const res = await bulkPriceChange(cat, n);
      setMsg(res.error ? res.error : `Updated ${res.count} slab(s).`);
    });
  };

  return (
    <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        {open ? "− Hide" : "+ Bulk price update"}
      </button>
      {open && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            Category
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="mt-1 block rounded-lg border border-ink/20 px-3 py-2 text-sm font-normal normal-case"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name_bn}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            Change %
            <input
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              inputMode="decimal"
              className="mt-1 block w-24 rounded-lg border border-ink/20 px-3 py-2 text-sm font-normal"
            />
          </label>
          <button
            type="button"
            onClick={apply}
            disabled={pending}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Updating…" : "Apply"}
          </button>
          {msg && <span className="text-sm font-semibold text-brand-700">{msg}</span>}
        </div>
      )}
    </div>
  );
}
