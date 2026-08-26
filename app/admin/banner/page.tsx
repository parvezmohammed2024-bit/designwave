import { requireStaff, serverClient } from "@/lib/admin/server";
import BannerManager from "@/components/admin/BannerManager";
import ContentSettings from "@/components/admin/ContentSettings";

export const dynamic = "force-dynamic";

export default async function BannerPage() {
  await requireStaff();
  const sb = serverClient();

  const [{ data: slides }, { data: settings }] = await Promise.all([
    sb.from("dw_banner_slides").select("*").order("sort_order"),
    sb.from("dw_settings").select("key,value"),
  ]);

  const get = (k: string) => settings?.find((s) => s.key === k)?.value;

  return (
    <div>
      <h1 className="text-2xl font-bold">Banner &amp; content</h1>
      <p className="mt-1 text-sm text-ink/60">
        Slides with a date range appear and expire on their own — set an Eid
        slide once and forget it.
      </p>

      <BannerManager slides={slides ?? []} />

      <ContentSettings
        homepage={get("homepage") as { headline_bn?: string; banner_rotation_ms?: number }}
        categories={get("categories") as { slug: string; name_bn: string; detail_bn: string }[]}
        trustStats={get("trust_stats") as { value: number; suffix: string; label_bn: string }[]}
      />
    </div>
  );
}
