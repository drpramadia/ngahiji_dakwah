-- NGAHIJI / Phase 9 storage upload policies / Supabase PostgreSQL
-- Allow staff roles to upload/update/delete objects in media/event/community/sponsor/speaker buckets.
-- Public read is already granted at bucket level (public=true).
begin;

-- Helper: check if current user is staff (ADMIN/EDITOR/SUPER_ADMIN)
create or replace function private.is_content_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists(
    select 1 from public.organizer_members m
    where m.user_id = auth.uid()
      and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')
  );
$$;

grant execute on function private.is_content_staff() to authenticated;

-- storage.objects policies for managed buckets
drop policy if exists ngahiji_storage_staff_insert on storage.objects;
create policy ngahiji_storage_staff_insert on storage.objects
for insert to authenticated
with check (
  bucket_id in ('public-assets','event-assets','media-assets','sponsor-assets','speaker-assets')
  and private.is_content_staff()
);

drop policy if exists ngahiji_storage_staff_update on storage.objects;
create policy ngahiji_storage_staff_update on storage.objects
for update to authenticated
using (
  bucket_id in ('public-assets','event-assets','media-assets','sponsor-assets','speaker-assets')
  and private.is_content_staff()
)
with check (
  bucket_id in ('public-assets','event-assets','media-assets','sponsor-assets','speaker-assets')
  and private.is_content_staff()
);

drop policy if exists ngahiji_storage_staff_delete on storage.objects;
create policy ngahiji_storage_staff_delete on storage.objects
for delete to authenticated
using (
  bucket_id in ('public-assets','event-assets','media-assets','sponsor-assets','speaker-assets')
  and private.is_content_staff()
);

-- Public read for public buckets (redundant with public=true but explicit)
drop policy if exists ngahiji_storage_public_read on storage.objects;
create policy ngahiji_storage_public_read on storage.objects
for select to anon, authenticated
using (
  bucket_id in ('public-assets','event-assets','media-assets','sponsor-assets','speaker-assets')
);

notify pgrst, 'reload schema';
commit;