"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";

export type QuoteItem = {
  name: string;
  quantity: number;
  unitPrice: number; // poisha
  lineTotal: number; // poisha
};

export type QuoteInput = {
  id?: string;
  customer_name: string;
  customer_phone: string;
  items: QuoteItem[];
  delivery: number;
  notes: string;
  expires_on: string | null;
  status: "draft" | "sent" | "accepted" | "expired" | "converted";
};

function newQuoteId() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `QT-${s}`;
}

export async function saveQuotation(q: QuoteInput) {
  await requireStaff();
  if (!q.customer_phone.trim()) return { error: "Phone is required" };
  if (!q.items.length) return { error: "Add at least one line" };

  const sb = serverClient();
  const subtotal = q.items.reduce((s, i) => s + i.lineTotal, 0);
  const row = {
    customer_name: q.customer_name || null,
    customer_phone: q.customer_phone.trim(),
    items: q.items,
    subtotal,
    delivery: q.delivery,
    total: subtotal + q.delivery,
    notes: q.notes || null,
    expires_on: q.expires_on || null,
    status: q.status,
  };

  const id = q.id ?? newQuoteId();
  const { error } = q.id
    ? await sb.from("dw_quotations").update(row).eq("id", q.id)
    : await sb.from("dw_quotations").insert({ id, ...row });
  if (error) return { error: error.message };

  await logActivity(q.id ? "quote updated" : "quote created", "quotation", id);
  revalidatePath("/admin/quotations");
  return { ok: true, id };
}

/** Turn an accepted quote into a real order. */
export async function convertToOrder(quoteId: string, district: string, address: string) {
  await requireStaff();
  const sb = serverClient();

  const { data: q } = await sb.from("dw_quotations").select("*").eq("id", quoteId).maybeSingle();
  if (!q) return { error: "Quotation not found" };
  if (q.status === "converted") return { error: "Already converted" };

  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  const orderId = `DW-${s}`;

  const { error } = await sb.rpc("dw_place_order", {
    payload: {
      id: orderId,
      name: q.customer_name ?? "Quotation customer",
      phone: q.customer_phone,
      district: district || "চট্টগ্রাম",
      inside_city: (district || "চট্টগ্রাম") === "চট্টগ্রাম",
      address: address || "—",
      note: `Converted from quotation ${quoteId}`,
      items: q.items,
      subtotal: q.subtotal,
      delivery: q.delivery,
      total: q.total,
      amount_due: Math.ceil(q.total / 2),
      design_finalized: true,
      design_files: [],
      txn_id: "",
    },
  });
  if (error) return { error: error.message };

  await sb
    .from("dw_quotations")
    .update({ status: "converted", converted_order_id: orderId })
    .eq("id", quoteId);

  await logActivity("quote converted", "quotation", quoteId, { orderId });
  revalidatePath("/admin/quotations");
  return { ok: true, orderId };
}

export async function deleteQuotation(id: string) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb.from("dw_quotations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/quotations");
  return { ok: true };
}
