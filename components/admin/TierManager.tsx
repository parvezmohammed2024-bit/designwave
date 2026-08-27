"use client";

import { useState, useTransition } from "react";
import {
  bulkAdjustTier,
  deleteTier,
  saveTier,
  type TierInput,
} from "@/app/admin/products/catalogActions";
import type { SlabInput } from "@/app/admin/products/actions";
import { tk, toPoisha, toTakaInput } from "@/lib/admin/money";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";

type SlabDraft = { min_qty: string; max_qty: string; unit_price: string };
type TierDraft = TierInput & { slabs: SlabDraft[] };

export type TierSeed = {
  id: string;
  name_bn: string;
  description_bn: string | null;
  sort_order: number;
  is_default: boolean;
  active: boolean;
  slabs: { min_qty: number; max_qty: number | null; unit_price: number }[];
};

const toDraft = (t: TierSeed): TierDraft => ({
  id: t.id,
  name_bn: t.name_bn,
  description_bn: t.description_bn ?? "",
  sort_order: t.sort_order,
  is_default: t.is_default,
  active: t.active,
  slabs: t.slabs
    .slice()
    .sort((a, b) => a.min_qty - b.min_qty)
    .map((s) => ({
      min_qty: String(s.min_qty),
      max_qty: s.max_qty === null ? "" : String(s.max_qty),
      unit_price: toTakaInput(s.unit_price),
    })),
});

/**
 * Quality tiers with their own slab tables. A product with no tiers keeps
 * using its product-level slabs, so this section is purely opt-in.
 */
export default function TierManager({
  productId,
  moq,
  initial,
}: {
  productId: string;
  moq: number;
  initial: TierSeed[];
}) {
  const [tiers, setTiers] = useState<TierDraft[]>(initial.map(toDraft));
  const [msg, setMsg] = useState("");
  const [pct, setPct] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const patch = (i: number, p: Partial<TierDraft>) =>
    setTiers((cur) => cur.map((t, j) => (j === i ? { ...t, ...p } : t)));

  const patchSlab = (ti: number, si: number, p: Partial<SlabDraft>) =>
    setTiers((cur) =>
      cur.map((t, j) =>
        j === ti
          ? { ...t, slabs: t.slabs.map((s, k) => (k === si ? { ...s, ...p } : s)) }
          : t
      )
    );

  const persist = (i: number) => {
    const t = tiers[i];
    const slabs: SlabInput[] = t.slabs.map((s) => ({
      min_qty: parseInt(s.min_qty, 10) || 0,
      max_qty: s.max_qty.trim() === "" ? null : parseInt(s.max_qty, 10),
      unit_price: toPoisha(s.unit_price),
    }));
    start(async () => {
      const res = await saveTier(productId, { ...t, slabs: undefined } as TierInput, slabs);
      if (res.error) setMsg(res.error);
      else {
        setMsg(`Saved ${t.name_bn}.`);
        if (!t.id && res.id) patch(i, { id: res.id });
      }
    });
  };

  const addTier = () =>
    setTiers((cur) => [
      ...cur,
      {
        name_bn: cur.length === 0 ? "নরমাল" : "প্রিমিয়াম",
        description_bn: "",
        sort_order: cur.length + 1,
        is_default: cur.length === 0,
        active: true,
        slabs: [
          { min_qty: String(moq), max_qty: "999", unit_price: "1" },
          { min_qty: "1000", max_qty: "", unit_price: "0.8" },
        ],
      },
    ]);

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Quality tiers</h2>
        <button
          type="button"
          onClick={addTier}
          className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5"
        >
          + Add tier
        </button>
      </div>
      <p className="mt-1 text-xs text-ink/55">
        Leave empty and the product uses its own slabs below, exactly as before.
        With tiers, each tier carries its own full slab table.
      </p>
      {msg && (
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {msg}
        </p>
      )}

      <div className="mt-3 space-y-4">
        {tiers.map((t, i) => (
          <div key={t.id ?? `new-${i}`} className="rounded-xl border border-ink/15 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input
                className={input}
                value={t.name_bn}
                placeholder="নরমাল"
                onChange={(e) => patch(i, { name_bn: e.target.value })}
              />
              <input
                className={input}
                value={t.description_bn}
                placeholder="৩০০ জিএসএম · গ্লসি লেমিনেশন"
                onChange={(e) => patch(i, { description_bn: e.target.value })}
              />
              <input
                className="w-16 rounded-lg border border-ink/20 px-2 py-2 text-sm"
                value={t.sort_order}
                onChange={(e) =>
                  patch(i, { sort_order: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="default-tier"
                  checked={t.is_default}
                  onChange={() =>
                    setTiers((cur) =>
                      cur.map((x, j) => ({ ...x, is_default: j === i }))
                    )
                  }
                />
                default
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={t.active}
                  onChange={(e) => patch(i, { active: e.target.checked })}
                />
                active
              </label>
            </div>

            {/* slabs */}
            <div className="mt-3">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink/50">
                <span>Min</span>
                <span>Max</span>
                <span>৳/pc</span>
                <span />
              </div>
              <div className="mt-1 space-y-1.5">
                {t.slabs.map((s, si) => (
                  <div key={si} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <input
                      className={input}
                      value={s.min_qty}
                      inputMode="numeric"
                      onChange={(e) => patchSlab(i, si, { min_qty: e.target.value })}
                    />
                    <input
                      className={input}
                      value={s.max_qty}
                      placeholder="∞"
                      inputMode="numeric"
                      onChange={(e) => patchSlab(i, si, { max_qty: e.target.value })}
                    />
                    <input
                      className={input}
                      value={s.unit_price}
                      inputMode="decimal"
                      onChange={(e) =>
                        patchSlab(i, si, { unit_price: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove slab"
                      onClick={() =>
                        patch(i, { slabs: t.slabs.filter((_, k) => k !== si) })
                      }
                      className="rounded-lg border border-ink/20 px-3 text-sm hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  patch(i, {
                    slabs: [...t.slabs, { min_qty: "", max_qty: "", unit_price: "" }],
                  })
                }
                className="mt-2 rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5"
              >
                + slab
              </button>
              <p className="mt-2 rounded-lg bg-ink/[0.04] p-2 text-xs">
                At MOQ {moq} pcs:{" "}
                <strong>
                  {(() => {
                    const hit = t.slabs.find((s) => {
                      const min = parseInt(s.min_qty, 10) || 0;
                      const max =
                        s.max_qty.trim() === "" ? Infinity : parseInt(s.max_qty, 10);
                      return moq >= min && moq <= max;
                    });
                    return hit
                      ? tk(toPoisha(hit.unit_price) * moq)
                      : "— no slab covers the MOQ";
                  })()}
                </strong>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => persist(i)}
                disabled={pending}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-paper hover:bg-brand-700 disabled:opacity-60"
              >
                Save tier
              </button>
              {t.id && (
                <>
                  <input
                    value={pct[t.id] ?? "10"}
                    onChange={(e) =>
                      setPct((p) => ({ ...p, [t.id!]: e.target.value }))
                    }
                    inputMode="decimal"
                    className="w-16 rounded-lg border border-ink/20 px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const n = parseFloat(pct[t.id!] ?? "10");
                      if (!confirm(`Change every rate in "${t.name_bn}" by ${n > 0 ? "+" : ""}${n}%?`)) return;
                      start(async () => {
                        const r = await bulkAdjustTier(t.id!, n);
                        setMsg(r.error ?? `Adjusted ${r.count} slab(s) — reload to see.`);
                      });
                    }}
                    className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5"
                  >
                    Adjust %
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Delete tier "${t.name_bn}" and its slabs?`)) return;
                      start(async () => {
                        const r = await deleteTier(t.id!, productId);
                        if (r.error) setMsg(r.error);
                        else {
                          setTiers((cur) => cur.filter((_, j) => j !== i));
                          setMsg("Tier deleted.");
                        }
                      });
                    }}
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {tiers.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink/20 p-4 text-center text-sm text-ink/50">
            No tiers — this product uses the slab table below.
          </p>
        )}
      </div>
    </section>
  );
}
