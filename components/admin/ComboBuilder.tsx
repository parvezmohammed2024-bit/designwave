"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  saveCombo,
  type ComboInput,
  type ComboItemInput,
} from "@/app/admin/combos/actions";
import { tk, toPoisha, toTakaInput } from "@/lib/admin/money";
import { unitPriceFor, type Slab } from "@/lib/pricing";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-ink/50";

export type CatalogueOption = {
  id: string;
  slug: string;
  name_bn: string;
  slabs: Slab[]; // product-level
  tiers: { id: string; name_bn: string; slabs: Slab[] }[];
};

type ItemDraft = {
  product_id: string;
  tier_id: string | null;
  quantity: string;
  override_spec_bn: string;
};

export default function ComboBuilder({
  combo,
  items: initialItems,
  catalogue,
}: {
  combo: Partial<ComboInput> & { id?: string };
  items: ComboItemInput[];
  catalogue: CatalogueOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const [d, setD] = useState({
    id: combo.id,
    slug: combo.slug ?? "",
    name_bn: combo.name_bn ?? "",
    tagline_bn: combo.tagline_bn ?? "",
    description_bn: combo.description_bn ?? "",
    combo_price: toTakaInput(combo.combo_price ?? 0),
    regular_value_override:
      combo.regular_value_override != null
        ? toTakaInput(combo.regular_value_override)
        : "",
    badge_text_bn: combo.badge_text_bn ?? "",
    active: combo.active ?? false,
    featured: combo.featured ?? false,
    sort_order: combo.sort_order ?? 0,
    valid_from: combo.valid_from ?? "",
    valid_until: combo.valid_until ?? "",
    imagesText: (combo.images ?? []).map((i) => i.url).join("\n"),
  });

  const [items, setItems] = useState<ItemDraft[]>(
    initialItems.length
      ? initialItems.map((i) => ({
          product_id: i.product_id,
          tier_id: i.tier_id,
          quantity: String(i.quantity),
          override_spec_bn: i.override_spec_bn ?? "",
        }))
      : [{ product_id: "", tier_id: null, quantity: "100", override_spec_bn: "" }]
  );

  /** live preview — mirrors exactly what the storefront derives */
  const preview = useMemo(() => {
    const lines = items.map((it) => {
      const p = catalogue.find((c) => c.id === it.product_id);
      const qty = parseInt(it.quantity, 10) || 0;
      if (!p) return { name: "—", qty, value: 0 };
      const tier = p.tiers.find((t) => t.id === it.tier_id);
      const slabs = tier ? tier.slabs : p.slabs;
      const unit = unitPriceFor(slabs, qty, 0);
      return {
        name: p.name_bn + (tier ? ` (${tier.name_bn})` : ""),
        qty,
        value: unit * qty,
      };
    });
    const derived = lines.reduce((s, l) => s + l.value, 0);
    const override = d.regular_value_override.trim()
      ? toPoisha(d.regular_value_override)
      : null;
    const regular = override ?? derived;
    const price = toPoisha(d.combo_price);
    return {
      lines,
      derived,
      override,
      regular,
      price,
      savings: regular - price,
      pct: regular > 0 ? Math.round(((regular - price) / regular) * 100) : 0,
    };
  }, [items, catalogue, d.combo_price, d.regular_value_override]);

  const noSaving = preview.price >= preview.regular;
  const belowParts = preview.price < preview.derived;
  const overrideDiverges =
    preview.override != null && Math.abs(preview.override - preview.derived) > 100;

  const submit = () => {
    const payload: ComboInput = {
      id: d.id,
      slug: d.slug,
      name_bn: d.name_bn,
      tagline_bn: d.tagline_bn,
      description_bn: d.description_bn,
      combo_price: toPoisha(d.combo_price),
      regular_value_override: d.regular_value_override.trim()
        ? toPoisha(d.regular_value_override)
        : null,
      badge_text_bn: d.badge_text_bn,
      images: d.imagesText
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
        .map((url) => ({ url })),
      active: d.active,
      featured: d.featured,
      sort_order: Number(d.sort_order) || 0,
      valid_from: d.valid_from || null,
      valid_until: d.valid_until || null,
    };
    const itemPayload: ComboItemInput[] = items.map((i, idx) => ({
      product_id: i.product_id,
      tier_id: i.tier_id,
      quantity: parseInt(i.quantity, 10) || 0,
      override_spec_bn: i.override_spec_bn,
      sort_order: idx,
    }));
    start(async () => {
      const res = await saveCombo(payload, itemPayload);
      if (res.error) setMsg(res.error);
      else {
        setMsg("Saved.");
        if (!d.id && res.id) router.replace(`/admin/combos/${res.id}`);
        else router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={lbl}>
              Bangla name
              <input className={`${input} mt-1 font-normal normal-case`} value={d.name_bn}
                onChange={(e) => setD({ ...d, name_bn: e.target.value })} />
            </label>
            <label className={lbl}>
              Slug
              <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={d.slug}
                onChange={(e) => setD({ ...d, slug: e.target.value })} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>
              Tagline
              <input className={`${input} mt-1 font-normal normal-case`} value={d.tagline_bn}
                onChange={(e) => setD({ ...d, tagline_bn: e.target.value })} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>
              Description
              <textarea rows={2} className={`${input} mt-1 font-normal normal-case`} value={d.description_bn}
                onChange={(e) => setD({ ...d, description_bn: e.target.value })} />
            </label>
            <label className={lbl}>
              Badge text
              <input className={`${input} mt-1 font-normal normal-case`} value={d.badge_text_bn}
                onChange={(e) => setD({ ...d, badge_text_bn: e.target.value })} />
            </label>
            <label className={lbl}>
              Sort order
              <input className={`${input} mt-1 font-normal normal-case`} value={d.sort_order}
                onChange={(e) => setD({ ...d, sort_order: Number(e.target.value) || 0 })} />
            </label>
            <label className={lbl}>
              Live from
              <input type="date" className={`${input} mt-1 font-normal normal-case`} value={d.valid_from}
                onChange={(e) => setD({ ...d, valid_from: e.target.value })} />
            </label>
            <label className={lbl}>
              Expires after
              <input type="date" className={`${input} mt-1 font-normal normal-case`} value={d.valid_until}
                onChange={(e) => setD({ ...d, valid_until: e.target.value })} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>
              Image URLs (one per line)
              <textarea rows={3} dir="ltr" className={`${input} mt-1 font-normal normal-case`}
                value={d.imagesText}
                onChange={(e) => setD({ ...d, imagesText: e.target.value })} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={d.active}
                onChange={(e) => setD({ ...d, active: e.target.checked })} />
              Live on the site
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={d.featured}
                onChange={(e) => setD({ ...d, featured: e.target.checked })} />
              Feature in the homepage band
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Components</h2>
            <button type="button"
              onClick={() => setItems([...items, { product_id: "", tier_id: null, quantity: "100", override_spec_bn: "" }])}
              className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5">
              + Add component
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {items.map((it, i) => {
              const p = catalogue.find((c) => c.id === it.product_id);
              return (
                <div key={i} className="grid gap-2 rounded-xl border border-ink/10 p-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <select className={input} value={it.product_id}
                    onChange={(e) =>
                      setItems(items.map((x, j) => j === i ? { ...x, product_id: e.target.value, tier_id: null } : x))
                    }>
                    <option value="">Choose a product…</option>
                    {catalogue.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_bn}</option>
                    ))}
                  </select>
                  <select className={input} value={it.tier_id ?? ""}
                    disabled={!p?.tiers.length}
                    onChange={(e) =>
                      setItems(items.map((x, j) => j === i ? { ...x, tier_id: e.target.value || null } : x))
                    }>
                    <option value="">{p?.tiers.length ? "Choose tier…" : "no tiers"}</option>
                    {(p?.tiers ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.name_bn}</option>
                    ))}
                  </select>
                  <input className={input} value={it.quantity} inputMode="numeric" placeholder="Qty"
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />
                  <button type="button" aria-label="Remove component"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="rounded-lg border border-ink/20 px-3 text-sm hover:bg-rose-50">✕</button>
                  <input className={`${input} sm:col-span-4`} value={it.override_spec_bn}
                    placeholder="Spec shown on the combo page (optional)"
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, override_spec_bn: e.target.value } : x))} />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* live preview */}
      <div className="space-y-4">
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Pricing</h2>
          <label className={`${lbl} mt-3 block`}>
            Combo price ৳
            <input className={`${input} mt-1 font-normal normal-case`} value={d.combo_price} inputMode="decimal"
              onChange={(e) => setD({ ...d, combo_price: e.target.value })} />
          </label>
          <label className={`${lbl} mt-3 block`}>
            Regular value override ৳
            <input className={`${input} mt-1 font-normal normal-case`} value={d.regular_value_override}
              inputMode="decimal" placeholder="blank = use derived"
              onChange={(e) => setD({ ...d, regular_value_override: e.target.value })} />
          </label>

          <dl className="mt-4 space-y-1 border-t border-ink/10 pt-3 text-sm">
            {preview.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-2 text-xs text-ink/60">
                <dt className="min-w-0 truncate">
                  {l.name} × {l.qty.toLocaleString("en-IN")}
                </dt>
                <dd>{tk(l.value)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink/10 pt-1 font-semibold">
              <dt>Derived value</dt>
              <dd>{tk(preview.derived)}</dd>
            </div>
            {preview.override != null && (
              <div className="flex justify-between text-brand-700">
                <dt>Shown as (override)</dt>
                <dd>{tk(preview.override)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Combo price</dt>
              <dd>{tk(preview.price)}</dd>
            </div>
            <div className={`flex justify-between text-base font-bold ${preview.savings > 0 ? "text-emerald-700" : "text-rose-700"}`}>
              <dt>Saving</dt>
              <dd>{tk(preview.savings)} ({preview.pct}%)</dd>
            </div>
          </dl>

          {noSaving && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              ⚠ The combo price is at or above the regular value — customers
              would see no saving. The cross-sell strip stays hidden while this
              is true.
            </p>
          )}
          {belowParts && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              ⚠ Priced below what the components cost at your own rates
              ({tk(preview.derived)}) — check this is intentional.
            </p>
          )}
          {overrideDiverges && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              ⚠ The override ({tk(preview.override!)}) differs from what your
              live prices actually produce ({tk(preview.derived)}). Customers
              see the override.
            </p>
          )}
        </section>

        <div className="sticky bottom-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-lg">
          {msg && (
            <p className={`mb-2 text-sm font-semibold ${msg === "Saved." ? "text-emerald-700" : "text-rose-700"}`}>
              {msg}
            </p>
          )}
          <button type="button" onClick={submit} disabled={pending}
            className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-paper hover:bg-brand-700 disabled:opacity-60">
            {pending ? "Saving…" : "Save combo"}
          </button>
        </div>
      </div>
    </div>
  );
}
