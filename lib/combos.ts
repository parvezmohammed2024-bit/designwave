import { supabase } from "./supabase";
import { unitPriceFor, type Slab } from "./pricing";

export type ComboComponent = {
  id: string;
  productId: string;
  slug: string;
  name_bn: string;
  tierId: string | null;
  tierName: string | null;
  quantity: number;
  spec_bn: string | null;
  image: string | null;
  /** poisha for this component at its quantity and tier */
  value: number;
  unitPrice: number;
};

export type ComboImage = { url: string; alt_bn?: string | null };

export type Combo = {
  id: string;
  slug: string;
  name_bn: string;
  tagline_bn: string | null;
  description_bn: string | null;
  /** poisha, fixed */
  combo_price: number;
  badge_text_bn: string | null;
  images: ComboImage[];
  active: boolean;
  featured: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_until: string | null;
  items: ComboComponent[];
  /** sum of the components at live prices — always computed */
  derivedValue: number;
  /** manual figure, when the client advertises a value their prices don't produce */
  overrideValue: number | null;
  /** what the page actually shows as the struck-through price */
  regularValue: number;
  savings: number;
  savingsPct: number;
};

const SELECT = `
  *,
  dw_combo_items(
    id, quantity, override_spec_bn, sort_order, tier_id, product_id,
    dw_products(id, slug, name_bn, image,
      dw_price_slabs(min_qty,max_qty,unit_price,tier_id),
      dw_product_images(url,sort_order,is_primary)),
    dw_product_tiers(id, name_bn, dw_price_slabs(min_qty,max_qty,unit_price))
  )
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function shapeCombo(row: any): Combo {
  const items: ComboComponent[] = ((row.dw_combo_items ?? []) as any[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => {
      const p = i.dw_products ?? {};
      const tier = i.dw_product_tiers ?? null;

      // tier slabs when the item is tier-scoped, else the product's own
      const slabs: Slab[] = tier
        ? ((tier.dw_price_slabs ?? []) as Slab[])
        : ((p.dw_price_slabs ?? []) as (Slab & { tier_id: string | null })[]).filter(
            (s) => !s.tier_id
          );

      const unitPrice = unitPriceFor(slabs, i.quantity, 0);
      const imgs = ((p.dw_product_images ?? []) as any[]).sort((a, b) =>
        a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1
      );

      return {
        id: i.id,
        productId: p.id,
        slug: p.slug,
        name_bn: p.name_bn,
        tierId: tier?.id ?? null,
        tierName: tier?.name_bn ?? null,
        quantity: i.quantity,
        spec_bn: i.override_spec_bn,
        image: imgs[0]?.url ?? p.image ?? null,
        unitPrice,
        value: unitPrice * i.quantity,
      };
    });

  const derivedValue = items.reduce((s, i) => s + i.value, 0);
  const overrideValue: number | null = row.regular_value_override ?? null;
  const regularValue = overrideValue ?? derivedValue;
  const savings = regularValue - row.combo_price;

  return {
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    items,
    derivedValue,
    overrideValue,
    regularValue,
    savings,
    savingsPct: regularValue > 0 ? Math.round((savings / regularValue) * 100) : 0,
  };
}

/** Live combos only: active AND inside their date window. */
function inWindow(c: { valid_from: string | null; valid_until: string | null }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    (!c.valid_from || c.valid_from <= today) &&
    (!c.valid_until || c.valid_until >= today)
  );
}

export async function getCombos(): Promise<Combo[]> {
  const { data, error } = await supabase
    .from("dw_combos")
    .select(SELECT)
    .eq("active", true)
    .order("sort_order");
  if (error || !data) return [];
  return data.map(shapeCombo).filter(inWindow);
}

export async function getComboBySlug(slug: string): Promise<Combo | null> {
  const { data, error } = await supabase
    .from("dw_combos")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const combo = shapeCombo(data);
  return combo.active && inWindow(combo) ? combo : null;
}

/** Every combo, live or not — admin only. */
export async function getAllCombos(): Promise<Combo[]> {
  const { data, error } = await supabase
    .from("dw_combos")
    .select(SELECT)
    .order("sort_order");
  if (error || !data) return [];
  return data.map(shapeCombo);
}

/**
 * Combos this product belongs to, for the cross-sell strip. Only returns a
 * match when the shopper's quantity and tier equal the combo's component,
 * because suggesting an upgrade that isn't like-for-like is misleading.
 */
export function matchingCombos(
  combos: Combo[],
  productSlug: string,
  quantity: number,
  tierId: string | null
): { combo: Combo; component: ComboComponent; others: ComboComponent[] }[] {
  const out: { combo: Combo; component: ComboComponent; others: ComboComponent[] }[] = [];
  for (const combo of combos) {
    if (combo.savings <= 0) continue; // never push a combo that saves nothing
    const component = combo.items.find(
      (i) =>
        i.slug === productSlug &&
        i.quantity === quantity &&
        (i.tierId ?? null) === (tierId ?? null)
    );
    if (!component) continue;
    out.push({
      combo,
      component,
      others: combo.items.filter((i) => i.id !== component.id),
    });
  }
  return out;
}

/** Countdown helper — null when the offer has no end date. */
export function timeRemaining(validUntil: string | null): string | null {
  if (!validUntil) return null;
  const end = new Date(`${validUntil}T23:59:59`).getTime();
  const ms = end - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days} দিন ${hours} ঘণ্টা` : `${hours} ঘণ্টা`;
}
