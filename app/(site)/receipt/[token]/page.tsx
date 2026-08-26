import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { takaInWords } from "@/lib/receipt/banglaWords";
import { PAYMENT_KIND_BN } from "@/lib/receipt/theme";
import { PHONE_BN, waLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "রসিদ যাচাই — Design Wave",
  robots: { index: false, follow: false },
};

/** Public page the receipt QR code points at. */
export default async function VerifyReceipt({
  params,
}: {
  params: { token: string };
}) {
  const { data } = await supabase.rpc("dw_verify_receipt", {
    p_token: params.token,
  });
  const r = Array.isArray(data) ? data[0] : null;

  if (!r) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-5 pb-16 pt-28 text-center">
        <p className="text-5xl" aria-hidden>🔍</p>
        <h1 className="bangla-safe mt-5 text-3xl font-bold">রসিদটি পাওয়া যায়নি</h1>
        <p className="mt-3 leading-bangla text-ink/70">
          QR কোডটি আবার স্ক্যান করুন, অথবা আমাদের সাথে যোগাযোগ করুন।
        </p>
        <a
          href={waLink("আমার রসিদটি যাচাই করতে পারছি না।")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-brand-700"
        >
          হোয়াটসঅ্যাপে জানান
        </a>
      </main>
    );
  }

  const rows: [string, string][] = [
    ["রসিদ নম্বর", r.receipt_no],
    ["অর্ডার নম্বর", r.order_id],
    ["গ্রাহক", r.customer_name],
    ["পরিশোধের ধরন", PAYMENT_KIND_BN[r.kind] ?? r.kind],
    ["ট্রানজেকশন আইডি", r.txn_id ?? "—"],
    [
      "তারিখ",
      new Date(r.issued_at).toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    ],
  ];

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-16 pt-28">
      <div className="rounded-2xl border border-brand-700/25 bg-paper p-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand-700">
          <span aria-hidden className="text-2xl">✓</span>
          <p className="font-bold">এই রসিদটি বৈধ</p>
        </div>

        <p className="bangla-safe mt-5 text-sm text-ink/60">পরিশোধিত পরিমাণ</p>
        <p className="text-4xl font-bold text-brand-700">
          {formatPoisha(r.amount ?? 0)}
        </p>
        <p className="bangla-safe mt-1 font-semibold leading-bangla">
          {takaInWords(r.amount ?? 0)}
        </p>

        <dl className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-ink/55">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
          {r.revision > 1 && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">সংস্করণ</dt>
              <dd className="text-right font-semibold">
                সংশোধিত {toBanglaDigits(r.revision)}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-6 text-center text-xs leading-bangla text-ink/50">
          Design Wave — চট্টগ্রাম · {PHONE_BN}
          <br />
          এটি একটি কম্পিউটার-জেনারেটেড রসিদ, স্বাক্ষর ছাড়াই বৈধ।
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="font-semibold text-brand-700 underline underline-offset-4">
          Design Wave হোমে যান
        </Link>
      </div>
    </main>
  );
}
