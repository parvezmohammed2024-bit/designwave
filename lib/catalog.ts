import { supabase } from "./supabase";
import type { Addon, Slab } from "./pricing";

export type Hue = "brand" | "wave" | "ink" | "magenta";

export type Product = {
  id: string;
  slug: string;
  name_bn: string;
  tagline_bn: string | null;
  category_slug: string | null;
  hue: Hue;
  image: string | null;
  blur_data_url: string | null;
  moq: number;
  step_quantity: number;
  base_unit_price: number;
  featured: boolean;
  festive: boolean;
  sort_order: number;
  slabs: Slab[];
  addons: Addon[];
};

export type BannerSlide = {
  id: string;
  eyebrow_bn: string | null;
  headline_bn: string;
  body_bn: string | null;
  highlight_bn: string | null;
  cta_label_bn: string | null;
  cta_href: string | null;
  bg_color: string;
  image_path: string | null;
  visual_kind: "photo" | "eid";
  sort_order: number;
};

const PRODUCT_SELECT =
  "*, dw_price_slabs(min_qty,max_qty,unit_price), dw_addons(id,name_bn,price,type,active)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function shape(row: any): Product {
  return {
    ...row,
    slabs: ((row.dw_price_slabs ?? []) as Slab[]).sort(
      (a, b) => a.min_qty - b.min_qty
    ),
    addons: ((row.dw_addons ?? []) as (Addon & { active: boolean })[]).filter(
      (a) => a.active
    ),
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("dw_products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .order("sort_order");
  if (error || !data) return [];
  return data.map(shape);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.featured);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("dw_products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;
  return shape(data);
}

export async function getBannerSlides(): Promise<BannerSlide[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("dw_banner_slides")
    .select("*")
    .eq("visible", true)
    .order("sort_order");
  if (error || !data) return [];
  // date-window filter: slides schedule themselves in and out (e.g. Eid)
  return data.filter(
    (s: any) =>
      (!s.starts_on || s.starts_on <= today) && (!s.ends_on || s.ends_on >= today)
  );
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("dw_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return data.value as T;
}

export type DeliverySettings = { inside_ctg: number; outside_ctg: number };
export type PaymentSettings = {
  bkash: string;
  nagad: string;
  design_charge: number;
};
export type ContactSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  hours_bn: string;
  address_bn: string;
};
export type TrustStat = { value: number; suffix: string; label_bn: string };
export type CategoryTile = { slug: string; name_bn: string; detail_bn: string };

export const DEFAULT_CATEGORIES: CategoryTile[] = [
  { slug: "business", name_bn: "বিজনেস কার্ড", detail_bn: "স্ট্যান্ডার্ড থেকে ডাই-কাট প্রিমিয়াম" },
  { slug: "eid", name_bn: "ঈদ কালেকশন", detail_bn: "সালামি খাম, উইশ কার্ড, গিফট ট্যাগ" },
  { slug: "wedding", name_bn: "ওয়েডিং", detail_bn: "ওয়েলকাম কার্ড ও গিফট নোট" },
  { slug: "packaging", name_bn: "স্টিকার ও প্যাকেজিং", detail_bn: "লোগো স্টিকার, পার্সেল ব্র্যান্ডিং" },
  { slug: "promo", name_bn: "প্রোমো ও লয়্যালটি", detail_bn: "থ্যাংক ইউ, স্ক্র্যাচ, কুপন কার্ড" },
  { slug: "combo", name_bn: "কম্বো প্যাকেজ", detail_bn: "সব মিলিয়ে এক প্যাকেজে" },
];
