"use client";

import { useState, useTransition } from "react";
import { adminClient } from "@/lib/admin/client";
import { deleteSlide, saveSlide, type SlideInput } from "@/app/admin/banner/actions";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-ink/50";

const blank: SlideInput = {
  eyebrow_bn: "",
  headline_bn: "",
  body_bn: "",
  highlight_bn: "",
  cta_label_bn: "",
  cta_href: "",
  bg_color: "#6B21A8",
  image_path: "",
  visual_kind: "photo",
  starts_on: null,
  ends_on: null,
  visible: true,
  sort_order: 99,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function BannerManager({ slides }: { slides: any[] }) {
  const [editing, setEditing] = useState<SlideInput | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const open = (s?: any) =>
    setEditing(
      s
        ? {
            id: s.id,
            eyebrow_bn: s.eyebrow_bn ?? "",
            headline_bn: s.headline_bn ?? "",
            body_bn: s.body_bn ?? "",
            highlight_bn: s.highlight_bn ?? "",
            cta_label_bn: s.cta_label_bn ?? "",
            cta_href: s.cta_href ?? "",
            bg_color: s.bg_color ?? "#6B21A8",
            image_path: s.image_path ?? "",
            visual_kind: s.visual_kind ?? "photo",
            starts_on: s.starts_on,
            ends_on: s.ends_on,
            visible: s.visible,
            sort_order: s.sort_order,
          }
        : { ...blank, sort_order: slides.length + 1 }
    );

  const upload = async (file: File) => {
    const sb = adminClient();
    const path = `banner/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await sb.storage.from("dw-public").upload(path, file, { upsert: true });
    if (error) return setMsg(error.message);
    const { data } = sb.storage.from("dw-public").getPublicUrl(path);
    setEditing((e) => (e ? { ...e, image_path: data.publicUrl } : e));
  };

  const save = () => {
    if (!editing) return;
    start(async () => {
      const res = await saveSlide(editing);
      setMsg(res.error ?? "Slide saved.");
      if (!res.error) setEditing(null);
    });
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Homepage slides</h2>
        <button type="button" onClick={() => open()}
          className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-paper hover:bg-brand-700">
          + New slide
        </button>
      </div>
      {msg && <p className="mt-2 text-sm font-semibold text-brand-700">{msg}</p>}

      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {slides.map((s) => (
          <div key={s.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="p-3 text-paper" style={{ background: s.bg_color }}>
              <p className="text-xs opacity-80">{s.eyebrow_bn}</p>
              <p className="font-bold">{s.headline_bn}</p>
            </div>
            <div className="p-3 text-xs text-ink/60">
              <p>Order {s.sort_order} · {s.visible ? "visible" : "hidden"}</p>
              {(s.starts_on || s.ends_on) && (
                <p className="mt-1 font-semibold text-brand-700">
                  {s.starts_on ?? "…"} → {s.ends_on ?? "…"}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => open(s)}
                  className="rounded-lg border border-ink/20 px-2.5 py-1 font-semibold hover:bg-ink/5">
                  Edit
                </button>
                <button type="button"
                  onClick={() => {
                    if (!confirm("Delete this slide?")) return;
                    start(async () => {
                      const r = await deleteSlide(s.id);
                      setMsg(r.error ?? "Slide deleted.");
                    });
                  }}
                  className="rounded-lg border border-rose-300 px-2.5 py-1 font-semibold text-rose-700 hover:bg-rose-50">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{editing.id ? "Edit slide" : "New slide"}</h3>
              <button type="button" onClick={() => setEditing(null)}
                className="rounded-lg border border-ink/20 px-3 py-1 text-sm">✕</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={lbl}>Eyebrow
                <input className={`${input} mt-1 font-normal normal-case`} value={editing.eyebrow_bn}
                  onChange={(e) => setEditing({ ...editing, eyebrow_bn: e.target.value })} /></label>
              <label className={lbl}>Headline *
                <input className={`${input} mt-1 font-normal normal-case`} value={editing.headline_bn}
                  onChange={(e) => setEditing({ ...editing, headline_bn: e.target.value })} /></label>
              <label className={`${lbl} sm:col-span-2`}>Body
                <textarea rows={2} className={`${input} mt-1 font-normal normal-case`} value={editing.body_bn}
                  onChange={(e) => setEditing({ ...editing, body_bn: e.target.value })} /></label>
              <label className={`${lbl} sm:col-span-2`}>Highlight line
                <input className={`${input} mt-1 font-normal normal-case`} value={editing.highlight_bn}
                  onChange={(e) => setEditing({ ...editing, highlight_bn: e.target.value })} /></label>
              <label className={lbl}>CTA label
                <input className={`${input} mt-1 font-normal normal-case`} value={editing.cta_label_bn}
                  onChange={(e) => setEditing({ ...editing, cta_label_bn: e.target.value })} /></label>
              <label className={lbl}>CTA link
                <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={editing.cta_href}
                  onChange={(e) => setEditing({ ...editing, cta_href: e.target.value })} /></label>
              <label className={lbl}>Background colour
                <span className="mt-1 flex gap-2">
                  <input type="color" value={editing.bg_color} className="h-10 w-12 rounded border border-ink/20"
                    onChange={(e) => setEditing({ ...editing, bg_color: e.target.value })} />
                  <input dir="ltr" className={`${input} font-normal normal-case`} value={editing.bg_color}
                    onChange={(e) => setEditing({ ...editing, bg_color: e.target.value })} />
                </span></label>
              <label className={lbl}>Visual
                <select className={`${input} mt-1 font-normal normal-case`} value={editing.visual_kind}
                  onChange={(e) => setEditing({ ...editing, visual_kind: e.target.value as "photo" | "eid" })}>
                  <option value="photo">Photo</option>
                  <option value="eid">Eid crescent illustration</option>
                </select></label>
              <label className={`${lbl} sm:col-span-2`}>Image
                <input type="file" accept="image/*" className="mt-1 w-full text-xs"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={editing.image_path}
                  onChange={(e) => setEditing({ ...editing, image_path: e.target.value })} /></label>
              <label className={lbl}>Starts on
                <input type="date" className={`${input} mt-1 font-normal normal-case`} value={editing.starts_on ?? ""}
                  onChange={(e) => setEditing({ ...editing, starts_on: e.target.value || null })} /></label>
              <label className={lbl}>Ends on
                <input type="date" className={`${input} mt-1 font-normal normal-case`} value={editing.ends_on ?? ""}
                  onChange={(e) => setEditing({ ...editing, ends_on: e.target.value || null })} /></label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.visible}
                  onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} /> Visible
              </label>
              <label className={lbl}>Sort order
                <input className={`${input} mt-1 font-normal normal-case`} value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} /></label>
            </div>

            <button type="button" onClick={save} disabled={pending}
              className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-paper hover:bg-brand-700 disabled:opacity-60">
              {pending ? "Saving…" : "Save slide"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
