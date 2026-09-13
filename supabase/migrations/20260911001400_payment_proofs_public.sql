-- NGAHIJI / Make payment-proofs bucket public
-- Rationale: Admin CMS renders thumbnails via public URL construction
-- (${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/{path}).
-- Path uses order UUIDs (unguessable), so exposure risk is minimal.
-- Upload/write is still restricted via RLS to the buyer or staff.
begin;

update storage.buckets
set public = true
where id = 'payment-proofs';

-- Ensure the public-read policy exists so unauthenticated GETs succeed
drop policy if exists ngahiji_payment_proofs_public_read on storage.objects;
create policy ngahiji_payment_proofs_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'payment-proofs');

notify pgrst, 'reload schema';
commit;
