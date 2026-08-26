"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";
import type { OrderStatus, PaymentKind } from "@/lib/admin/orders";

export async function setOrderStatus(id: string, status: OrderStatus) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb
    .from("dw_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity("status → " + status, "order", id);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function bulkSetStatus(ids: string[], status: OrderStatus) {
  await requireStaff();
  if (!ids.length) return { error: "No orders selected" };
  const sb = serverClient();
  const { error } = await sb
    .from("dw_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) return { error: error.message };
  await logActivity(`bulk status → ${status} (${ids.length})`, "order", ids.join(","));
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function recordPayment(
  orderId: string,
  kind: PaymentKind,
  amountPoisha: number,
  txnId: string,
  method: string
) {
  await requireStaff();
  if (amountPoisha <= 0) return { error: "Amount must be greater than zero" };
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // staff entering a payment by hand have already confirmed it
  const { error } = await sb.from("dw_payments").insert({
    order_id: orderId,
    kind,
    amount: amountPoisha,
    txn_id: txnId || null,
    method: method || null,
    recorded_by: user?.id ?? null,
    source: "staff",
    verification_status: "verified",
    verified_by: user?.id ?? null,
    verified_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  // advance the order automatically when a stage payment lands
  const auto: Partial<Record<PaymentKind, OrderStatus>> = {
    design_charge: "design_charge_paid",
    advance: "advance_paid",
  };
  const next = auto[kind];
  if (next) {
    await sb
      .from("dw_orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", orderId);
  }

  await logActivity(`payment ${kind} ${amountPoisha}`, "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function saveOrderNotes(
  id: string,
  notes: string,
  courier: string,
  tracking: string
) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb
    .from("dw_orders")
    .update({
      internal_notes: notes || null,
      courier_name: courier || null,
      tracking_number: tracking || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity("notes updated", "order", id);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

export async function requestRevision(id: string, current: number) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb
    .from("dw_orders")
    .update({
      revision_count: current + 1,
      status: "revision_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(`revision #${current + 1}`, "order", id);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

/** Signed URL so staff can download a customer's private design file. */
export async function signDesignFile(path: string) {
  await requireStaff();
  const sb = serverClient();
  const { data, error } = await sb.storage
    .from("dw-designs")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return { error: error?.message ?? "Could not sign URL" };
  return { url: data.signedUrl };
}

/** Approve a customer-submitted payment, optionally correcting the amount. */
export async function verifyPayment(
  paymentId: string,
  orderId: string,
  amountPoisha: number
) {
  await requireStaff();
  if (amountPoisha <= 0) return { error: "Enter the amount you actually received" };
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: payment, error } = await sb
    .from("dw_payments")
    .update({
      verification_status: "verified",
      amount: amountPoisha,
      verified_by: user?.id ?? null,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", paymentId)
    .select("kind")
    .single();
  if (error) return { error: error.message };

  // a verified stage payment advances the order
  const auto: Record<string, string> = {
    design_charge: "design_charge_paid",
    advance: "advance_paid",
  };
  const next = auto[payment.kind];
  if (next) {
    await sb
      .from("dw_orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", orderId);
  }

  await logActivity(`payment verified ${amountPoisha}`, "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function rejectPayment(
  paymentId: string,
  orderId: string,
  reason: string
) {
  await requireStaff();
  if (!reason.trim()) return { error: "Give a reason — the customer sees this" };
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { error } = await sb
    .from("dw_payments")
    .update({
      verification_status: "rejected",
      rejection_reason: reason.trim(),
      verified_by: user?.id ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  await logActivity("payment rejected", "order", orderId, { reason });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Short-lived signed URL for viewing a receipt in the admin lightbox. */
export async function signReceipt(path: string) {
  await requireStaff();
  const sb = serverClient();
  const { data, error } = await sb.storage
    .from("dw-receipts")
    .createSignedUrl(path, 60 * 5);
  if (error || !data) return { error: error?.message ?? "Could not sign URL" };
  return { url: data.signedUrl };
}
