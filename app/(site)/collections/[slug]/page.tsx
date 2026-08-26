import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { formatPoisha, minOrderValue } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import QuantityPricer from "@/components/QuantityPricer";
import SetCurrentProduct from "@/components/SetCurrentProduct";
import { PHONE_BN, waLink } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const p = await getProductBySlug(params.slug);
  return { title: p ? `${p.name_bn} — Design Wave` : "Design Wave" };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const fromPrice = formatPoisha(
    minOrderValue(product.slabs, product.moq, product.base_unit_price)
  );

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-14 pt-28">
      <SetCurrentProduct name={product.name_bn} />

      <nav aria-label="ব্রেডক্রাম্ব" className="text-sm text-ink/60">
        <Link href="/collections" className="hover:text-brand-700">
          কালেকশন
        </Link>{" "}
        / <span>{product.name_bn}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[5/7] overflow-hidden rounded-2xl bg-ink/5 shadow-[0_24px_60px_-32px_rgba(17,17,17,0.5)] md:sticky md:top-24 md:self-start">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name_bn}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              placeholder={product.blur_data_url ? "blur" : "empty"}
              blurDataURL={product.blur_data_url ?? undefined}
            />
          )}
        </div>

        <div>
          <h1 className="bangla-safe text-3xl font-bold md:text-4xl">
            {product.name_bn}
          </h1>
          <p className="mt-2 leading-bangla text-ink/70">{product.tagline_bn}</p>
          <p className="mt-4 text-xl font-bold text-brand-700">
            {fromPrice} থেকে{" "}
            <span className="text-base font-normal text-ink/60">
              ({toBanglaDigits(product.moq)} পিস)
            </span>
          </p>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
            <QuantityPricer product={product} />
          </div>

          <div className="mt-6 space-y-2 text-sm leading-bangla text-ink/70">
            <p>• ৩০০/৩৫০ GSM প্রিমিয়াম কার্ডস্টক</p>
            <p>• ডিজাইন চূড়ান্ত না হলে আমরা করে দেব (ডিজাইন চার্জ প্রযোজ্য)</p>
            <p>• চট্টগ্রাম সিটিতে ও সারা দেশে ডেলিভারি</p>
          </div>

          <a
            href={waLink(`আসসালামু আলাইকুম! আমি "${product.name_bn}" নিয়ে জানতে চাই।`)}
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
