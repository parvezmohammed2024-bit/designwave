import type { Metadata } from "next";
import { Suspense } from "react";
import OrderForm from "@/components/OrderForm";

export const metadata: Metadata = {
  title: "অর্ডার করুন — Design Wave",
  description: "কাস্টম কার্ডের অর্ডার দিন — ৩-৫ দিনে সারা দেশে ডেলিভারি।",
};

export default function OrderPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-24 pt-32">
      <h1 className="bangla-safe text-4xl font-bold md:text-5xl">
        অর্ডার করুন
      </h1>
      <p className="mt-3 leading-bangla text-ink/70">
        ফর্মটি পূরণ করুন — ২৪ ঘণ্টার মধ্যে আমরা ফোন বা হোয়াটসঅ্যাপে ডিজাইন
        নিয়ে কথা বলব। অ্যাডভান্স লাগবে কথা চূড়ান্ত হওয়ার পরেই।
      </p>
      <Suspense>
        <OrderForm />
      </Suspense>
    </main>
  );
}
