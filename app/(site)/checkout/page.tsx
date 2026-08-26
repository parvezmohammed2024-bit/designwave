import type { Metadata } from "next";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import {
  getSetting,
  type DeliverySettings,
  type PaymentSettings,
} from "@/lib/catalog";
import {
  DELIVERY_INSIDE_CTG,
  DELIVERY_OUTSIDE_CTG,
  DESIGN_CHARGE,
  PAYMENT_NUMBER,
} from "@/lib/site";

export const metadata: Metadata = { title: "চেকআউট — Design Wave" };
export const revalidate = 60;

export default async function CheckoutPage() {
  const [delivery, payment] = await Promise.all([
    getSetting<DeliverySettings>("delivery", {
      inside_ctg: DELIVERY_INSIDE_CTG,
      outside_ctg: DELIVERY_OUTSIDE_CTG,
    }),
    getSetting<PaymentSettings>("payment", {
      bkash: PAYMENT_NUMBER,
      nagad: PAYMENT_NUMBER,
      design_charge: DESIGN_CHARGE,
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-14 pt-28">
      <h1 className="bangla-safe text-4xl font-bold">চেকআউট</h1>
      <CheckoutFlow delivery={delivery} payment={payment} />
    </main>
  );
}
