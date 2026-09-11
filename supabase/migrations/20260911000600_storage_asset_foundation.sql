-- NGAHIJI / Phase 6 storage asset foundation / Supabase PostgreSQL
-- Additive storage buckets and media metadata. No deletes, no object uploads.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml']::text[]),
  ('event-assets', 'event-assets', true, 10485760, array['image/png','image/jpeg','image/webp']::text[]),
  ('media-assets', 'media-assets', true, 10485760, array['image/png','image/jpeg','image/webp']::text[]),
  ('sponsor-assets', 'sponsor-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml']::text[]),
  ('speaker-assets', 'speaker-assets', true, 5242880, array['image/png','image/jpeg','image/webp']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id),
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  file_size bigint check (file_size is null or file_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  status text not null default 'PUBLISHED' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bucket_id, storage_path)
);

drop trigger if exists media_assets_touch_updated_at on public.media_assets;
create trigger media_assets_touch_updated_at before update on public.media_assets
for each row execute function private.touch_updated_at();

alter table public.media_assets enable row level security;
revoke all on public.media_assets from anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, update on public.media_assets to authenticated;

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets for select to anon, authenticated
using (status = 'PUBLISHED');

drop policy if exists media_assets_staff_write on public.media_assets;
create policy media_assets_staff_write on public.media_assets for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')));

create index if not exists media_assets_bucket_path on public.media_assets(bucket_id, storage_path);
create index if not exists media_assets_status on public.media_assets(status);

notify pgrst, 'reload schema';
commit;
