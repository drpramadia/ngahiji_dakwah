-- NGAHIJI / Phase 13 QRIS manual payment / Supabase PostgreSQL
-- Additive: extends existing orders + payment_transactions, adds payment_settings, storage buckets, RLS.
begin;

-- 1. payment_settings: config table for QRIS/manual payment methods
create table if not exists public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  payment_method text not null default 'QRIS',
  qr_image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns exist (idempotent: table may pre-exist with different schema)
alter table public.payment_settings
  add column if not exists merchant_name text not null default 'NGAHIJI',
  add column if not exists instructions text not null default '',
  add column if not exists bank_name text,
  add column if not exists account_name text,
  add column if not exists account_number text;

drop trigger if exists payment_settings_touch_updated_at on public.payment_settings;
create trigger payment_settings_touch_updated_at before update on public.payment_settings
for each row execute function private.touch_updated_at();

alter table public.payment_settings enable row level security;
revoke all on public.payment_settings from anon, authenticated;
grant select on public.payment_settings to anon, authenticated;
grant insert, update on public.payment_settings to authenticated;

drop policy if exists payment_settings_public_read on public.payment_settings;
create policy payment_settings_public_read on public.payment_settings
for select to anon, authenticated using (active = true);

drop policy if exists payment_settings_staff_write on public.payment_settings;
create policy payment_settings_staff_write on public.payment_settings
for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN')));

-- 2. Extend orders: bukti pembayaran + verification metadata + WAITING_VERIFICATION status
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status in ('DRAFT','PENDING_PAYMENT','WAITING_VERIFICATION','PROCESSING','PAID','FAILED','EXPIRED','CANCELLED','REFUNDED')
);

alter table public.orders
  add column if not exists payment_proof_url text,
  add column if not exists payment_uploaded_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists rejection_reason text;

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_buyer_idx on public.orders(buyer_id);

-- 3. Extend payment_transactions.provider: allow MANUAL_QRIS
alter table public.payment_transactions drop constraint if exists payment_transactions_provider_check;
alter table public.payment_transactions add constraint payment_transactions_provider_check check (
  provider in ('MIDTRANS','XENDIT','MANUAL_QRIS')
);

-- 4. Storage buckets: payment-assets (public: QRIS image), payment-proofs (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('payment-assets', 'payment-assets', true, 5242880, array['image/png','image/jpeg','image/webp']::text[]),
  ('payment-proofs', 'payment-proofs', false, 8388608, array['image/png','image/jpeg','image/webp','application/pdf']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 5. Storage policies
-- payment-assets: staff manage, public read (bucket is public anyway)
drop policy if exists ngahiji_payment_assets_staff_write on storage.objects;
create policy ngahiji_payment_assets_staff_write on storage.objects
for insert to authenticated
with check (bucket_id = 'payment-assets' and private.is_content_staff());

drop policy if exists ngahiji_payment_assets_staff_update on storage.objects;
create policy ngahiji_payment_assets_staff_update on storage.objects
for update to authenticated
using (bucket_id = 'payment-assets' and private.is_content_staff())
with check (bucket_id = 'payment-assets' and private.is_content_staff());

drop policy if exists ngahiji_payment_assets_staff_delete on storage.objects;
create policy ngahiji_payment_assets_staff_delete on storage.objects
for delete to authenticated
using (bucket_id = 'payment-assets' and private.is_content_staff());

drop policy if exists ngahiji_payment_assets_public_read on storage.objects;
create policy ngahiji_payment_assets_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'payment-assets');

-- payment-proofs: buyer uploads own, admin reads all, buyer reads own
drop policy if exists ngahiji_payment_proofs_buyer_insert on storage.objects;
create policy ngahiji_payment_proofs_buyer_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (
    -- buyer uploads to own order folder: {order_id}/...
    exists (
      select 1 from public.orders o
      where o.buyer_id = (select auth.uid())
        and o.id::text = split_part(name, '/', 1)
    )
  )
);

drop policy if exists ngahiji_payment_proofs_buyer_update on storage.objects;
create policy ngahiji_payment_proofs_buyer_update on storage.objects
for update to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.orders o
    where o.buyer_id = (select auth.uid())
      and o.id::text = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.orders o
    where o.buyer_id = (select auth.uid())
      and o.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists ngahiji_payment_proofs_read on storage.objects;
create policy ngahiji_payment_proofs_read on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    -- buyer reads own
    exists (
      select 1 from public.orders o
      where o.buyer_id = (select auth.uid())
        and o.id::text = split_part(name, '/', 1)
    )
    -- or staff (SUPER_ADMIN/ADMIN) reads all
    or exists (
      select 1 from public.organizer_members m
      where m.user_id = (select auth.uid())
        and m.role in ('SUPER_ADMIN','ADMIN')
    )
  )
);

-- 6. RLS for orders: buyer read/insert own, staff read/update all
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select, insert, update on public.orders to authenticated;

drop policy if exists orders_buyer_read on public.orders;
create policy orders_buyer_read on public.orders
for select to authenticated
using (buyer_id = (select auth.uid()));

drop policy if exists orders_buyer_insert on public.orders;
create policy orders_buyer_insert on public.orders
for insert to authenticated
with check (buyer_id = (select auth.uid()));

drop policy if exists orders_buyer_update on public.orders;
create policy orders_buyer_update on public.orders
for update to authenticated
using (buyer_id = (select auth.uid()))
with check (buyer_id = (select auth.uid()));

drop policy if exists orders_staff_all on public.orders;
create policy orders_staff_all on public.orders
for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EVENT_MANAGER')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EVENT_MANAGER')));

-- 7. RLS for order_items: same as orders (via join)
alter table public.order_items enable row level security;
revoke all on public.order_items from anon, authenticated;
grant select, insert on public.order_items to authenticated;

drop policy if exists order_items_buyer_read on public.order_items;
create policy order_items_buyer_read on public.order_items
for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_items.order_id and o.buyer_id = (select auth.uid())));

drop policy if exists order_items_buyer_insert on public.order_items;
create policy order_items_buyer_insert on public.order_items
for insert to authenticated
with check (exists(select 1 from public.orders o where o.id = order_items.order_id and o.buyer_id = (select auth.uid())));

drop policy if exists order_items_staff_all on public.order_items;
create policy order_items_staff_all on public.order_items
for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EVENT_MANAGER')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EVENT_MANAGER')));

-- 8. Seed default QRIS setting
insert into public.payment_settings (payment_method, qr_image_url, merchant_name, instructions, active)
select
  'QRIS',
  'https://coegwnrmedgwvzyxnhwo.supabase.co/storage/v1/object/public/payment-assets/qris/ngahiji-qris.jpeg',
  'NGAHIJI',
  E'1. Scan QR menggunakan mobile banking / e-wallet.\n2. Pastikan nominal sesuai dengan total pembayaran.\n3. Upload bukti transfer setelah pembayaran.\n4. Tim NGAHIJI akan verifikasi maksimal 1x24 jam.',
  true
where not exists (select 1 from public.payment_settings where active = true);

notify pgrst, 'reload schema';
commit;