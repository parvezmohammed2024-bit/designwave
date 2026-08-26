/**
 * Number → Bangla words, for the "কথায়" line on a money receipt.
 * Uses the South Asian scale: শত / হাজার / লক্ষ / কোটি.
 */

const ONES = [
  "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ", "ঊনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তেপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "অষ্টাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই",
];

/** 0–999 */
function underThousand(n: number): string {
  if (n < 100) return ONES[n];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  // "নয়শত" runs together, as on a printed receipt
  return rest === 0 ? `${ONES[h]}শত` : `${ONES[h]}শত ${ONES[rest]}`;
}

/** Whole taka → words, without the trailing "টাকা". */
export function banglaWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  n = Math.floor(n);
  if (n === 0) return ONES[0];

  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1_000);
  const rest = n % 1_000;

  if (crore) parts.push(`${banglaWords(crore)} কোটি`);
  if (lakh) parts.push(`${underThousand(lakh)} লক্ষ`);
  if (thousand) parts.push(`${underThousand(thousand)} হাজার`);
  if (rest) parts.push(underThousand(rest));

  return parts.join(" ");
}

/**
 * Full receipt phrasing from poisha:
 *   97500 -> "নয়শত পঁচাত্তর টাকা মাত্র"
 *   97550 -> "নয়শত পঁচাত্তর টাকা পঞ্চাশ পয়সা মাত্র"
 */
export function takaInWords(poisha: number): string {
  const safe = Math.max(0, Math.round(poisha));
  const taka = Math.floor(safe / 100);
  const paisa = safe % 100;

  const head = `${banglaWords(taka)} টাকা`;
  return paisa > 0
    ? `${head} ${banglaWords(paisa)} পয়সা মাত্র`
    : `${head} মাত্র`;
}
