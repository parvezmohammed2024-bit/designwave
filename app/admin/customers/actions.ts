"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, serverClient, logActivity } from "@/lib/admin/server";

export async function saveCustomer(
  phone: string,
  tags: string[],
  notes: string,
  followUp: string | null
) {
  await requireStaff();
  const sb = serverClient();
  const { error } = await sb
    .from("dw_customers")
    .update({ tags, notes: notes || null, follow_up_at: followUp || null })
    .eq("phone", phone);
  if (error) return { error: error.message };
  await logActivity("customer updated", "customer", phone);
  revalidatePath(`/admin/customers/${encodeURIComponent(phone)}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}
