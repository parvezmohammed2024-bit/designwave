import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireStaffApi } from "@/lib/receipt/guard";
import { serverClient } from "@/lib/admin/server";
import { buildReceiptPdf, receiptFileName } from "@/lib/receipt/build";
import { loadReceiptData, siteOrigin } from "@/lib/receipt/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RECEIPTS = 200;

/**
 * GET /api/receipts/bulk?from=2026-08-01&to=2026-08-31
 * Every receipt issued in the range, zipped for bookkeeping.
 */
export async function GET(request: NextRequest) {
  const denied = await requireStaffApi();
  if (denied) return denied;

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const sb = serverClient();
  const { data: receipts, error } = await sb
    .from("dw_receipts")
    .select("payment_id, receipt_no")
    .gte("issued_at", from)
    .lte("issued_at", `${to}T23:59:59`)
    .order("receipt_no")
    .limit(MAX_RECEIPTS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!receipts?.length) {
    return NextResponse.json(
      { error: "No receipts issued in that range" },
      { status: 404 }
    );
  }

  const zip = new JSZip();
  const failed: string[] = [];
  const origin = siteOrigin(request.headers);

  for (const r of receipts) {
    const data = await loadReceiptData(r.payment_id, origin);
    if ("error" in data) {
      failed.push(r.receipt_no);
      continue;
    }
    const pdf = await buildReceiptPdf(data);
    zip.file(receiptFileName(data.receiptNo, data.order.name), pdf);
  }

  if (failed.length) {
    zip.file(
      "_skipped.txt",
      `These receipts could not be generated:\n${failed.join("\n")}\n`
    );
  }

  const blob = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(blob as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="design-wave-receipts-${from}_${to}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
