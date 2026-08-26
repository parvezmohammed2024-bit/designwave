/**
 * Static marketing content only. The product catalogue now lives in
 * Supabase (see lib/catalog.ts) so it can be edited from the admin panel
 * without a deploy.
 */
export type Stage = { title: string; detail: string };

export const stages: Stage[] = [
  { title: "ডিজাইন বাছাই", detail: "কালেকশন থেকে পছন্দের ডিজাইন বেছে নিন" },
  { title: "কাস্টমাইজ", detail: "নাম, তারিখ, রঙ — সব আপনার মতো করে" },
  { title: "অ্যাডভান্স পেমেন্ট", detail: "বিকাশ বা নগদে ৫০% অ্যাডভান্স" },
  { title: "প্রিন্ট ও ফিনিশিং", detail: "ফয়েল, এমবস, ডাই-কাট — যত্নে ছাপা" },
  { title: "ডেলিভারি", detail: "সারা দেশে ৩-৫ দিনে পৌঁছে যাবে" },
];
