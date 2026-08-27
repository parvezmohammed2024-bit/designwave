import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { getCombos } from "@/lib/combos";
import ProductDetail from "@/components/ProductDetail";

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
  const [product, combos] = await Promise.all([
    getProductBySlug(params.slug),
    getCombos(),
  ]);
  if (!product) notFound();
  return <ProductDetail product={product} combos={combos} />;
}
