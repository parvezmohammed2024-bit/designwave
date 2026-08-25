import type { Metadata } from "next";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "চেকআউট — Design Wave",
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-14 pt-28">
      <h1 className="bangla-safe text-4xl font-bold">চেকআউট</h1>
      <CheckoutFlow />
    </main>
  );
}
