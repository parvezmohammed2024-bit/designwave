"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";

/** Issue (or fetch) the receipt for a verified payment. Idempotent. */
export async function issueReceipt(paymentId: string, orderId: string) {
  await requireStaff();
  const sb = serverClient();
  const { data, error } = await sb.rpc("dw_issue_receipt", {
    p_payment: paymentId,
  });
  if (error) return { error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  await logActivity(`receipt ${row.receipt_no}`, "order", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, receiptNo: row.receipt_no, token: row.token };
}

/**
 * Re-issue after correcting order details. The receipt NUMBER is kept —
 * a receipt number that changes is worthless for bookkeeping — and the
 * revision is bumped and logged instead.
 */
export async function reviseReceipt(
  paymentId: string,
  orderId: string,
  reason: string
) {
  await requireStaff();
  if (!reason.trim()) return { error: "Give a reason for the revision" };

  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: receipt } = await sb
    .from("dw_receipts")
    .select("id, receipt_no, revision")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (!receipt) return { error: "No receipt issued yet" };

  const next = receipt.revision + 1;
  const { error } = await sb
    .from("dw_receipts")
    .update({ revision: next, updated_at: new Date().toISOString() })
    .eq("id", receipt.id);
  if (error) return { error: error.message };

  await sb.from("dw_receipt_revisions").insert({
    receipt_id: receipt.id,
    revision: next,
    reason: reason.trim(),
    actor_email: user?.email ?? null,
  });

  await logActivity(
    `receipt ${receipt.receipt_no} revised to v${next}`,
    "order",
    orderId,
    { reason }
  );
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, revision: next };
}
