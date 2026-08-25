const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert English digits in a number/string to Bangla numerals. */
export function toBanglaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Format a price as ৳ with Bangla numerals, e.g. 600 -> ৳৬০০ */
export function formatTaka(amount: number): string {
  return `৳${toBanglaDigits(amount.toLocaleString("en-IN"))}`;
}
