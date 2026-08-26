/**
 * Brand palette for generated documents, taken from the logo
 * (purple "D", blue wave). Single source — PDF code must not
 * hardcode colours anywhere else.
 */
export const BRAND = {
  purple: "#7A22C9",
  purpleDeep: "#4C1D95",
  purpleTint: "#F6EEFE",
  blue: "#0EA5E9",
  blueDeep: "#1D4ED8",
  ink: "#111111",
  inkSoft: "#4A4A4A",
  paper: "#F7F4ED",
  line: "#D9D4CC",
  white: "#FFFFFF",
  danger: "#B3261E",
} as const;

export const COMPANY = {
  name: "Design Wave",
  taglineBn: "কাস্টম কার্ড প্রিন্টিং ও ডিজাইন",
  addressBn: "চট্টগ্রাম, বাংলাদেশ",
  phoneBn: "+৮৮০ ১৮৩৬-০৬৫৯১৯",
  email: "hello@designwave.com",
} as const;

export const PAYMENT_KIND_BN: Record<string, string> = {
  design_charge: "ডিজাইন চার্জ",
  advance: "৫০% অ্যাডভান্স",
  balance: "বাকি পরিশোধ",
};

export const METHOD_BN: Record<string, string> = {
  bKash: "বিকাশ",
  Nagad: "নগদ",
  Cash: "নগদ অর্থ",
  Bank: "ব্যাংক",
};
