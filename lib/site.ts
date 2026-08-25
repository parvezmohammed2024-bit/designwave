import { toBanglaDigits } from "./format";

/** Single source of truth for contact and payment details. */
export const PHONE_INTL = "+8801836065919";
export const PHONE_DISPLAY_EN = "+880 1836-065919";
/** Bangla-numeral display: +৮৮০ ১৮৩৬-০৬৫৯১৯ */
export const PHONE_BN = "+" + toBanglaDigits("880") + " " + toBanglaDigits("1836-065919");
export const PAYMENT_NUMBER = "01836-065919";
export const PAYMENT_NUMBER_BN = toBanglaDigits(PAYMENT_NUMBER);
export const DESIGN_CHARGE = 200;
export const DELIVERY_INSIDE_CTG = 80;
export const DELIVERY_OUTSIDE_CTG = 150;

export function waLink(message?: string): string {
  const base = "https://wa.me/8801836065919";
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telLink = `tel:${PHONE_INTL}`;
