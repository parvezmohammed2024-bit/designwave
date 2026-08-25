import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { collections, getProduct } from "@/lib/products";
import { formatTaka } from "@/lib/format";
import VariantPicker from "@/components/VariantPicker";
import { PHONE_BN, waLink } from "@/lib/site";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getProduct(params.slug);
  return { title: p ? `${p.name} — Design Wave` : "Design Wave" };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-14 pt-28">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-sm text-ink/60">
        <Link href="/collections" className="hover:text-brand-700">
          কালেকশন
        </Link>{" "}
        / <span>{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[5/7] overflow-hidden rounded-2xl shadow-[0_24px_60px_-32px_rgba(17,17,17,0.5)]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            placeholder={product.blurDataURL ? "blur" : "empty"}
            blurDataURL={product.blurDataURL}
          />
        </div>

        <div>
          <h1 className="bangla-safe text-3xl font-bold md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 leading-bangla text-ink/70">{product.tagline}</p>
          <p className="mt-4 text-xl font-bold text-brand-700">
            {formatTaka(product.priceFrom)} থেকে
          </p>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
            <VariantPicker product={product} />
          </div>

          <div className="mt-6 space-y-2 text-sm leading-bangla text-ink/70">
            <p>• ৩০০/৩৫০ GSM প্রিমিয়াম কার্ডস্টক, অর্ডারে বাছাই করুন</p>
            <p>• ডিজাইন চূড়ান্ত না হলে আমরা করে দেব (ডিজাইন চার্জ প্রযোজ্য)</p>
            <p>• চট্টগ্রাম সিটিতে ও সারা দেশে ডেলিভারি</p>
          </div>

          <a
            href={waLink(`আসসালামু আলাইকুম! আমি "${product.name}" নিয়ে জানতে চাই।`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-ink"
          >
            প্রশ্ন আছে? হোয়াটসঅ্যাপে জিজ্ঞেস করুন — {PHONE_BN}
          </a>
        </div>
      </div>
    </main>
  );
}
