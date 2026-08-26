"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/app/admin/banner/actions";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";

type Cat = { slug: string; name_bn: string; detail_bn: string };
type Stat = { value: number; suffix: string; label_bn: string };

export default function ContentSettings({
  homepage,
  categories,
  trustStats,
}: {
  homepage?: { headline_bn?: string; banner_rotation_ms?: number };
  categories?: Cat[];
  trustStats?: Stat[];
}) {
  const [hp, setHp] = useState({
    headline_bn: homepage?.headline_bn ?? "",
    banner_rotation_ms: homepage?.banner_rotation_ms ?? 6000,
  });
  const [cats, setCats] = useState<Cat[]>(categories ?? []);
  const [stats, setStats] = useState<Stat[]>(trustStats ?? []);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const save = (key: string, value: unknown) =>
    start(async () => {
      const res = await saveSetting(key, value);
      setMsg(res.error ?? `Saved ${key}.`);
    });

  return (
    <div className="mt-8 space-y-4">
      {msg && <p className="text-sm font-semibold text-brand-700">{msg}</p>}

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Homepage</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            Hero headline (Bangla)
            <input className={`${input} mt-1 font-normal normal-case`} value={hp.headline_bn}
              onChange={(e) => setHp({ ...hp, headline_bn: e.target.value })} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            Banner rotation (ms)
            <input className={`${input} mt-1 font-normal normal-case`} value={hp.banner_rotation_ms}
              inputMode="numeric"
              onChange={(e) => setHp({ ...hp, banner_rotation_ms: Number(e.target.value) || 6000 })} />
          </label>
        </div>
        <button type="button" disabled={pending} onClick={() => save("homepage", hp)}
          className="mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60">
          Save homepage
        </button>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Collection tiles</h2>
        <div className="mt-3 space-y-2">
          {cats.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <input className={input} value={c.slug} dir="ltr" placeholder="slug"
                onChange={(e) => setCats(cats.map((x, j) => j === i ? { ...x, slug: e.target.value } : x))} />
              <input className={input} value={c.name_bn} placeholder="নাম"
                onChange={(e) => setCats(cats.map((x, j) => j === i ? { ...x, name_bn: e.target.value } : x))} />
              <input className={input} value={c.detail_bn} placeholder="বিবরণ"
                onChange={(e) => setCats(cats.map((x, j) => j === i ? { ...x, detail_bn: e.target.value } : x))} />
              <button type="button" onClick={() => setCats(cats.filter((_, j) => j !== i))}
                className="rounded-lg border border-ink/20 px-3 hover:bg-rose-50">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button"
            onClick={() => setCats([...cats, { slug: "", name_bn: "", detail_bn: "" }])}
            className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5">
            + Add tile
          </button>
          <button type="button" disabled={pending} onClick={() => save("categories", cats)}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60">
            Save tiles
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Trust strip numbers</h2>
        <div className="mt-3 space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <input className={input} value={s.value} inputMode="numeric" placeholder="1200"
                onChange={(e) => setStats(stats.map((x, j) => j === i ? { ...x, value: Number(e.target.value) || 0 } : x))} />
              <input className={input} value={s.suffix} placeholder="+"
                onChange={(e) => setStats(stats.map((x, j) => j === i ? { ...x, suffix: e.target.value } : x))} />
              <input className={input} value={s.label_bn} placeholder="লেবেল"
                onChange={(e) => setStats(stats.map((x, j) => j === i ? { ...x, label_bn: e.target.value } : x))} />
              <button type="button" onClick={() => setStats(stats.filter((_, j) => j !== i))}
                className="rounded-lg border border-ink/20 px-3 hover:bg-rose-50">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button"
            onClick={() => setStats([...stats, { value: 0, suffix: "", label_bn: "" }])}
            className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5">
            + Add stat
          </button>
          <button type="button" disabled={pending} onClick={() => save("trust_stats", stats)}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60">
            Save stats
          </button>
        </div>
      </section>
    </div>
  );
}
