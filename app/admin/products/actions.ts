"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";

export type SlabInput = { min_qty: number; max_qty: number | null; unit_price: number };
export type AddonInput = {
  id?: string;
  name_bn: string;
  price: number;
  type: "flat" | "per_unit";
  active: boolean;
};

export type ProductInput = {
  id?: string;
  slug: string;
  name_bn: string;
  tagline_bn: string;
  category_slug: string;
  hue: string;
  image: string;
  moq: number;
  step_quantity: number;
  base_unit_price: number;
  status: "active" | "draft";
  featured: boolean;
  festive: boolean;
  sort_order: number;
};

function refresh() {
  revalidatePath("/admin/products");
  revalidatePath("/collections");
  revalidatePath("/");
}

export async function saveProduct(
  product: ProductInput,
  slabs: SlabInput[],
  addons: AddonInput[]
) {
  await requireStaff();
  const sb = serverClient();

  if (!product.slug.trim()) return { error: "Slug is required" };
  if (!product.name_bn.trim()) return { error: "Bangla name is required" };
  if (product.moq < 1) return { error: "MOQ must be at least 1" };
  if (product.step_quantity < 1) return { error: "Step must be at least 1" };
  if (!slabs.length) return { error: "Add at least one price slab" };

  const sorted = [...slabs].sort((a, b) => a.min_qty - b.min_qty);
  if (sorted[0].min_qty > product.moq) {
    return { error: `The lowest slab must start at or below the MOQ (${product.moq})` };
  }
  for (const s of sorted) {
    if (s.unit_price <= 0) return { error: "Slab rates must be greater than zero" };
    if (s.max_qty !== null && s.max_qty < s.min_qty)
      return { error: "A slab's max cannot be below its min" };
  }

  let productId = product.id;
  const row = {
    slug: product.slug.trim(),
    name_bn: product.name_bn.trim(),
    tagline_bn: product.tagline_bn || null,
    category_slug: product.category_slug || null,
    hue: product.hue,
    image: product.image || null,
    moq: product.moq,
    step_quantity: product.step_quantity,
    base_unit_price: product.base_unit_price,
    status: product.status,
    featured: product.featured,
    festive: product.festive,
    sort_order: product.sort_order,
    updated_at: new Date().toISOString(),
  };

  if (productId) {
    const { error } = await sb.from("dw_products").update(row).eq("id", productId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await sb.from("dw_products").insert(row).select("id").single();
    if (error) return { error: error.message };
    productId = data.id;
  }

  // slabs and add-ons are small sets — replace wholesale
  await sb.from("dw_price_slabs").delete().eq("product_id", productId);
  const { error: slabErr } = await sb
    .from("dw_price_slabs")
    .insert(sorted.map((s) => ({ ...s, product_id: productId })));
  if (slabErr) return { error: slabErr.message };

  await sb.from("dw_addons").delete().eq("product_id", productId);
  if (addons.length) {
    const { error: addonErr } = await sb
      .from("dw_addons")
      .insert(
        addons
          .filter((a) => a.name_bn.trim())
          .map((a) => ({
            product_id: productId,
            name_bn: a.name_bn.trim(),
            price: a.price,
            type: a.type,
            active: a.active,
          }))
      );
    if (addonErr) return { error: addonErr.message };
  }

  await logActivity(product.id ? "product updated" : "product created", "product", product.slug);
  refresh();
  return { ok: true, id: productId };
}

export async function deleteProduct(id: string, slug: string) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb.from("dw_products").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity("product deleted", "product", slug);
  refresh();
  return { ok: true };
}

export async function duplicateProduct(id: string) {
  await requireStaff();
  const sb = serverClient();

  const { data: src } = await sb
    .from("dw_products")
    .select("*, dw_price_slabs(min_qty,max_qty,unit_price), dw_addons(name_bn,price,type,active)")
    .eq("id", id)
    .single();
  if (!src) return { error: "Product not found" };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { id: _i, created_at: _c, updated_at: _u, dw_price_slabs, dw_addons, ...rest } =
    src as any;

  const { data: copy, error } = await sb
    .from("dw_products")
    .insert({
      ...rest,
      slug: `${rest.slug}-copy-${Date.now().toString(36).slice(-4)}`,
      name_bn: `${rest.name_bn} (কপি)`,
      status: "draft",
      featured: false,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (dw_price_slabs?.length) {
    await sb
      .from("dw_price_slabs")
      .insert(dw_price_slabs.map((s: any) => ({ ...s, product_id: copy.id })));
  }
  if (dw_addons?.length) {
    await sb
      .from("dw_addons")
      .insert(dw_addons.map((a: any) => ({ ...a, product_id: copy.id })));
  }

  await logActivity("product duplicated", "product", rest.slug);
  refresh();
  return { ok: true, id: copy.id };
}

export async function toggleStatus(id: string, status: "active" | "draft") {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb.from("dw_products").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { ok: true };
}

/** Raise/lower every slab in a category by a percentage. */
export async function bulkPriceChange(categorySlug: string, percent: number) {
  await requireStaff();
  if (!Number.isFinite(percent) || percent === 0) return { error: "Enter a non-zero percentage" };
  const sb = serverClient();

  let q = sb.from("dw_products").select("id,slug");
  if (categorySlug) q = q.eq("category_slug", categorySlug);
  const { data: products, error } = await q;
  if (error) return { error: error.message };
  if (!products?.length) return { error: "No products in that category" };

  const ids = products.map((p) => p.id);
  const { data: slabs } = await sb
    .from("dw_price_slabs")
    .select("id,unit_price")
    .in("product_id", ids);
  if (!slabs?.length) return { error: "No slabs to update" };

  const factor = 1 + percent / 100;
  for (const s of slabs) {
    await sb
      .from("dw_price_slabs")
      .update({ unit_price: Math.max(1, Math.round(s.unit_price * factor)) })
      .eq("id", s.id);
  }

  await logActivity(
    `bulk price ${percent > 0 ? "+" : ""}${percent}% (${categorySlug || "all"})`,
    "product",
    categorySlug || "all"
  );
  refresh();
  return { ok: true, count: slabs.length };
}
