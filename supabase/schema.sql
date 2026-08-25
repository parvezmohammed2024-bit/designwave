-- Design Wave storefront schema.
-- Run against a Supabase project (SQL Editor or `supabase db push`).
-- Tables are namespaced dw_* so they can share a project safely.

create table if not exists public.dw_orders (
  id text primary key,
  name text not null,
  phone text not null,
  district text not null,
  inside_city boolean not null default false,
  address text not null,
  note text,
  items jsonb not null,
  subtotal integer not null,
  delivery integer not null,
  total integer not null,
  design_finalized boolean not null default false,
  design_files jsonb not null default '[]',
  amount_due integer not null,
  txn_id text,
  status text not null default 'payment_pending',
  created_at timestamptz not null default now()
);

alter table public.dw_orders enable row level security;

-- Customers may create orders. No anonymous select/update/delete policy exists,
-- so the table is not readable with the anon key.
create policy "dw_orders_insert_anon" on public.dw_orders
  for insert to anon with check (true);

-- Order tracking: requires BOTH the order id and the matching phone number.
-- security definer so anon needs no select policy on the table itself.
create or replace function public.dw_track_order(p_id text, p_phone text)
returns table (
  id text, status text, subtotal integer, delivery integer,
  total integer, amount_due integer, txn_id text, created_at timestamptz, items jsonb
)
language sql
security definer
set search_path = public
as $$
  select id, status, subtotal, delivery, total, amount_due, txn_id, created_at, items
  from dw_orders
  where id = upper(trim(p_id)) and phone = trim(p_phone);
$$;

grant execute on function public.dw_track_order to anon;

-- Private bucket for customer design uploads (25MB limit).
insert into storage.buckets (id, name, public, file_size_limit)
values ('dw-designs', 'dw-designs', false, 26214400)
on conflict (id) do nothing;

-- Upload-only: anonymous users can write, but cannot read objects back.
create policy "dw_designs_upload_anon" on storage.objects
  for insert to anon with check (bucket_id = 'dw-designs');
