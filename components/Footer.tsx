import Link from "next/link";
import { toBanglaDigits } from "@/lib/format";
import { PHONE_BN, telLink, waLink } from "@/lib/site";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-3 md:py-12">
        <div>
          <Logo variant="light" />
          <p className="mt-3 max-w-xs text-sm leading-bangla text-paper/70">
            চট্টগ্রামের ছোট্ট এক স্টুডিও থেকে — কাগজ, কালি আর যত্নে ছাপা
            আপনার প্রতিটি শুভেচ্ছা।
          </p>
        </div>
        <nav aria-label="ফুটার লিংক" className="space-y-2.5 text-sm">
          <p className="mb-3 font-semibold text-paper/50">পাতা</p>
          <Link className="block hover:text-wave-300" href="/collections">
            কালেকশন
          </Link>
          <Link className="block hover:text-wave-300" href="/#how">
            কীভাবে কাজ করে
          </Link>
          <Link className="block hover:text-wave-300" href="/track">
            অর্ডার ট্র্যাকিং
          </Link>
          <Link className="block hover:text-wave-300" href="/order">
            কাস্টম অনুরোধ
          </Link>
        </nav>
        <div className="space-y-2.5 text-sm">
          <p className="mb-3 font-semibold text-paper/50">যোগাযোগ</p>
          <p dir="ltr">hello@designwave.com</p>
          <p dir="ltr" className="tracking-wide">
            <a href={telLink} className="hover:text-wave-300">
              {PHONE_BN}
            </a>
          </p>
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-semibold text-wave-300 underline underline-offset-4 hover:text-paper"
          >
            হোয়াটসঅ্যাপে মেসেজ করুন
          </a>
          <p className="text-paper/70">শনি–বৃহস্পতি, সকাল ১০টা – রাত ৮টা</p>
        </div>
      </div>
      <div className="border-t border-paper/10 py-5 text-center text-xs text-paper/50">
        © {toBanglaDigits(new Date().getFullYear())} Design Wave। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
