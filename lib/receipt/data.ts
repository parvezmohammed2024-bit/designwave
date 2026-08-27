import "server-only";
import { serverClient } from "@/lib/admin/server";
import type { BuildInput } from "./build";

/** Minimal shape shared by NextRequest.headers and next/headers. */
type HeaderBag = { get(name: string): string | null };

/**
 * Origin to bake into the receipt QR code.
 *
 * A QR printed on a physical receipt must never point at localhost, so the
 * request's own host is preferred over any build-time default. Order:
 *   1. NEXT_PUBLIC_SITE_URL — the canonical/custom domain, if configured
 *   2. the host that served this very request (correct on any Vercel URL)
 *   3. Vercel's project URL, for non-request contexts
 *   4. localhost, for local development
 */
export function siteOrigin(headerBag?: HeaderBag): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const host =
    headerBag?.get("x-forwarded-host") ?? headerBag?.get("host") ?? null;
  if (host) {
    const proto =
      headerBag?.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3100";
}

/**
 * Assemble everything a receipt needs for one verified payment.
 * `paidToDate` counts only verified payments up to and including this one,
 * so an older receipt keeps showing the balance as it stood at the time.
 */
export async function loadReceiptData(
  paymentId: string,
  origin?: string
): Promise<BuildInput | { error: string }> {
  const sb = serverClient();

  const { data: receipt } = await sb
    .from("dw_receipts")
    .select("receipt_no, token, revision, issued_at, order_id")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (!receipt) return { error: "Receipt not issued for this payment" };

  const [{ data: payment }, { data: order }, { data: allPayments }] =
    await Promise.all([
      sb.from("dw_payments").select("*").eq("id", paymentId).maybeSingle(),
      sb.from("dw_orders").select("*").eq("id", receipt.order_id).maybeSingle(),
      sb
        .from("dw_payments")
        .select("amount, verification_status, received_at")
        .eq("order_id", receipt.order_id)
        .eq("verification_status", "verified")
        .order("received_at"),
    ]);

  if (!payment || !order) return { error: "Order or payment missing" };

  const cutoff = payment.received_at;
  const paidToDate = (allPayments ?? [])
    .filter((p) => p.received_at <= cutoff)
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const items = (Array.isArray(order.items) ? order.items : []) as any[];

  return {
    receiptNo: receipt.receipt_no,
    revision: receipt.revision,
    issuedAt: new Date(receipt.issued_at),
    verifyUrl: `${origin ?? siteOrigin()}/receipt/${receipt.token}`,
    order: {
      id: order.id,
      name: order.name,
      phone: order.phone,
      address: order.address,
      district: order.district,
      subtotal: order.subtotal_poisha ?? 0,
      delivery: order.delivery_poisha ?? 0,
      total: order.total_poisha ?? 0,
      items: items.map((it) => ({
        name: String(it.name ?? ""),
        tier: it.tier ?? null,
        kind: it.kind ?? null,
        components: it.components ?? null,
        regularValue: it.regularValue ?? null,
        quantity: Number(it.quantity ?? 0),
        unitPrice: Number(it.unitPrice ?? 0),
        lineTotal: Number(it.lineTotal ?? 0),
      })),
    },
    payment: {
      kind: payment.kind,
      amount: payment.amount ?? 0,
      method: payment.method,
      txnId: payment.txn_id,
    },
    paidToDate,
  };
}
