"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";
import type { SlabInput } from "./actions";
import { MAX_IMAGES } from "@/lib/admin/catalogLimits";

function refresh() {
  revalidatePath("/admin/products");
  revalidatePath("/collections");
  revalidatePath("/");
}

// ============================ tiers ============================

export type TierInput = {
  id?: string;
  name_bn: string;
  description_bn: string;
  sort_order: number;
  is_default: boolean;
  active: boolean;
};

export async function saveTier(
  productId: string,
  tier: TierInput,
  slabs: SlabInput[]
) {
  await requireStaff();
  if (!tier.name_bn.trim()) return { error: "Tier name is required" };
  if (!slabs.length) return { error: "A tier needs at least one price slab" };

  const sorted = [...slabs].sort((a, b) => a.min_qty - b.min_qty);
  for (const s of sorted) {
    if (s.unit_price <= 0) return { error: "Slab rates must be greater than zero" };
    if (s.max_qty !== null && s.max_qty < s.min_qty)
      return { error: "A slab's max cannot be below its min" };
  }

  const sb = serverClient();
  const row = {
    product_id: productId,
    name_bn: tier.name_bn.trim(),
    description_bn: tier.description_bn || null,
    sort_order: tier.sort_order,
    active: tier.active,
  };

  let tierId = tier.id;
  if (tierId) {
    const { error } = await sb.from("dw_product_tiers").update(row).eq("id", tierId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await sb
      .from("dw_product_tiers")
      .insert({ ...row, is_default: false })
      .select("id")
      .single();
    if (error) return { error: error.message };
    tierId = data.id;
  }

  // only one default per product — clear the others first
  if (tier.is_default) {
    await sb
      .from("dw_product_tiers")
      .update({ is_default: false })
      .eq("product_id", productId)
      .neq("id", tierId);
    await sb.from("dw_product_tiers").update({ is_default: true }).eq("id", tierId);
  }

  await sb.from("dw_price_slabs").delete().eq("tier_id", tierId);
  const { error: slabErr } = await sb
    .from("dw_price_slabs")
    .insert(sorted.map((s) => ({ ...s, product_id: productId, tier_id: tierId })));
  if (slabErr) return { error: slabErr.message };

  await logActivity(`tier saved ${tier.name_bn}`, "product", productId);
  refresh();
  return { ok: true, id: tierId };
}

export async function deleteTier(tierId: string, productId: string) {
  await requireStaff();
  const sb = serverClient();
  const { count } = await sb
    .from("dw_product_tiers")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if ((count ?? 0) <= 1) {
    return {
      error:
        "Delete the last tier and the product would have no pricing. Remove both tiers only via the product's own slabs.",
    };
  }
  const { error } = await sb.from("dw_product_tiers").delete().eq("id", tierId);
  if (error) return { error: error.message };
  await logActivity("tier deleted", "product", productId);
  refresh();
  return { ok: true };
}

/** Shift every slab in one tier by a percentage. */
export async function bulkAdjustTier(tierId: string, percent: number) {
  await requireStaff();
  if (!Number.isFinite(percent) || percent === 0)
    return { error: "Enter a non-zero percentage" };
  const sb = serverClient();
  const { data: slabs, error } = await sb
    .from("dw_price_slabs")
    .select("id,unit_price")
    .eq("tier_id", tierId);
  if (error) return { error: error.message };
  if (!slabs?.length) return { error: "This tier has no slabs" };

  const factor = 1 + percent / 100;
  for (const s of slabs) {
    await sb
      .from("dw_price_slabs")
      .update({ unit_price: Math.max(1, Math.round(s.unit_price * factor)) })
      .eq("id", s.id);
  }
  await logActivity(`tier rates ${percent > 0 ? "+" : ""}${percent}%`, "tier", tierId);
  refresh();
  return { ok: true, count: slabs.length };
}

// ============================ images ============================

export type ImageInput = {
  id?: string;
  url: string;
  alt_bn: string;
  sort_order: number;
  is_primary: boolean;
  tier_id: string | null;
};

export async function saveImages(productId: string, images: ImageInput[]) {
  await requireStaff();
  if (images.length > MAX_IMAGES)
    return { error: `Maximum ${MAX_IMAGES} images per product` };
  if (images.some((i) => !i.url.trim()))
    return { error: "Every image needs a URL" };

  const sb = serverClient();
  // exactly one primary — fall back to the first
  const withPrimary = images.map((i, idx) => ({
    ...i,
    sort_order: idx,
    is_primary: false,
  }));
  const primaryIdx = images.findIndex((i) => i.is_primary);
  if (withPrimary.length) withPrimary[primaryIdx >= 0 ? primaryIdx : 0].is_primary = true;

  await sb.from("dw_product_images").delete().eq("product_id", productId);
  if (withPrimary.length) {
    const { error } = await sb.from("dw_product_images").insert(
      withPrimary.map((i) => ({
        product_id: productId,
        url: i.url.trim(),
        alt_bn: i.alt_bn || null,
        sort_order: i.sort_order,
        is_primary: i.is_primary,
        tier_id: i.tier_id,
      }))
    );
    if (error) return { error: error.message };
  }

  // keep the legacy single-image column pointing at the primary
  const primary = withPrimary.find((i) => i.is_primary);
  await sb
    .from("dw_products")
    .update({ image: primary?.url ?? null, updated_at: new Date().toISOString() })
    .eq("id", productId);

  await logActivity(`images updated (${withPrimary.length})`, "product", productId);
  refresh();
  return { ok: true };
}
