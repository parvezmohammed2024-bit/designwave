import type { Metadata } from "next";
import { Suspense } from "react";
import OrderForm from "@/components/OrderForm";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "কাস্টম অনুরোধ — Design Wave",
  description: "কাস্টম কার্ডের অনুরোধ পাঠান — ৩-৫ দিনে সারা দেশে ডেলিভারি।",
};

export const revalidate = 60;

export default async function OrderPage() {
  const products = await getProducts();
  const options = products.map((p) => ({ slug: p.slug, name: p.name_bn }));

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-24 pt-28">
      <h1 className="bangla-safe text-4xl font-bold md:text-5xl">কাস্টম অনুরোধ</h1>
      <p className="mt-3 leading-bangla text-ink/70">
        ক্যাটালগের বাইরে কিছু চাই? ফর্মটি পূরণ করুন — ২৪ ঘণ্টার মধ্যে আমরা
        ফোন বা হোয়াটসঅ্যাপে ডিজাইন নিয়ে কথা বলব।
      </p>
      <Suspense>
        <OrderForm options={options} />
      </Suspense>
    </main>
  );
}
