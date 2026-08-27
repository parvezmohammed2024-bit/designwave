import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { BRAND, COMPANY, METHOD_BN, PAYMENT_KIND_BN } from "./theme";
import { takaInWords } from "./banglaWords";

export type ReceiptData = {
  receiptNo: string;
  revision: number;
  issuedAt: Date;
  order: {
    id: string;
    name: string;
    phone: string;
    address: string;
    district: string;
    subtotal: number;
    delivery: number;
    total: number;
    items: {
      name: string;
      tier?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[];
  };
  payment: {
    kind: string;
    amount: number;
    method: string | null;
    txnId: string | null;
  };
  /** running total of every verified payment on the order */
  paidToDate: number;
  logoPng: string; // data URI, 300-DPI raster
  qrPng: string; // data URI
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const bn = (v: string | number) =>
  String(v).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

const tk = (poisha: number) => {
  const t = poisha / 100;
  const s =
    poisha % 100 === 0
      ? Math.round(t).toLocaleString("en-IN")
      : t.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `৳${bn(s)}`;
};

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];
const bnDate = (d: Date) =>
  `${bn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${bn(d.getFullYear())}`;

const s = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 26,
    paddingHorizontal: 36,
    fontFamily: "Hind",
    fontSize: 9,
    color: BRAND.ink,
    lineHeight: 1.45,
    position: "relative",
  },
  // NOT `fixed` — a fixed element repeats on every page, and this
  // document must be a single page anyway.
  watermark: {
    position: "absolute",
    top: 300,
    left: 150,
    width: 300,
    opacity: 0.04,
  },
  paidStamp: {
    position: "absolute",
    top: 352,
    left: 92,
    transform: "rotate(-16deg)",
    opacity: 0.12,
    color: BRAND.purple,
    fontSize: 30,
    fontWeight: 700,
  },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 104, height: 72, objectFit: "contain" },
  company: { textAlign: "right", fontSize: 8.5 },
  companyName: { fontSize: 14, fontWeight: 700, color: BRAND.purple, marginBottom: 1 },
  rule: { height: 2.6, backgroundColor: BRAND.purple, marginTop: 8 },
  ruleThin: { height: 1, backgroundColor: BRAND.blue, marginTop: 2, marginBottom: 12 },

  title: { textAlign: "center", marginBottom: 2 },
  titleBn: { fontSize: 20, fontWeight: 700 },
  titleEn: { fontSize: 8, letterSpacing: 2.5, color: BRAND.purple, marginTop: 1 },

  metaRow: { flexDirection: "row", marginTop: 12, gap: 20 },
  metaCol: { flex: 1 },
  metaLabel: { color: BRAND.inkSoft, fontSize: 8.5 },
  metaValue: { fontWeight: 700 },
  metaLine: { marginBottom: 3 },

  panel: {
    marginTop: 12,
    borderWidth: 1.2,
    borderColor: BRAND.purple,
    borderRadius: 4,
    backgroundColor: BRAND.purpleTint,
    padding: 11,
  },
  panelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  amount: { fontSize: 26, fontWeight: 700, color: BRAND.purpleDeep, lineHeight: 1.2 },
  words: { marginTop: 1, fontWeight: 700, fontSize: 10 },
  panelMeta: { flexDirection: "row", gap: 24, marginTop: 8 },

  th: { flexDirection: "row", backgroundColor: BRAND.purple, color: BRAND.white, paddingVertical: 4, paddingHorizontal: 7, marginTop: 14 },
  tr: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 7, borderBottomWidth: 0.7, borderBottomColor: BRAND.line },
  cName: { flex: 4 },
  cQty: { flex: 1.3, textAlign: "right" },
  cRate: { flex: 1.6, textAlign: "right" },
  cAmt: { flex: 1.8, textAlign: "right" },

  totals: { alignSelf: "flex-end", width: 232, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  ledger: { marginTop: 8, paddingTop: 8, borderTopWidth: 1.2, borderTopColor: BRAND.ink },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    backgroundColor: BRAND.purple,
    color: BRAND.white,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontWeight: 700,
  },

  // No `marginTop: auto` — react-pdf resolves it against the flow and
  // pushes the block onto a second page.
  footer: { marginTop: 22 },
  footRule: { height: 1.5, backgroundColor: BRAND.blue, marginBottom: 10 },
  footRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  qr: { width: 60, height: 60 },
  signLine: { width: 148, borderTopWidth: 1, borderTopColor: BRAND.ink, paddingTop: 3, textAlign: "center" },
  fine: { fontSize: 7.5, color: BRAND.inkSoft, marginTop: 8, textAlign: "center" },
});

export function ReceiptDocument(d: ReceiptData) {
  const due = Math.max(0, d.order.total - d.paidToDate);
  const paidInFull = due === 0;

  return (
    <Document
      title={`${d.receiptNo} — Design Wave`}
      author={COMPANY.name}
      subject="Money Receipt"
    >
      <Page size="A4" style={s.page}>
        {/* faint logo watermark */}
        <Image src={d.logoPng} style={s.watermark} />
        {paidInFull && (
          <Text style={s.paidStamp}>সম্পূর্ণ পরিশোধিত · PAID IN FULL</Text>
        )}

        {/* header */}
        <View style={s.headRow}>
          <Image src={d.logoPng} style={s.logo} />
          <View style={s.company}>
            <Text style={s.companyName}>{COMPANY.name}</Text>
            <Text>{COMPANY.taglineBn}</Text>
            <Text>{COMPANY.addressBn}</Text>
            <Text>{COMPANY.phoneBn}</Text>
            <Text>{COMPANY.email}</Text>
          </View>
        </View>
        <View style={s.rule} />
        <View style={s.ruleThin} />

        <View style={s.title}>
          <Text style={s.titleBn}>মানি রিসিট</Text>
          <Text style={s.titleEn}>MONEY RECEIPT</Text>
        </View>

        {/* meta */}
        <View style={s.metaRow}>
          <View style={s.metaCol}>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>রসিদ নম্বর</Text>
              <Text style={s.metaValue}>{d.receiptNo}</Text>
            </View>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>তারিখ</Text>
              <Text style={s.metaValue}>{bnDate(d.issuedAt)}</Text>
            </View>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>অর্ডার নম্বর</Text>
              <Text style={s.metaValue}>{d.order.id}</Text>
            </View>
            {d.revision > 1 && (
              <Text style={{ ...s.metaLabel, color: BRAND.danger }}>
                সংশোধিত সংস্করণ {bn(d.revision)}
              </Text>
            )}
          </View>
          <View style={s.metaCol}>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>গ্রাহকের নাম</Text>
              <Text style={s.metaValue}>{d.order.name}</Text>
            </View>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>ফোন নম্বর</Text>
              <Text style={s.metaValue}>{bn(d.order.phone)}</Text>
            </View>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>ঠিকানা</Text>
              <Text>
                {d.order.address}, {d.order.district}
              </Text>
            </View>
          </View>
        </View>

        {/* payment panel */}
        <View style={s.panel}>
          <View style={s.panelTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.metaLabel}>পরিশোধের ধরন</Text>
              <Text style={{ fontWeight: 700, fontSize: 12 }}>
                {PAYMENT_KIND_BN[d.payment.kind] ?? d.payment.kind}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.metaLabel}>টাকার পরিমাণ</Text>
              <Text style={s.amount}>{tk(d.payment.amount)}</Text>
            </View>
          </View>

          <Text style={s.metaLabel}>কথায়</Text>
          <Text style={s.words}>{takaInWords(d.payment.amount)}</Text>

          <View style={s.panelMeta}>
            <View>
              <Text style={s.metaLabel}>পেমেন্ট মাধ্যম</Text>
              <Text style={s.metaValue}>
                {d.payment.method
                  ? (METHOD_BN[d.payment.method] ?? d.payment.method)
                  : "—"}
              </Text>
            </View>
            <View>
              <Text style={s.metaLabel}>ট্রানজেকশন আইডি</Text>
              <Text style={s.metaValue}>{d.payment.txnId ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* order summary */}
        <View style={s.th}>
          <Text style={s.cName}>পণ্য</Text>
          <Text style={s.cQty}>পরিমাণ</Text>
          <Text style={s.cRate}>একক দর</Text>
          <Text style={s.cAmt}>মোট</Text>
        </View>
        {d.order.items.map((it, i) => (
          <View key={i} style={s.tr}>
            <Text style={s.cName}>
              {it.name}
              {it.tier ? ` — ${it.tier}` : ""}
            </Text>
            <Text style={s.cQty}>{bn(it.quantity.toLocaleString("en-IN"))}</Text>
            <Text style={s.cRate}>{tk(it.unitPrice)}</Text>
            <Text style={s.cAmt}>{tk(it.lineTotal)}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>সাব-টোটাল</Text>
            <Text>{tk(d.order.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>ডেলিভারি চার্জ</Text>
            <Text>{tk(d.order.delivery)}</Text>
          </View>

          <View style={s.ledger}>
            <View style={s.totalRow}>
              <Text style={{ fontWeight: 700 }}>মোট মূল্য</Text>
              <Text style={{ fontWeight: 700 }}>{tk(d.order.total)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>পরিশোধিত</Text>
              <Text>{tk(d.paidToDate)}</Text>
            </View>
            <View style={s.dueRow}>
              <Text>বাকি</Text>
              <Text>{tk(due)}</Text>
            </View>
          </View>
        </View>

        {/* footer */}
        <View style={s.footer}>
          <View style={s.footRule} />
          <View style={s.footRow}>
            <View style={{ alignItems: "center" }}>
              <Image src={d.qrPng} style={s.qr} />
              <Text style={{ fontSize: 7, color: BRAND.inkSoft, marginTop: 2 }}>
                যাচাই করুন
              </Text>
            </View>
            <View style={s.signLine}>
              <Text>কর্তৃপক্ষের স্বাক্ষর</Text>
            </View>
          </View>
          <Text style={s.fine}>
            এটি একটি কম্পিউটার-জেনারেটেড রসিদ, স্বাক্ষর ছাড়াই বৈধ।
          </Text>
        </View>
      </Page>
    </Document>
  );
}
