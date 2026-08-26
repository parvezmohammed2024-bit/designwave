"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";

export type SlideInput = {
  id?: string;
  eyebrow_bn: string;
  headline_bn: string;
  body_bn: string;
  highlight_bn: string;
  cta_label_bn: string;
  cta_href: string;
  bg_color: string;
  image_path: string;
  visual_kind: "photo" | "eid";
  starts_on: string | null;
  ends_on: string | null;
  visible: boolean;
  sort_order: number;
};

function refresh() {
  revalidatePath("/admin/banner");
  revalidatePath("/");
}

export async function saveSlide(slide: SlideInput) {
  await requireStaff();
  if (!slide.headline_bn.trim()) return { error: "Headline is required" };
  const sb = serverClient();

  const row = {
    eyebrow_bn: slide.eyebrow_bn || null,
    headline_bn: slide.headline_bn.trim(),
    body_bn: slide.body_bn || null,
    highlight_bn: slide.highlight_bn || null,
    cta_label_bn: slide.cta_label_bn || null,
    cta_href: slide.cta_href || null,
    bg_color: slide.bg_color || "#6B21A8",
    image_path: slide.image_path || null,
    visual_kind: slide.visual_kind,
    starts_on: slide.starts_on || null,
    ends_on: slide.ends_on || null,
    visible: slide.visible,
    sort_order: slide.sort_order,
  };

  const { error } = slide.id
    ? await sb.from("dw_banner_slides").update(row).eq("id", slide.id)
    : await sb.from("dw_banner_slides").insert(row);
  if (error) return { error: error.message };

  await logActivity(slide.id ? "slide updated" : "slide created", "banner", slide.headline_bn);
  refresh();
  return { ok: true };
}

export async function deleteSlide(id: string) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb.from("dw_banner_slides").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity("slide deleted", "banner", id);
  refresh();
  return { ok: true };
}

/** Generic settings writer — used by content, contact, delivery, payment. */
export async function saveSetting(key: string, value: unknown) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb
    .from("dw_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  await logActivity("setting updated", "setting", key);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/banner");
  return { ok: true };
}
