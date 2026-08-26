import { toBanglaDigits } from "./format";

/**
 * Build-time fallbacks. The live values are editable from the admin panel
 * (dw_settings). Money is INTEGER POISHA.
 */
export const PHONE_INTL = "+8801836065919";
export const PHONE_DISPLAY_EN = "+880 1836-065919";
/** +৮৮০ ১৮৩৬-০৬৫৯১৯ */
export const PHONE_BN = "+" + toBanglaDigits("880") + " " + toBanglaDigits("1836-065919");
export const PAYMENT_NUMBER = "01836-065919";
export const PAYMENT_NUMBER_BN = toBanglaDigits(PAYMENT_NUMBER);

export const DESIGN_CHARGE = 20_000; // ৳200
export const DELIVERY_INSIDE_CTG = 8_000; // ৳80
export const DELIVERY_OUTSIDE_CTG = 15_000; // ৳150

export function waLink(message?: string, phone = "8801836065919"): string {
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telLink = `tel:${PHONE_INTL}`;

/** Bangla-numeral phone from any raw international number. */
export function phoneToBn(intl: string): string {
  const digits = intl.replace(/^\+?880/, "");
  return "+" + toBanglaDigits("880") + " " + toBanglaDigits(digits);
}
