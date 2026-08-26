import "server-only";
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/admin/server";

/**
 * Returns a response to send back when the caller is NOT staff,
 * or null when they are. Route handlers can't use redirect()-based
 * guards, so this returns JSON instead.
 */
export async function requireStaffApi(): Promise<NextResponse | null> {
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { data: staff } = await sb
    .from("dw_staff")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!staff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}
