import "server-only";
import path from "path";
import { readFile } from "fs/promises";
import sharp from "sharp";
import QRCode from "qrcode";
import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { ReceiptDocument, type ReceiptData } from "./ReceiptDocument";
import { BRAND } from "./theme";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

let fontsReady = false;
/**
 * Register Hind Siliguri once. fontkit applies the Indic shaper, so Bangla
 * conjuncts (যুক্তাক্ষর) come out correctly rather than as broken glyphs.
 */
function ensureFonts() {
  if (fontsReady) return;
  Font.register({
    family: "Hind",
    fonts: [
      { src: path.join(FONT_DIR, "HindSiliguri-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "HindSiliguri-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "HindSiliguri-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Bangla has no hyphenation; stop the default engine splitting words.
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

let logoCache: string | null = null;
/** Logo rasterised at ~300 DPI for the print size it occupies. */
async function logoDataUri(): Promise<string> {
  if (logoCache) return logoCache;
  const svg = await readFile(path.join(process.cwd(), "public", "logo.svg"));
  const png = await sharp(svg, { density: 600 })
    .resize({ width: 1200, fit: "inside" })
    .png()
    .toBuffer();
  logoCache = `data:image/png;base64,${png.toString("base64")}`;
  return logoCache;
}

async function qrDataUri(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: { dark: BRAND.ink, light: "#FFFFFF" },
  });
}

export type BuildInput = Omit<ReceiptData, "logoPng" | "qrPng"> & {
  verifyUrl: string;
};

export async function buildReceiptPdf(input: BuildInput): Promise<Buffer> {
  ensureFonts();
  const [logoPng, qrPng] = await Promise.all([
    logoDataUri(),
    qrDataUri(input.verifyUrl),
  ]);
  // ReceiptDocument returns a <Document>; the prop types differ from
  // DocumentProps so the element is narrowed for renderToBuffer.
  const element = React.createElement(ReceiptDocument, {
    ...input,
    logoPng,
    qrPng,
  }) as React.ReactElement<DocumentProps>;

  return renderToBuffer(element);
}

/** Descriptive download name, e.g. DW-RCP-0001-মোহাম্মদ-রহিম.pdf */
export function receiptFileName(receiptNo: string, customer: string, ext = "pdf") {
  // Keep combining marks (\p{M}) — Bangla vowel signs and hasant are marks,
  // and stripping them shreds the name into single consonants.
  const slug = customer
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${receiptNo}${slug ? "-" + slug : ""}.${ext}`;
}

/**
 * Content-Disposition value. HTTP headers are ByteStrings, so a Bangla
 * name throws unless it is sent RFC 5987 style with an ASCII fallback.
 */
export function contentDisposition(fileName: string, inline: boolean): string {
  const ascii =
    fileName.replace(/[^\x20-\x7E]/g, "").replace(/[",;\\]/g, "") || "receipt.pdf";
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
