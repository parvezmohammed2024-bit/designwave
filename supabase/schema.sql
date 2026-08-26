-- =====================================================================
-- Design Wave — full schema.
-- Run against a Supabase project (SQL Editor or `supabase db push`).
-- Tables are namespaced dw_* so the project can be shared safely.
-- ALL money columns are INTEGER POISHA (1 taka = 100 poisha).
-- =====================================================================

-- ---------- staff / roles ----------
create table if not exists public.dw_staff (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

create or replace function public.dw_is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.dw_staff where id = auth.uid());
$$;

create or replace function public.dw_is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.dw_staff where id = auth.uid() and role = 'admin');
$$;

-- ---------- catalogue ----------
create table if not exists public.dw_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_bn text not null,
  tagline_bn text,
  category_slug text,
  hue text not null default 'brand',
  image text,
  blur_data_url text,
  moq integer not null default 100,
  step_quantity integer not null default 100,
  base_unit_price integer not null default 100,
  status text not null default 'active' check (status in ('active','draft')),
  featured boolean not null default false,
  festive boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dw_price_slabs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.dw_products(id) on delete cascade,
  min_qty integer not null,
  max_qty integer,                                  -- null = open ended
  unit_price integer not null,                      -- poisha per piece
  constraint dw_slab_range check (max_qty is null or max_qty >= min_qty)
);
create index if not exists dw_price_slabs_product on public.dw_price_slabs(product_id, min_qty);

create table if not exists public.dw_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.dw_products(id) on delete cascade,
  name_bn text not null,
  price integer not null,
  type text not null check (type in ('flat','per_unit')),
  active boolean not null default true
);
create index if not exists dw_addons_product on public.dw_addons(product_id);

-- ---------- customers ----------
create table if not exists public.dw_customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  addresses jsonb not null default '[]',
  tags text[] not null default '{}',
  notes text,
  follow_up_at date,
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table if not exists public.dw_orders (
  id text primary key,
  customer_id uuid references public.dw_customers(id),
  name text not null,
  phone text not null,
  district text not null,
  inside_city boolean not null default false,
  address text not null,
  note text,
  items jsonb not null,
  subtotal_poisha integer,
  delivery_poisha integer,
  total_poisha integer,
  amount_due_poisha integer,
  subtotal integer, delivery integer, total integer, amount_due integer, -- legacy taka
  design_finalized boolean not null default false,
  design_files jsonb not null default '[]',
  proof_files jsonb not null default '[]',
  revision_count integer not null default 0,
  internal_notes text,
  courier_name text,
  tracking_number text,
  txn_id text,
  status text not null default 'payment_pending'
    check (status in ('payment_pending','design_charge_paid','design_in_review',
                      'revision_requested','design_approved','advance_paid',
                      'in_production','out_for_delivery','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dw_payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.dw_orders(id) on delete cascade,
  kind text not null check (kind in ('design_charge','advance','balance')),
  amount integer not null,
  txn_id text, method text, note text,
  received_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id)
);
create index if not exists dw_payments_order on public.dw_payments(order_id);

-- ---------- quotations ----------
create table if not exists public.dw_quotations (
  id text primary key,
  customer_name text, customer_phone text,
  items jsonb not null default '[]',
  subtotal integer not null default 0,
  delivery integer not null default 0,
  total integer not null default 0,
  notes text, expires_on date,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','expired','converted')),
  converted_order_id text,
  created_at timestamptz not null default now()
);

-- ---------- homepage banner ----------
create table if not exists public.dw_banner_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow_bn text, headline_bn text not null, body_bn text, highlight_bn text,
  cta_label_bn text, cta_href text,
  bg_color text not null default '#6B21A8',
  image_path text,
  visual_kind text not null default 'photo' check (visual_kind in ('photo','eid')),
  starts_on date, ends_on date,
  visible boolean not null default true,
  sort_order integer not null default 0
);

-- ---------- settings + audit ----------
create table if not exists public.dw_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.dw_activity_log (
  id bigserial primary key,
  actor uuid references auth.users(id),
  actor_email text,
  action text not null, entity text, entity_id text, meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists dw_activity_created on public.dw_activity_log(created_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.dw_staff         enable row level security;
alter table public.dw_products      enable row level security;
alter table public.dw_price_slabs   enable row level security;
alter table public.dw_addons        enable row level security;
alter table public.dw_customers     enable row level security;
alter table public.dw_orders        enable row level security;
alter table public.dw_payments      enable row level security;
alter table public.dw_quotations    enable row level security;
alter table public.dw_banner_slides enable row level security;
alter table public.dw_settings      enable row level security;
alter table public.dw_activity_log  enable row level security;

-- public storefront reads
create policy "products_public_read" on public.dw_products
  for select to anon, authenticated using (status = 'active' or public.dw_is_staff());
create policy "slabs_public_read" on public.dw_price_slabs
  for select to anon, authenticated using (true);
create policy "addons_public_read" on public.dw_addons
  for select to anon, authenticated using (active or public.dw_is_staff());
create policy "banner_public_read" on public.dw_banner_slides
  for select to anon, authenticated using (visible or public.dw_is_staff());
create policy "settings_public_read" on public.dw_settings
  for select to anon, authenticated using (true);

-- staff control
create policy "products_staff_write" on public.dw_products
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "slabs_staff_write" on public.dw_price_slabs
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "addons_staff_write" on public.dw_addons
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "banner_staff_write" on public.dw_banner_slides
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "settings_staff_write" on public.dw_settings
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "customers_staff" on public.dw_customers
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "payments_staff" on public.dw_payments
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "quotations_staff" on public.dw_quotations
  for all to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());
create policy "activity_staff_read" on public.dw_activity_log
  for select to authenticated using (public.dw_is_staff());
create policy "activity_staff_insert" on public.dw_activity_log
  for insert to authenticated with check (public.dw_is_staff());
create policy "staff_read_self" on public.dw_staff
  for select to authenticated using (id = auth.uid() or public.dw_is_staff());
create policy "staff_admin_write" on public.dw_staff
  for all to authenticated using (public.dw_is_admin()) with check (public.dw_is_admin());
create policy "orders_staff_read" on public.dw_orders
  for select to authenticated using (public.dw_is_staff());
create policy "orders_staff_write" on public.dw_orders
  for update to authenticated using (public.dw_is_staff()) with check (public.dw_is_staff());

-- =====================================================================
-- Public RPCs (the only writes anonymous visitors can make)
-- =====================================================================

-- Place an order and upsert the customer atomically.
create or replace function public.dw_place_order(payload jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_phone text := trim(payload->>'phone');
  v_id    text := upper(trim(payload->>'id'));
  v_cust  uuid;
begin
  if v_phone !~ '^01[3-9][0-9]{8}$' then raise exception 'invalid phone'; end if;
  if v_id !~ '^DW-[A-Z0-9]{4,12}$' then raise exception 'invalid order id'; end if;

  insert into public.dw_customers (phone, name, addresses)
  values (v_phone, payload->>'name',
          jsonb_build_array(jsonb_build_object(
            'district', payload->>'district', 'address', payload->>'address')))
  on conflict (phone) do update
    set name = coalesce(public.dw_customers.name, excluded.name),
        addresses = case when public.dw_customers.addresses @> excluded.addresses
          then public.dw_customers.addresses
          else public.dw_customers.addresses || excluded.addresses end
  returning id into v_cust;

  insert into public.dw_orders (
    id, customer_id, name, phone, district, inside_city, address, note, items,
    subtotal_poisha, delivery_poisha, total_poisha, amount_due_poisha,
    subtotal, delivery, total, amount_due,
    design_finalized, design_files, txn_id, status
  ) values (
    v_id, v_cust, payload->>'name', v_phone, payload->>'district',
    coalesce((payload->>'inside_city')::boolean, false),
    payload->>'address', nullif(payload->>'note',''), payload->'items',
    (payload->>'subtotal')::int, (payload->>'delivery')::int,
    (payload->>'total')::int, (payload->>'amount_due')::int,
    round((payload->>'subtotal')::int / 100.0), round((payload->>'delivery')::int / 100.0),
    round((payload->>'total')::int / 100.0), round((payload->>'amount_due')::int / 100.0),
    coalesce((payload->>'design_finalized')::boolean, false),
    coalesce(payload->'design_files', '[]'::jsonb),
    nullif(payload->>'txn_id',''), 'payment_pending'
  );
  return v_id;
end; $$;
grant execute on function public.dw_place_order to anon, authenticated;

-- Track an order: requires BOTH the id and the matching phone.
create or replace function public.dw_track_order(p_id text, p_phone text)
returns table (
  id text, status text, subtotal integer, delivery integer,
  total integer, amount_due integer, txn_id text, created_at timestamptz, items jsonb
) language sql security definer stable set search_path = public as $$
  select id, status, subtotal_poisha, delivery_poisha, total_poisha,
         amount_due_poisha, txn_id, created_at, items
  from dw_orders
  where id = upper(trim(p_id)) and phone = trim(p_phone);
$$;
grant execute on function public.dw_track_order to anon;

-- Read a shared quotation link.
create or replace function public.dw_get_quotation(p_id text)
returns setof public.dw_quotations
language sql security definer stable set search_path = public as $$
  select * from public.dw_quotations
  where id = upper(trim(p_id)) and status in ('sent','accepted');
$$;
grant execute on function public.dw_get_quotation to anon;

-- =====================================================================
-- Storage buckets
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('dw-designs', 'dw-designs', false, 26214400)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('dw-public', 'dw-public', true, 10485760)
on conflict (id) do nothing;

-- customers upload design files but cannot read them back
create policy "dw_designs_upload_anon" on storage.objects
  for insert to anon with check (bucket_id = 'dw-designs');

-- catalogue/banner imagery: world-readable, staff-writable
create policy "dw_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'dw-public');
create policy "dw_public_staff_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'dw-public' and public.dw_is_staff());
create policy "dw_public_staff_update" on storage.objects
  for update to authenticated using (bucket_id = 'dw-public' and public.dw_is_staff());
create policy "dw_public_staff_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'dw-public' and public.dw_is_staff());

-- =====================================================================
-- Seed the first admin, then CHANGE THE PASSWORD in the dashboard.
-- =====================================================================
do $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'admin@designwave.com';
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      -- GoTrue scans these into non-nullable strings; NULL breaks login.
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin@designwave.com', extensions.crypt('DesignWave#2026', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Design Wave Admin"}',
      false, false, '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    values (v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email','admin@designwave.com','email_verified',true),
      'email', now(), now());
  end if;
  insert into public.dw_staff (id, email, full_name, role)
  values (v_uid, 'admin@designwave.com', 'Design Wave Admin', 'admin')
  on conflict (id) do update set role = 'admin';
end $$;
