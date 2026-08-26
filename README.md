# Design Wave

Bangla-first storefront for **Design Wave**, a custom card and print studio based in
Chattogram, Bangladesh. Customers browse printed-card collections, configure a
variant, and place an order with a manual (bKash/Nagad) staged payment flow.

The entire customer-facing surface is in Bangla — headings, buttons, validation
messages, empty states, and error pages. Prices display in ৳ with Bangla numerals
(৳৬০০); numeric form inputs stay in English digits for usability.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Motion | Framer Motion + Lenis smooth scroll |
| Backend | Supabase (Postgres + Storage) |
| State | Zustand (cart, persisted to localStorage) |
| Fonts | Hind Siliguri, self-hosted via `next/font` |

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

The dev server runs on **http://localhost:3100**.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase publishable/anon key |
| `NEXT_PUBLIC_SITE_URL` | production | Absolute base for OG image URLs |

### Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) against your Supabase project. It
creates every `dw_*` table (catalogue, price slabs, add-ons, orders, payments,
customers, quotations, banner slides, settings, staff, activity log), the storage
buckets, and the row-level security policies.

Security model: anonymous visitors can **place orders** (through the
`dw_place_order` function) and **upload** design files, but cannot read the orders
table or read back uploads. Order tracking goes through a `security definer`
function that requires **both** the order ID and the matching phone number.
Everything else is staff-only, gated on a row in `dw_staff`.

### Admin panel

Sign in at **`/admin`**.

| | |
|---|---|
| Email | `admin@designwave.com` |
| Password | `DesignWave#2026` |

**Change this password immediately** — Supabase dashboard → Authentication →
Users → admin@designwave.com → Reset password. To add staff: create the user in
that same screen, then insert a row into `dw_staff` with their `id` and a role of
`admin` or `staff`.

### Money

Every monetary value is stored as an **integer number of poisha** (1 taka = 100
poisha). Slab rates like ৳0.60/piece make floating-point rounding compound badly
across thousands of pieces, so nothing in this codebase stores money as a float.
Use `tk()` / `toPoisha()` from `lib/admin/money.ts` (admin) or `formatPoisha()`
from `lib/pricing.ts` (storefront).

### Pricing model

Products carry an **MOQ**, a **step increment**, and a set of **price slabs**. The
customer types any quantity at or above the MOQ and the rate resolves from
whichever slab it lands in — e.g. Standard Business Card:

| Quantity | Rate/piece |
|---|---|
| 100–499 | ৳1.00 |
| 500–999 | ৳0.80 |
| 1,000–2,999 | ৳0.60 |
| 3,000+ | ৳0.50 |

Add-ons apply on top, either flat or per piece. All of it — MOQ, step, slabs,
add-ons — is editable from **Admin → Products** with no deploy; the storefront
picks changes up within 60 seconds (ISR).

The `৳X থেকে` label on cards is the **minimum spend** (MOQ priced at the MOQ's own
slab), not the cheapest rate — advertising ৳0.50/pc when the smallest possible
order is 100 pieces at ৳1.00 would be misleading.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3100 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `node scripts/process-photos.mjs` | Re-download and crop product photography to uniform 5:7 WebP + blur placeholders |
| `node scripts/make-icons.mjs` | Regenerate favicons, apple-touch-icon, and the OG image from `public/logo.svg` |

---

## Project structure

```
app/
  (site)/               customer-facing routes + their chrome
    page.tsx            home
    collections/        shop grid + [slug] product pages
    checkout/           4-step checkout
    track/              order tracking
  admin/                staff panel (own layout, no storefront chrome)
    orders/             list, detail, job sheet, bulk status
    products/           CRUD + slab/add-on editing + bulk price change
    customers/          CRM, segments, CSV export
    quotations/         build, send, convert to order
    banner/             homepage slides + editable content
    reports/  settings/
components/
  admin/                admin-only components
  checkout/             CheckoutFlow, TrackOrder
lib/
  catalog.ts            reads products/banner/settings from Supabase
  pricing.ts            slab resolution, totals, formatting (poisha)
  cart.ts               Zustand cart; re-prices on quantity edit
  admin/                server auth helpers, money, order state machine
  districts.ts          all 64 Bangladesh districts
public/products/        seed product photography
supabase/schema.sql     full database schema
```

---

## Customising

**Products, prices, variants** — all in [`lib/products.ts`](lib/products.ts). Each
product declares its quantity tiers, optional lamination choice, and image path.

**Product photography** — drop a file into `public/products/` named after the
product slug (see [`public/products/README.md`](public/products/README.md)). No
code changes needed. If a file is missing, the site falls back to a branded SVG
card face automatically.

**Contact / payment details** — [`lib/site.ts`](lib/site.ts) is the single source
for the phone number, WhatsApp link, bKash/Nagad number, design charge, and
delivery rates.

**Brand colours** — defined only in [`tailwind.config.ts`](tailwind.config.ts) as
the `brand` (purple) and `wave` (blue) scales. Components never hardcode hex
values. Rule: use `700`+ shades for text on light backgrounds (WCAG AA);
`300`–`500` are for fills and accents.

---

## Payment receipts

At checkout and again from the tracking page, a customer can prove a payment by
giving **a transaction ID, a bKash/Nagad screenshot, or both** — at least one is
required, enforced in the UI and again inside `dw_submit_payment`.

- Images are re-encoded to WebP at ≤1600px in the browser before upload. Android
  screenshots are commonly 4–8MB and customers are on mobile data. Canvas
  re-encoding also **strips all EXIF** (GPS, device, timestamp) as a side effect —
  there is no separate scrubbing step. PDFs pass through untouched.
- Files land in the **private** `dw-receipts` bucket at
  `receipts/<ORDER_ID>/<stage>-<time>-<rand>`. The RPC rejects any path that
  doesn't sit under the order it claims to belong to.
- Anonymous users can **write but never read** that bucket. Staff read via
  5-minute signed URLs. Customers see their payment *records* (amount, stage,
  transaction ID, status, whether a receipt is attached) through
  `dw_order_payments`, which requires the order ID **and** the matching phone.
- Each staged payment is its **own row** — design charge, 50% advance and balance
  never overwrite one another.
- Admin verifies or rejects per record, correcting the amount on approval. Only
  **verified** money counts toward the balance. A rejection captures a reason the
  customer sees, with a WhatsApp template to tell them. Transaction IDs reused
  across different orders are flagged before approval.

> Customers cannot re-download their own receipt image — only its metadata. That
> keeps the bucket strictly write-only for anonymous users. Enabling it would mean
> putting a service-role key in the server environment; it was not worth the blast
> radius for a file the customer already has on their phone.

## PDF money receipts

Once a payment is verified, the admin order page can issue a print-ready
**মানি রিসিট / MONEY RECEIPT** (A4, one page). Buttons sit under the WhatsApp
templates: download, preview in a modal, and send. If an order has several
verified payments a selector picks which one.

- Generated **server-side** at `/api/receipts/<paymentId>` with
  `@react-pdf/renderer`. Text is real and selectable, not a rasterised image.
- **Bangla renders correctly.** Hind Siliguri is embedded (subset) from
  `assets/fonts/`, and fontkit applies the Indic shaper, so conjuncts —
  রসিদ, পরিশোধিত, ট্রানজেকশন, অ্যাডভান্স, স্বাক্ষর, নয়শত পঁচাত্তর — come out
  properly formed. This was verified by rendering the PDF and inspecting the
  glyphs, not assumed.
- Amounts are written out in words by `lib/receipt/banglaWords.ts`
  (৯৭৫ → *নয়শত পঁচাত্তর টাকা মাত্র*), which is what makes a receipt read as
  legitimate locally.
- The ledger shows মোট মূল্য / পরিশোধিত / বাকি, counting only **verified**
  payments up to that receipt's own date — so an old receipt keeps showing the
  balance as it stood then. A fully-settled order gets a diagonal
  **সম্পূর্ণ পরিশোধিত · PAID IN FULL** stamp.
- A QR code links to `/receipt/<token>`, a public page anyone can use to check
  the receipt is real. Tokens are random 128-bit hex, so a receipt number alone
  reveals nothing.
- Brand colours come from `lib/receipt/theme.ts` only — never hardcoded.
- **Re-issuing:** correcting order details keeps the same receipt number and
  bumps a revision counter, logged in `dw_receipt_revisions`. A receipt number
  that changes is useless for bookkeeping.
- **Bulk export:** Reports → *Receipts export* zips every receipt in a date
  range (`/api/receipts/bulk`), capped at 200 per request.

> Two honest limitations. **Copy-pasting Bangla out of the PDF gives reordered
> text** — PDF stores shaped glyphs in visual order and @react-pdf emits no
> `ActualText` spans. Printing and on-screen reading are correct; only text
> extraction is affected. And there is **no server-side PNG**: rasterising a PDF
> needs a native renderer that does not deploy cleanly on Vercel, so the admin
> downloads the PDF and attaches it in WhatsApp, which the UI says plainly
> (wa.me links cannot carry attachments anyway).

## Order flow

1. **Design charge ৳200** — if the customer needs Design Wave to create the design
2. **Design approval** — proof sent over WhatsApp
3. **50% advance** of the order total
4. **Print & finishing**
5. **Delivery** — remaining balance on receipt

Delivery charge is calculated from the selected district: **৳80** inside Chattogram
city, **৳150** everywhere else.

Orders are written with status `payment_pending`. Update the `status` column in the
Supabase dashboard to move an order along (`design`, `approved`, `printing`,
`shipped`, `delivered`) — the customer-facing tracking page reads it directly.

---

## Accessibility & performance notes

- Animates transform and opacity only; no layout-triggering properties
- `prefers-reduced-motion` ships a static fallback throughout
- Heavy scroll effects and the custom cursor are disabled below 768px
- Bangla conjuncts (যুক্তাক্ষর) never break: text reveals animate **by word**, never
  by character
- Tailwind's default `text-*` line-heights are overridden so Bangla ascenders and
  descenders don't clip in animated containers

---

## Known gaps

- **Product photos are stock placeholders** (Pexels), pending the client's own
  photography. Some are approximate — the die-cut card is represented by an
  embosser shot, for example.
- **Quantity-tier prices are placeholders** and need confirming against real
  pricing.
- **`public/logo.svg` is a hand-built recreation** of the brand logo, not the
  original artwork file. Replace it and re-run `node scripts/make-icons.mjs`.
- **No admin UI** — orders are managed through the Supabase dashboard.
- The `/order` route is a legacy custom-request form, separate from the main
  cart/checkout flow.
