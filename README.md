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
creates the `dw_orders` table, the `dw_track_order` lookup function, the private
`dw-designs` storage bucket, and the row-level security policies.

Security model: anonymous visitors can **insert** orders and **upload** design
files, but cannot read the orders table or read back uploads. Order tracking goes
through a `security definer` function that requires **both** the order ID and the
matching phone number.

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
app/                    routes (App Router)
  page.tsx              home
  collections/          shop grid + [slug] product pages
  checkout/             4-step checkout
  track/                order tracking
components/             UI + motion components
  checkout/             CheckoutFlow, TrackOrder
lib/
  products.ts           product catalogue — names, prices, variants, image paths
  cart.ts               Zustand cart store + delivery-charge logic
  site.ts               contact number, payment number, delivery rates
  districts.ts          all 64 Bangladesh districts
  useMotionPrefs.ts     central motion gate
public/products/        product photography (one file per product slug)
supabase/schema.sql     database schema
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
