// Rasterise the brand mark into favicons, apple-touch-icon and an OG image.
// Re-run after replacing public/logo.svg.
import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const logo = await readFile(path.resolve("public/logo.svg"));
const PAPER = { r: 247, g: 244, b: 237, alpha: 1 };

// square icons: mark centred on paper
for (const [file, size] of [
  ["public/favicon-32.png", 32],
  ["public/favicon-192.png", 192],
  ["public/favicon-512.png", 512],
  ["app/apple-icon.png", 180],
]) {
  const pad = Math.round(size * 0.1);
  const mark = await sharp(logo, { density: 600 })
    .resize(size - pad * 2, size - pad * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: PAPER },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(path.resolve(file));
  console.log("OK", file);
}

// .ico (32px) for legacy /favicon.ico requests
await writeFile(
  path.resolve("app/favicon.ico"),
  await sharp(path.resolve("public/favicon-32.png")).toFormat("png").toBuffer()
);
console.log("OK app/favicon.ico");

// OG image 1200x630
const ogMark = await sharp(logo, { density: 600 })
  .resize(520, 360, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const ogText = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
     <text x="600" y="500" text-anchor="middle" font-family="Segoe UI, sans-serif"
       font-size="46" font-weight="700" fill="#111111">Design Wave</text>
     <text x="600" y="556" text-anchor="middle" font-family="Nirmala UI, Segoe UI, sans-serif"
       font-size="30" fill="#6B21A8">কাস্টম কার্ড ও প্রিন্ট স্টুডিও — চট্টগ্রাম</text>
   </svg>`
);
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: PAPER },
})
  .composite([
    { input: ogMark, top: 90, left: 340 },
    { input: ogText, top: 0, left: 0 },
  ])
  .png()
  .toFile(path.resolve("public/og.png"));
console.log("OK public/og.png");
