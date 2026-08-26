"use client";

/**
 * Receipt handling for bKash/Nagad screenshots.
 *
 * Android screenshots are routinely 4–8MB and customers are on mobile data,
 * so images are re-encoded to WebP client-side before upload. Drawing to a
 * canvas and re-encoding also drops ALL EXIF metadata (GPS, device, time) —
 * that is the EXIF strip, not a separate step.
 */

export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_EDGE = 1600; // plenty to read a transaction ID
const QUALITY = 0.82;

export type ReceiptError =
  | "type"
  | "size"
  | "compress"
  | "upload";

export const RECEIPT_ERROR_BN: Record<ReceiptError, string> = {
  type: "শুধু jpg, png, webp বা pdf ফাইল দেওয়া যাবে",
  size: "ফাইলটি ১০MB এর বেশি — ছোট করে আবার চেষ্টা করুন",
  compress: "ছবিটি প্রস্তুত করা যায়নি — অন্য একটি ছবি দিন",
  upload: "আপলোড ব্যর্থ হয়েছে — ইন্টারনেট দেখে আবার চেষ্টা করুন",
};

export function isAcceptedReceipt(file: File): boolean {
  return RECEIPT_ACCEPT.split(",").includes(file.type);
}

/**
 * Re-encode an image to WebP within MAX_EDGE. PDFs pass through untouched
 * (they carry no EXIF and cannot be canvas-encoded).
 * Falls back to the original file if the browser can't encode.
 */
export async function compressReceipt(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("compress");

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("compress");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  );
  if (!blob) throw new Error("compress");

  // keep the original if re-encoding somehow made it bigger
  if (blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
    type: "image/webp",
  });
}

/** receipts/<ORDER_ID>/<stage>-<time>-<rand>.<ext> — validated server-side. */
export function receiptPath(orderId: string, stage: string, file: File): string {
  const ext = file.type === "application/pdf" ? "pdf" : file.name.split(".").pop() ?? "webp";
  const rand = Math.random().toString(36).slice(2, 8);
  return `receipts/${orderId}/${stage}-${Date.now()}-${rand}.${ext}`;
}

export function humanSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}
