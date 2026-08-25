export type QuantityTier = { qty: number; price: number };

export type Collection = {
  slug: string;
  name: string; // Bangla display name
  tagline: string; // Bangla
  priceFrom: number;
  hue: "brand" | "wave" | "ink" | "magenta";
  /**
   * Product photo, served from /public. To swap in the client's own
   * photography: drop the new file in public/products/ and change this
   * one path — no code changes anywhere else.
   */
  image: string;
  /** Tiny base64 blur-up placeholder for next/image. */
  blurDataURL?: string;
  festive?: boolean;
  /** Shown in the home-page deck fan (max 5). */
  featured?: boolean;
  /** Order quantities the customer picks from (variant, required). */
  quantityTiers: QuantityTier[];
  /** Offers a glossy/matt lamination choice. */
  lamination?: boolean;
};

export const LAMINATION_OPTIONS = ["গ্লসি", "ম্যাট"] as const;

export const collections: Collection[] = [
  {
    slug: "business-standard",
    name: "স্ট্যান্ডার্ড বিজনেস কার্ড",
    tagline: "প্রথম পরিচয়েই স্পষ্ট ছাপ",
    priceFrom: 600,
    hue: "ink",
    image: "/products/business-standard.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAQAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JQAALU+fedwAA/uc1Xt1NHn7QMYfnogLNS+jOkumqkQC7XAURxLNhD9W9/rIbnA2DfnRCx3L5f3CAAAA=",
    featured: true,
    quantityTiers: [
      { qty: 100, price: 600 },
      { qty: 250, price: 1200 },
      { qty: 500, price: 2000 },
    ],
    lamination: true,
  },
  {
    slug: "business-diecut",
    name: "প্রিমিয়াম থ্রিডি ও ডাই-কাট বিজনেস কার্ড",
    tagline: "আকৃতিতেই আলাদা, হাতে নিলেই বোঝা যায়",
    priceFrom: 1500,
    hue: "brand",
    image: "/products/business-diecut.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAAAwAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JaQAAW+uBtSuAAP7tWQg5IF4lUBIBexuSxKqGtVd+ZEAA",
    featured: true,
    quantityTiers: [
      { qty: 100, price: 1500 },
      { qty: 250, price: 3200 },
      { qty: 500, price: 5500 },
    ],
    lamination: true,
  },
  {
    slug: "popup-card",
    name: "কাস্টম ডাই-কাট পপ-আপ কার্ড",
    tagline: "খুললেই দাঁড়িয়ে যায় আপনার গল্প",
    priceFrom: 2500,
    hue: "magenta",
    image: "/products/popup-card.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRowAAABXRUJQVlA4IIAAAADQAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JYgC06BuygfK8Vlz4oKAA/tBwA+037LyKRySgUct3eniBYr8Tzl8JuYjiL5jvqyd03goxyutzBIAN13alCqwCX4A1nQtaqu+x5Jni2wao2BiYH/dF51J8v4SajV8OaG2PF/p/XgAAAA==",
    featured: true,
    quantityTiers: [
      { qty: 10, price: 2500 },
      { qty: 25, price: 5500 },
      { qty: 50, price: 9500 },
    ],
  },
  {
    slug: "stickers",
    name: "প্যাকেজিং ও লোগো স্টিকার",
    tagline: "প্রতিটি পার্সেলে আপনার ব্র্যান্ড",
    priceFrom: 400,
    hue: "wave",
    image: "/products/stickers.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAACwAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JZQCw7BtIOGAPzvXpgADa2MJ7gFvWOGWvspoh29B3iZGSQQyZkEuAFL8RRezOPQQIXIe+ZRG1/lKlRvHSQV/QSLPBT2A0ECiAAA==",
    featured: true,
    quantityTiers: [
      { qty: 100, price: 400 },
      { qty: 300, price: 1000 },
      { qty: 500, price: 1500 },
    ],
  },
  {
    slug: "thankyou-cards",
    name: "থ্যাংক ইউ ও ডিসকাউন্ট কার্ড",
    tagline: "ছোট্ট কার্ড, ফিরে আসা কাস্টমার",
    priceFrom: 500,
    hue: "wave",
    image: "/products/thankyou-cards.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAADwAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JYgCdFQgASh994mzz0qNAAP1v565OwAc9c/KKNd9WAiYKn7tD3aYfNXHRYDN9V0mnn3GYbbJPggF/9DQ+RSF+OaI00Y+yzZegW/tmfeTJmRbWZMDENVAX1TSoXAAA",
    quantityTiers: [
      { qty: 100, price: 500 },
      { qty: 250, price: 1000 },
      { qty: 500, price: 1800 },
    ],
    lamination: true,
  },
  {
    slug: "eid-envelope",
    name: "ঈদ সালামি খাম",
    tagline: "সালামির আনন্দ, ছাপা খামে",
    priceFrom: 800,
    hue: "brand",
    image: "/products/eid-envelope.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAABwAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JagCw7B49mWhHtUgA/qWDulHFpTOcIMrsmwckjfjAEoS/LDbWfUMSbt7lozyl/tD1WLIv5cvIZz9/99pXOTybpFIFP1wA",
    festive: true,
    featured: true,
    quantityTiers: [
      { qty: 50, price: 800 },
      { qty: 100, price: 1400 },
      { qty: 200, price: 2500 },
    ],
  },
  {
    slug: "eid-wish-set",
    name: "ঈদ উইশ কার্ড ও গিফট ট্যাগ সেট",
    tagline: "চাঁদরাতের শুভেচ্ছা, সেট মিলিয়ে",
    priceFrom: 1200,
    hue: "brand",
    image: "/products/eid-wish-set.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRnQAAABXRUJQVlA4IGgAAADQAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JZQCdAYtox7uKa7HSOeAA/rIIFUgyNN4dZbavVGxDMqPP9MXlcafZx3u8E2jDrOCz5HVwwWvNLuFG8TLKVBIluIaDeiUZAh7fTLHstuAAAA==",
    festive: true,
    quantityTiers: [
      { qty: 25, price: 1200 },
      { qty: 50, price: 2200 },
      { qty: 100, price: 4000 },
    ],
  },
  {
    slug: "wedding-welcome",
    name: "ওয়েডিং ওয়েলকাম কার্ড",
    tagline: "অতিথি বরণের প্রথম ছোঁয়া",
    priceFrom: 2000,
    hue: "magenta",
    image: "/products/wedding-welcome.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAACwAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JQAAL3eIejj3n+lilIAD+052QNFvZ23ibwzmATbl0In9HmJ6/oTHvC23YhhtO1RXH/J2QyJRcKXh4wV0pXguPegAAAA==",
    quantityTiers: [
      { qty: 10, price: 2000 },
      { qty: 25, price: 4500 },
      { qty: 50, price: 8000 },
    ],
  },
  {
    slug: "wedding-gift-note",
    name: "ওয়েডিং গিফট নোট",
    tagline: "উপহারের সাথে দুটি মনের কথা",
    priceFrom: 900,
    hue: "magenta",
    image: "/products/wedding-gift-note.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAACQAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JZQDCgBH5G49BUFdgAP5UEmc1HuOm+lBWfVPnlAEMjJ+q6oRFMakht9AkjVIgU6oh/8eE9ya2E78uFRrfVdDMbHKs5GXHIAA=",
    quantityTiers: [
      { qty: 50, price: 900 },
      { qty: 100, price: 1600 },
      { qty: 200, price: 2800 },
    ],
  },
  {
    slug: "scratch-card",
    name: "স্ক্র্যাচ কার্ড",
    tagline: "ঘষলেই চমক — অফার লুকিয়ে আছে",
    priceFrom: 1000,
    hue: "ink",
    image: "/products/scratch-card.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAADQBACdASoMABEAPu1iqU2ppaOiMAgBMB2JbACdL144HWAFQAJUmzUWticwTldK2AD+5pOddw9xE6QZS1qoVLpUQ6gtqI9R8wIVFsUqny1uswO5jsJIGCuNwfKJ50W1ULTfLSs8siCNGTmMOtLJYohxhEGrg6xc6cdk/m8F9IOeV21XxJjvcAAA",
    quantityTiers: [
      { qty: 100, price: 1000 },
      { qty: 250, price: 2200 },
      { qty: 500, price: 4000 },
    ],
  },
  {
    slug: "coupon-card",
    name: "কুপন কার্ড",
    tagline: "হাতে হাতে ফেরে আপনার অফার",
    priceFrom: 700,
    hue: "wave",
    image: "/products/coupon-card.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAAAwBACdASoMABEAPu1iqU2ppaOiMAgBMB2JbACdLwABelnJ22yumXiJ8AAA/kTaS42gUD1S1iW9SrAPC8NcxWJU3twn+icXl4WCdgfvhlQ0A7+m57Sp7rAG9D5/vd+yvQGHDlm45sM2pKmA5tFnQXNYMLMO2jnpDUKG3J0wqz4lCAAA",
    quantityTiers: [
      { qty: 100, price: 700 },
      { qty: 250, price: 1500 },
      { qty: 500, price: 2500 },
    ],
  },
  {
    slug: "combos",
    name: "কম্বো প্যাকেজ",
    tagline: "কার্ড, স্টিকার, ট্যাগ — এক প্যাকেজে সব",
    priceFrom: 2500,
    hue: "brand",
    image: "/products/combos.webp",
    blurDataURL:
      "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADQAwCdASoMABEAPu1iqU2ppaOiMAgBMB2JZQCuHCBvze43irENAgAA+V2ULBnFH/bqCVFmm0/yVoXxqwfPbkTHA7phGokbTWtH9c2x4nhZuoAA",
    quantityTiers: [
      { qty: 1, price: 2500 },
      { qty: 2, price: 4500 },
      { qty: 5, price: 10000 },
    ],
  },
];

export const featuredCollections = collections.filter((c) => c.featured);

export function getProduct(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

/** The six merchandising groups shown on the home page grid. */
export type Category = {
  slug: string;
  name: string;
  detail: string;
  productSlugs: string[];
};

export const categories: Category[] = [
  {
    slug: "business",
    name: "বিজনেস কার্ড",
    detail: "স্ট্যান্ডার্ড থেকে ডাই-কাট প্রিমিয়াম",
    productSlugs: ["business-standard", "business-diecut"],
  },
  {
    slug: "eid",
    name: "ঈদ কালেকশন",
    detail: "সালামি খাম, উইশ কার্ড, গিফট ট্যাগ",
    productSlugs: ["eid-envelope", "eid-wish-set"],
  },
  {
    slug: "wedding",
    name: "ওয়েডিং",
    detail: "ওয়েলকাম কার্ড ও গিফট নোট",
    productSlugs: ["wedding-welcome", "wedding-gift-note"],
  },
  {
    slug: "packaging",
    name: "স্টিকার ও প্যাকেজিং",
    detail: "লোগো স্টিকার, পার্সেল ব্র্যান্ডিং",
    productSlugs: ["stickers"],
  },
  {
    slug: "promo",
    name: "প্রোমো ও লয়্যালটি",
    detail: "থ্যাংক ইউ, স্ক্র্যাচ, কুপন কার্ড",
    productSlugs: ["thankyou-cards", "scratch-card", "coupon-card"],
  },
  {
    slug: "combo",
    name: "কম্বো প্যাকেজ",
    detail: "সব মিলিয়ে এক প্যাকেজে",
    productSlugs: ["combos"],
  },
];

export type Stage = {
  title: string;
  detail: string;
};

export const stages: Stage[] = [
  { title: "ডিজাইন বাছাই", detail: "কালেকশন থেকে পছন্দের ডিজাইন বেছে নিন" },
  { title: "কাস্টমাইজ", detail: "নাম, তারিখ, রঙ — সব আপনার মতো করে" },
  { title: "অ্যাডভান্স পেমেন্ট", detail: "বিকাশ বা নগদে ৫০% অ্যাডভান্স" },
  { title: "প্রিন্ট ও ফিনিশিং", detail: "ফয়েল, এমবস, ডাই-কাট — যত্নে ছাপা" },
  { title: "ডেলিভারি", detail: "সারা দেশে ৩-৫ দিনে পৌঁছে যাবে" },
];
