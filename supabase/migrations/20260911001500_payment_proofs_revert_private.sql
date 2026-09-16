-- NGAHIJI / Revert payment-proofs bucket to private + tighten orders RLS
-- Reverts 20260911001400_payment_proofs_public.sql: buyer bank receipts are
-- sensitive and must not be publicly fetchable by UUID path. Admin renders
-- thumbnails via short-lived signed URLs (getPendingPaymentsWithSignedProofs).
--
-- Also aligns orders RLS with the application role check (requireAdmin):
--  - orders_staff_all previously allowed only SUPER_ADMIN/ADMIN/EVENT_MANAGER,
--    while requireAdmin() allows 7 organizer roles — an allowed-but-unmatched
--    admin updated 0 rows silently on approve/reject.
--  - orders_buyer_update is now limited to the payment flow: a buyer may only
--    move their own order from PENDING_PAYMENT/WAITING_VERIFICATION into
--    WAITING_VERIFICATION (upload / re-upload of payment proof).
begin;

-- 1. Bucket back to private (original state from 20260911001300)
update storage.buckets
set public = false
where id = 'payment-proofs';

drop policy if exists ngahiji_payment_proofs_public_read on storage.objects;

-- Re-assert the original private-bucket policies (idempotent restore)
drop policy if exists ngahiji_payment_proofs_buyer_insert on storage.objects;
create policy ngahiji_payment_proofs_buyer_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.orders o
    where o.buyer_id = (select auth.uid())
      and o.id::text = split_part(name, '/', 1)
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
    exists (
      select 1 from public.orders o
      where o.buyer_id = (select auth.uid())
        and o.id::text = split_part(name, '/', 1)
    )
    or exists (
      select 1 from public.organizer_members m
      where m.user_id = (select auth.uid())
        and m.role in ('SUPER_ADMIN','ADMIN')
    )
  )
);

-- 2. Buyer orders update: own order only, payment-flow statuses only
drop policy if exists orders_buyer_update on public.orders;
create policy orders_buyer_update on public.orders
for update to authenticated
using (
  buyer_id = (select auth.uid())
  and status in ('PENDING_PAYMENT','WAITING_VERIFICATION')
)
with check (
  buyer_id = (select auth.uid())
  and status = 'WAITING_VERIFICATION'
);

-- 3. Staff orders access: mirror requireAdmin() role set so every admin who
-- passes the app-level check can also write at the database level
drop policy if exists orders_staff_all on public.orders;
create policy orders_staff_all on public.orders
for all to authenticated
using (exists(
  select 1 from public.organizer_members m
  where m.user_id = (select auth.uid())
    and m.role in ('SUPER_ADMIN','ADMIN','EVENT_MANAGER','EDITOR','CHECKIN_OPERATOR','SPONSOR_MANAGER','ORGANIZER')
))
with check (exists(
  select 1 from public.organizer_members m
  where m.user_id = (select auth.uid())
    and m.role in ('SUPER_ADMIN','ADMIN','EVENT_MANAGER','EDITOR','CHECKIN_OPERATOR','SPONSOR_MANAGER','ORGANIZER')
));

notify pgrst, 'reload schema';
commit;
