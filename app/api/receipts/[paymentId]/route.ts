import { NextRequest, NextResponse } from "next/server";
import { requireStaffApi } from "@/lib/receipt/guard";
import { serverClient } from "@/lib/admin/server";
import {
  buildReceiptPdf,
  contentDisposition,
  receiptFileName,
} from "@/lib/receipt/build";
import { loadReceiptData, siteOrigin } from "@/lib/receipt/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/receipts/<paymentId>?disposition=inline|attachment
 * Staff-only. Streams the generated PDF.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const denied = await requireStaffApi();
  if (denied) return denied;

  // Build the QR against the host serving this request, so a printed
  // receipt never carries a localhost link.
  const origin = siteOrigin(request.headers);

  // Issue on first request so the caller never needs a separate step.
  let data = await loadReceiptData(params.paymentId, origin);
  if ("error" in data) {
    const sb = serverClient();
    const { error } = await sb.rpc("dw_issue_receipt", {
      p_payment: params.paymentId,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    data = await loadReceiptData(params.paymentId, origin);
  }
  if ("error" in data) {
    return NextResponse.json({ error: data.error }, { status: 404 });
  }

  const pdf = await buildReceiptPdf(data);
  const inline = request.nextUrl.searchParams.get("disposition") === "inline";
  const name = receiptFileName(data.receiptNo, data.order.name);

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(name, inline),
      "Cache-Control": "no-store",
    },
  });
}
