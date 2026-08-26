/** The order lifecycle, in order. Shared by admin and the tracking page. */
export const ORDER_STATUSES = [
  "payment_pending",
  "design_charge_paid",
  "design_in_review",
  "revision_requested",
  "design_approved",
  "advance_paid",
  "in_production",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Payment pending",
  design_charge_paid: "Design charge paid",
  design_in_review: "Design in review",
  revision_requested: "Revision requested",
  design_approved: "Design approved",
  advance_paid: "Advance paid",
  in_production: "In production",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  payment_pending: "bg-amber-100 text-amber-900",
  design_charge_paid: "bg-sky-100 text-sky-900",
  design_in_review: "bg-sky-100 text-sky-900",
  revision_requested: "bg-orange-100 text-orange-900",
  design_approved: "bg-violet-100 text-violet-900",
  advance_paid: "bg-violet-100 text-violet-900",
  in_production: "bg-indigo-100 text-indigo-900",
  out_for_delivery: "bg-blue-100 text-blue-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
};

/** The natural "advance one step" target, skipping the branch states. */
const MAIN_FLOW: OrderStatus[] = [
  "payment_pending",
  "design_charge_paid",
  "design_in_review",
  "design_approved",
  "advance_paid",
  "in_production",
  "out_for_delivery",
  "delivered",
];

export function nextStatus(current: OrderStatus): OrderStatus | null {
  if (current === "cancelled" || current === "delivered") return null;
  if (current === "revision_requested") return "design_in_review";
  const i = MAIN_FLOW.indexOf(current);
  if (i === -1 || i === MAIN_FLOW.length - 1) return null;
  return MAIN_FLOW[i + 1];
}

export const MAX_REVISIONS = 4;

export type PaymentKind = "design_charge" | "advance" | "balance";
export const PAYMENT_LABEL: Record<PaymentKind, string> = {
  design_charge: "Design charge",
  advance: "50% advance",
  balance: "Balance",
};
