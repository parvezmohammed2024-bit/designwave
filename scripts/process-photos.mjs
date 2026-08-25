// One-off: download Pexels picks, crop to a uniform 5:7, emit WebP +
// tiny blur placeholders. Re-run any time a source URL changes.
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const picks = {
  "business-standard":
    "https://images.pexels.com/photos/5706020/pexels-photo-5706020.jpeg",
  "business-diecut":
    "https://images.pexels.com/photos/12039616/pexels-photo-12039616.jpeg",
  "popup-card":
    "https://images.pexels.com/photos/6765925/pexels-photo-6765925.jpeg",
  stickers:
    "https://images.pexels.com/photos/17891962/pexels-photo-17891962/free-photo-of-hand-touching-sticker-on-box.jpeg",
  "thankyou-cards":
    "https://images.pexels.com/photos/7564279/pexels-photo-7564279.jpeg",
  "eid-envelope":
    "https://images.pexels.com/photos/5942523/pexels-photo-5942523.jpeg",
  "eid-wish-set":
    "https://images.pexels.com/photos/7847437/pexels-photo-7847437.jpeg",
  "wedding-welcome":
    "https://images.pexels.com/photos/29821860/pexels-photo-29821860/free-photo-of-elegant-wedding-invitation-flat-lay-on-pink-background.jpeg",
  "wedding-gift-note":
    "https://images.pexels.com/photos/20235414/pexels-photo-20235414/free-photo-of-stack-of-invitation-cards-with-ribbons.jpeg",
  "scratch-card":
    "https://images.pexels.com/photos/30427909/pexels-photo-30427909/free-photo-of-close-up-of-hands-scratching-lottery-tickets.jpeg",
  "coupon-card":
    "https://images.pexels.com/photos/6651190/pexels-photo-6651190.jpeg",
  combos:
    "https://images.pexels.com/photos/11650187/pexels-photo-11650187.jpeg",
};

const outDir = path.resolve("public/products");
await mkdir(outDir, { recursive: true });

const blurs = {};
for (const [slug, base] of Object.entries(picks)) {
  const url = `${base}?auto=compress&cs=tinysrgb&w=1600`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${slug}: HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const img = sharp(buf).resize(1000, 1400, { fit: "cover", position: "attention" });
  await img.clone().webp({ quality: 75 }).toFile(path.join(outDir, `${slug}.webp`));
  const tiny = await sharp(buf)
    .resize(12, 17, { fit: "cover", position: "attention" })
    .webp({ quality: 40 })
    .toBuffer();
  blurs[slug] = `data:image/webp;base64,${tiny.toString("base64")}`;
  console.log(`OK ${slug}`);
}

await writeFile(
  path.resolve("scripts/blur-data.json"),
  JSON.stringify(blurs, null, 2)
);
console.log("blur-data.json written");
