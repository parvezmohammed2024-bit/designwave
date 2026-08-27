"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";

export type ComboItemInput = {
  product_id: string;
  tier_id: string | null;
  quantity: number;
  override_spec_bn: string;
  sort_order: number;
};

export type ComboInput = {
  id?: string;
  slug: string;
  name_bn: string;
  tagline_bn: string;
  description_bn: string;
  combo_price: number;
  regular_value_override: number | null;
  badge_text_bn: string;
  images: { url: string; alt_bn?: string | null }[];
  active: boolean;
  featured: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_until: string | null;
};

function refresh(slug?: string) {
  revalidatePath("/admin/combos");
  revalidatePath("/collections");
  revalidatePath("/");
  if (slug) revalidatePath(`/combos/${slug}`);
}

export async function saveCombo(combo: ComboInput, items: ComboItemInput[]) {
  await requireStaff();
  if (!combo.slug.trim()) return { error: "Slug is required" };
  if (!combo.name_bn.trim()) return { error: "Bangla name is required" };
  if (combo.combo_price <= 0) return { error: "Combo price must be greater than zero" };
  if (!items.length) return { error: "A combo needs at least one component" };
  if (items.some((i) => !i.product_id)) return { error: "Every line needs a product" };
  if (items.some((i) => i.quantity < 1)) return { error: "Quantities must be at least 1" };

  const sb = serverClient();
  const row = {
    slug: combo.slug.trim(),
    name_bn: combo.name_bn.trim(),
    tagline_bn: combo.tagline_bn || null,
    description_bn: combo.description_bn || null,
    combo_price: combo.combo_price,
    regular_value_override: combo.regular_value_override,
    badge_text_bn: combo.badge_text_bn || null,
    images: combo.images,
    active: combo.active,
    featured: combo.featured,
    sort_order: combo.sort_order,
    valid_from: combo.valid_from,
    valid_until: combo.valid_until,
    updated_at: new Date().toISOString(),
  };

  let id = combo.id;
  if (id) {
    const { error } = await sb.from("dw_combos").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await sb.from("dw_combos").insert(row).select("id").single();
    if (error) return { error: error.message };
    id = data.id;
  }

  await sb.from("dw_combo_items").delete().eq("combo_id", id);
  const { error: itemErr } = await sb.from("dw_combo_items").insert(
    items.map((i, idx) => ({
      combo_id: id,
      product_id: i.product_id,
      tier_id: i.tier_id,
      quantity: i.quantity,
      override_spec_bn: i.override_spec_bn || null,
      sort_order: idx,
    }))
  );
  if (itemErr) return { error: itemErr.message };

  await logActivity(combo.id ? "combo updated" : "combo created", "combo", combo.slug);
  refresh(combo.slug);
  return { ok: true, id };
}

export async function deleteCombo(id: string, slug: string) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb.from("dw_combos").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity("combo deleted", "combo", slug);
  refresh();
  return { ok: true };
}

export async function duplicateCombo(id: string) {
  await requireStaff();
  const sb = serverClient();
  const { data: src } = await sb
    .from("dw_combos")
    .select("*, dw_combo_items(product_id,tier_id,quantity,override_spec_bn,sort_order)")
    .eq("id", id)
    .single();
  if (!src) return { error: "Combo not found" };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { id: _i, created_at: _c, updated_at: _u, dw_combo_items, ...rest } = src as any;
  const { data: copy, error } = await sb
    .from("dw_combos")
    .insert({
      ...rest,
      slug: `${rest.slug}-copy-${Date.now().toString(36).slice(-4)}`,
      name_bn: `${rest.name_bn} (কপি)`,
      active: false,
      featured: false,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (dw_combo_items?.length) {
    await sb
      .from("dw_combo_items")
      .insert(dw_combo_items.map((i: any) => ({ ...i, combo_id: copy.id })));
  }
  await logActivity("combo duplicated", "combo", rest.slug);
  refresh();
  return { ok: true, id: copy.id };
}

export async function toggleCombo(id: string, active: boolean) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb.from("dw_combos").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}
