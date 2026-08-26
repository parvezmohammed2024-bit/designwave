"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Image from "next/image";
import { adminClient } from "@/lib/admin/client";
import { toPoisha, toTakaInput, tk } from "@/lib/admin/money";
import {
  saveProduct,
  type AddonInput,
  type ProductInput,
  type SlabInput,
} from "@/app/admin/products/actions";

type Draft = Omit<ProductInput, "moq" | "step_quantity" | "base_unit_price"> & {
  moq: string;
  step_quantity: string;
  base_unit_price: string;
};

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-ink/50";

export default function ProductEditor({
  product,
  slabs: initialSlabs,
  addons: initialAddons,
  categories,
}: {
  product: Partial<ProductInput> & { id?: string };
  slabs: SlabInput[];
  addons: AddonInput[];
  categories: { slug: string; name_bn: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const [d, setD] = useState<Draft>({
    id: product.id,
    slug: product.slug ?? "",
    name_bn: product.name_bn ?? "",
    tagline_bn: product.tagline_bn ?? "",
    category_slug: product.category_slug ?? "",
    hue: product.hue ?? "brand",
    image: product.image ?? "",
    status: (product.status as "active" | "draft") ?? "draft",
    featured: product.featured ?? false,
    festive: product.festive ?? false,
    sort_order: product.sort_order ?? 0,
    moq: String(product.moq ?? 100),
    step_quantity: String(product.step_quantity ?? 100),
    base_unit_price: toTakaInput(product.base_unit_price ?? 100),
  });

  // slabs held as taka strings for editing
  const [slabs, setSlabs] = useState(
    (initialSlabs.length
      ? initialSlabs
      : [{ min_qty: 100, max_qty: 499, unit_price: 100 }]
    ).map((s) => ({
      min_qty: String(s.min_qty),
      max_qty: s.max_qty === null ? "" : String(s.max_qty),
      unit_price: toTakaInput(s.unit_price),
    }))
  );

  const [addons, setAddons] = useState(
    initialAddons.map((a) => ({
      name_bn: a.name_bn,
      price: toTakaInput(a.price),
      type: a.type,
      active: a.active,
    }))
  );

  const uploadImage = async (file: File) => {
    setUploading(true);
    setMsg("");
    const sb = adminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "webp";
    const path = `catalogue/${d.slug || "product"}-${Date.now()}.${ext}`;
    const { error } = await sb.storage
      .from("dw-public")
      .upload(path, file, { upsert: true, cacheControl: "31536000" });
    if (error) {
      setUploading(false);
      setMsg(`Upload failed: ${error.message}`);
      return;
    }
    const { data } = sb.storage.from("dw-public").getPublicUrl(path);
    setD((x) => ({ ...x, image: data.publicUrl }));
    setUploading(false);
    setMsg("Image uploaded.");
  };

  const submit = () => {
    const payload: ProductInput = {
      ...d,
      moq: parseInt(d.moq, 10) || 1,
      step_quantity: parseInt(d.step_quantity, 10) || 1,
      base_unit_price: toPoisha(d.base_unit_price),
      sort_order: Number(d.sort_order) || 0,
    };
    const slabPayload: SlabInput[] = slabs.map((s) => ({
      min_qty: parseInt(s.min_qty, 10) || 0,
      max_qty: s.max_qty.trim() === "" ? null : parseInt(s.max_qty, 10),
      unit_price: toPoisha(s.unit_price),
    }));
    const addonPayload: AddonInput[] = addons.map((a) => ({
      name_bn: a.name_bn,
      price: toPoisha(a.price),
      type: a.type,
      active: a.active,
    }));

    start(async () => {
      const res = await saveProduct(payload, slabPayload, addonPayload);
      if (res.error) setMsg(res.error);
      else {
        setMsg("Saved.");
        if (!d.id && res.id) router.replace(`/admin/products/${res.id}`);
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
              <input className={`${input} mt-1 font-normal normal-case`}
                value={d.name_bn} onChange={(e) => setD({ ...d, name_bn: e.target.value })} />
            </label>
            <label className={lbl}>
              Slug (URL)
              <input dir="ltr" className={`${input} mt-1 font-normal normal-case`}
                value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
            </label>
            <label className={`${lbl} sm:col-span-2`}>
              Tagline (Bangla)
              <input className={`${input} mt-1 font-normal normal-case`}
                value={d.tagline_bn} onChange={(e) => setD({ ...d, tagline_bn: e.target.value })} />
            </label>
            <label className={lbl}>
              Category
              <select className={`${input} mt-1 font-normal normal-case`}
                value={d.category_slug} onChange={(e) => setD({ ...d, category_slug: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name_bn}</option>)}
              </select>
            </label>
            <label className={lbl}>
              Fallback colour
              <select className={`${input} mt-1 font-normal normal-case`}
                value={d.hue} onChange={(e) => setD({ ...d, hue: e.target.value })}>
                {["brand", "wave", "ink", "magenta"].map((h) => <option key={h}>{h}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {([
              ["status", "Published", d.status === "active"],
              ["featured", "Feature on homepage", d.featured],
              ["festive", "Festive", d.festive],
            ] as const).map(([key, label, checked]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={checked}
                  onChange={(e) =>
                    setD({
                      ...d,
                      ...(key === "status"
                        ? { status: e.target.checked ? "active" : "draft" }
                        : { [key]: e.target.checked }),
                    } as Draft)
                  } />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2">
              Sort
              <input className="w-16 rounded-lg border border-ink/20 px-2 py-1"
                value={d.sort_order}
                onChange={(e) => setD({ ...d, sort_order: Number(e.target.value) || 0 })} />
            </label>
          </div>
        </section>

        {/* slabs */}
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Price slabs</h2>
            <button type="button"
              onClick={() => setSlabs([...slabs, { min_qty: "", max_qty: "", unit_price: "" }])}
              className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5">
              + Add slab
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/55">
            Rate is per piece, in taka. Leave “Max qty” empty for the open-ended top slab (e.g. 3000+).
          </p>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
              <span>Min qty</span><span>Max qty</span><span>Rate ৳/pc</span><span />
            </div>
            {slabs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input className={input} value={s.min_qty} inputMode="numeric"
                  onChange={(e) => setSlabs(slabs.map((x, j) => j === i ? { ...x, min_qty: e.target.value } : x))} />
                <input className={input} value={s.max_qty} inputMode="numeric" placeholder="∞"
                  onChange={(e) => setSlabs(slabs.map((x, j) => j === i ? { ...x, max_qty: e.target.value } : x))} />
                <input className={input} value={s.unit_price} inputMode="decimal"
                  onChange={(e) => setSlabs(slabs.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))} />
                <button type="button" aria-label="Remove slab"
                  onClick={() => setSlabs(slabs.filter((_, j) => j !== i))}
                  className="rounded-lg border border-ink/20 px-3 text-sm hover:bg-rose-50">✕</button>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-ink/[0.04] p-2 text-xs">
            At MOQ {d.moq || "?"} pcs the customer pays{" "}
            <strong>
              {(() => {
                const moq = parseInt(d.moq, 10) || 0;
                const hit = slabs.find((s) => {
                  const min = parseInt(s.min_qty, 10) || 0;
                  const max = s.max_qty.trim() === "" ? Infinity : parseInt(s.max_qty, 10);
                  return moq >= min && moq <= max;
                });
                return hit ? tk(toPoisha(hit.unit_price) * moq) : "— no slab covers the MOQ";
              })()}
            </strong>
          </p>
        </section>

        {/* add-ons */}
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Add-ons</h2>
            <button type="button"
              onClick={() => setAddons([...addons, { name_bn: "", price: "0", type: "flat", active: true }])}
              className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5">
              + Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {addons.map((a, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto_auto] items-center gap-2">
                <input className={input} placeholder="নাম (বাংলা)" value={a.name_bn}
                  onChange={(e) => setAddons(addons.map((x, j) => j === i ? { ...x, name_bn: e.target.value } : x))} />
                <input className={input} placeholder="৳" value={a.price} inputMode="decimal"
                  onChange={(e) => setAddons(addons.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                <select className={input} value={a.type}
                  onChange={(e) => setAddons(addons.map((x, j) => j === i ? { ...x, type: e.target.value as "flat" | "per_unit" } : x))}>
                  <option value="flat">flat</option>
                  <option value="per_unit">per piece</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={a.active}
                    onChange={(e) => setAddons(addons.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))} />
                  on
                </label>
                <button type="button" aria-label="Remove add-on"
                  onClick={() => setAddons(addons.filter((_, j) => j !== i))}
                  className="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-rose-50">✕</button>
              </div>
            ))}
            {addons.length === 0 && <p className="text-sm text-ink/50">No add-ons.</p>}
          </div>
        </section>
      </div>

      {/* right rail */}
      <div className="space-y-4">
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Quantity rules</h2>
          <label className={`${lbl} mt-3 block`}>
            MOQ (minimum order)
            <input className={`${input} mt-1 font-normal normal-case`} value={d.moq} inputMode="numeric"
              onChange={(e) => setD({ ...d, moq: e.target.value })} />
          </label>
          <label className={`${lbl} mt-3 block`}>
            Step increment
            <input className={`${input} mt-1 font-normal normal-case`} value={d.step_quantity} inputMode="numeric"
              onChange={(e) => setD({ ...d, step_quantity: e.target.value })} />
          </label>
          <label className={`${lbl} mt-3 block`}>
            Fallback rate ৳/pc
            <input className={`${input} mt-1 font-normal normal-case`} value={d.base_unit_price} inputMode="decimal"
              onChange={(e) => setD({ ...d, base_unit_price: e.target.value })} />
          </label>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Image</h2>
          {d.image ? (
            <div className="relative mt-3 aspect-[5/7] overflow-hidden rounded-lg bg-ink/5">
              <Image src={d.image} alt="" fill sizes="240px" className="object-cover" />
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink/50">No image — the branded SVG fallback shows.</p>
          )}
          <input type="file" accept="image/*"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            className="mt-3 w-full text-xs" />
          {uploading && <p className="mt-1 text-xs text-ink/60">Uploading…</p>}
          <label className={`${lbl} mt-3 block`}>
            Or path / URL
            <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={d.image}
              onChange={(e) => setD({ ...d, image: e.target.value })} />
          </label>
        </section>

        <div className="sticky bottom-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-lg">
          {msg && (
            <p className={`mb-2 text-sm font-semibold ${msg === "Saved." || msg.includes("uploaded") ? "text-emerald-700" : "text-rose-700"}`}>
              {msg}
            </p>
          )}
          <button type="button" onClick={submit} disabled={pending}
            className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-paper hover:bg-brand-700 disabled:opacity-60">
            {pending ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}
