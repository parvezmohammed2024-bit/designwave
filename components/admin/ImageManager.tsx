"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { adminClient } from "@/lib/admin/client";
import { saveImages, type ImageInput } from "@/app/admin/products/catalogActions";
import { MAX_IMAGES } from "@/lib/admin/catalogLimits";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";

/** Upload, reorder (drag), set primary, tag to a tier, delete. Max 8. */
export default function ImageManager({
  productId,
  slug,
  initial,
  tiers,
}: {
  productId: string;
  slug: string;
  initial: ImageInput[];
  tiers: { id: string; name_bn: string }[];
}) {
  const [images, setImages] = useState<ImageInput[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const upload = async (files: FileList) => {
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return setMsg(`Maximum ${MAX_IMAGES} images.`);
    setBusy(true);
    setMsg("");
    const sb = adminClient();
    const added: ImageInput[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "webp";
      const path = `catalogue/${slug || "product"}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`;
      const { error } = await sb.storage
        .from("dw-public")
        .upload(path, file, { upsert: true, cacheControl: "31536000" });
      if (error) {
        setMsg(`Upload failed: ${error.message}`);
        continue;
      }
      const { data } = sb.storage.from("dw-public").getPublicUrl(path);
      added.push({
        url: data.publicUrl,
        alt_bn: "",
        sort_order: images.length + added.length,
        is_primary: images.length === 0 && added.length === 0,
        tier_id: null,
      });
    }
    setImages((cur) => [...cur, ...added]);
    setBusy(false);
  };

  const move = (from: number, to: number) => {
    setImages((cur) => {
      const next = [...cur];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((i, idx) => ({ ...i, sort_order: idx }));
    });
  };

  const persist = () =>
    start(async () => {
      const res = await saveImages(productId, images);
      setMsg(res.error ?? "Images saved.");
    });

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">
          Images{" "}
          <span className="text-sm font-normal text-ink/50">
            {images.length}/{MAX_IMAGES}
          </span>
        </h2>
        <button
          type="button"
          onClick={persist}
          disabled={pending || busy}
          className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-paper hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save images"}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink/55">
        Drag to reorder. The first image is what the grid card shows first.
      </p>
      {msg && (
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {msg}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {images.map((img, i) => (
          <li
            key={`${img.url}-${i}`}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
              setDragIndex(null);
            }}
            className={`flex gap-3 rounded-xl border p-2 ${
              dragIndex === i ? "border-brand-700 bg-brand-50" : "border-ink/10"
            }`}
          >
            <span className="cursor-grab select-none self-center px-1 text-ink/40" aria-hidden>
              ⠿
            </span>
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/5">
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <input
                className={input}
                placeholder="Alt text (Bangla)"
                value={img.alt_bn}
                onChange={(e) =>
                  setImages((cur) =>
                    cur.map((x, j) => (j === i ? { ...x, alt_bn: e.target.value } : x))
                  )
                }
              />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="primary-image"
                    checked={img.is_primary}
                    onChange={() =>
                      setImages((cur) =>
                        cur.map((x, j) => ({ ...x, is_primary: j === i }))
                      )
                    }
                  />
                  primary
                </label>
                {tiers.length > 1 && (
                  <select
                    value={img.tier_id ?? ""}
                    onChange={(e) =>
                      setImages((cur) =>
                        cur.map((x, j) =>
                          j === i ? { ...x, tier_id: e.target.value || null } : x
                        )
                      )
                    }
                    className="rounded-lg border border-ink/20 px-2 py-1"
                  >
                    <option value="">all tiers</option>
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name_bn} only
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => move(i, Math.max(0, i - 1))}
                  disabled={i === 0}
                  className="rounded border border-ink/20 px-2 py-0.5 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, Math.min(images.length - 1, i + 1))}
                  disabled={i === images.length - 1}
                  className="rounded border border-ink/20 px-2 py-0.5 disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImages((cur) => cur.filter((_, j) => j !== i))
                  }
                  className="rounded border border-rose-300 px-2 py-0.5 font-semibold text-rose-700 hover:bg-rose-50"
                >
                  remove
                </button>
              </div>
            </div>
          </li>
        ))}
        {images.length === 0 && (
          <li className="rounded-xl border border-dashed border-ink/20 p-4 text-center text-sm text-ink/50">
            No images yet — the branded SVG fallback will show.
          </li>
        )}
      </ul>

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={busy || images.length >= MAX_IMAGES}
        onChange={(e) => e.target.files && upload(e.target.files)}
        className="mt-3 w-full text-xs"
      />
      {busy && <p className="mt-1 text-xs text-ink/60">Uploading…</p>}
    </section>
  );
}
