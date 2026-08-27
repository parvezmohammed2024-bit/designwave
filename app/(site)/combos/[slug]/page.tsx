import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComboDetail from "@/components/ComboDetail";
import { getComboBySlug, getCombos } from "@/lib/combos";
import {
  getSetting,
  type ContactSettings,
  type DeliverySettings,
  type PaymentSettings,
} from "@/lib/catalog";
import {
  DELIVERY_INSIDE_CTG,
  DELIVERY_OUTSIDE_CTG,
  DESIGN_CHARGE,
  PAYMENT_NUMBER,
} from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const c = await getComboBySlug(params.slug);
  return { title: c ? `${c.name_bn} — Design Wave` : "Design Wave" };
}

export default async function ComboPage({
  params,
}: {
  params: { slug: string };
}) {
  const [combo, all, delivery, payment, contact] = await Promise.all([
    getComboBySlug(params.slug),
    getCombos(),
    getSetting<DeliverySettings>("delivery", {
      inside_ctg: DELIVERY_INSIDE_CTG,
      outside_ctg: DELIVERY_OUTSIDE_CTG,
    }),
    getSetting<PaymentSettings>("payment", {
      bkash: PAYMENT_NUMBER,
      nagad: PAYMENT_NUMBER,
      design_charge: DESIGN_CHARGE,
    }),
    getSetting<ContactSettings>("contact", {
      phone: "+8801836065919",
      whatsapp: "8801836065919",
      email: "hello@designwave.com",
      hours_bn: "",
      address_bn: "",
    }),
  ]);

  if (!combo) notFound();

  return (
    <ComboDetail
      combo={combo}
      related={all.filter((c) => c.id !== combo.id)}
      deliveryInside={delivery.inside_ctg}
      deliveryOutside={delivery.outside_ctg}
      designCharge={payment.design_charge}
      whatsapp={contact.whatsapp}
    />
  );
}
