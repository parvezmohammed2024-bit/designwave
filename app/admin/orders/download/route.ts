import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/admin/server";

/** Redirects staff to a short-lived signed URL for a private design file. */
export async function GET(request: NextRequest) {
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: staff } = await sb
    .from("dw_staff")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!staff) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "missing path" }, { status: 400 });

  const { data, error } = await sb.storage
    .from("dw-designs")
    .createSignedUrl(path, 600);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl);
}
