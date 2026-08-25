import type { Metadata } from "next";
import { Suspense } from "react";
import TrackOrder from "@/components/checkout/TrackOrder";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাকিং — Design Wave",
};

export default function TrackPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 pb-14 pt-28">
      <h1 className="bangla-safe text-4xl font-bold">অর্ডার ট্র্যাকিং</h1>
      <p className="mt-3 leading-bangla text-ink/70">
        অর্ডার আইডি আর যে ফোন নম্বরে অর্ডার করেছিলেন, দুটো দিলেই স্ট্যাটাস
        দেখতে পাবেন।
      </p>
      <Suspense>
        <TrackOrder />
      </Suspense>
    </main>
  );
}
