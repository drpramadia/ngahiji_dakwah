-- NGAHIJI / Phase 8 media asset metadata / Supabase PostgreSQL
-- Additive metadata columns for CMS media library. No deletes, no file uploads.
begin;

alter table public.media_assets add column if not exists title text not null default '';
alter table public.media_assets add column if not exists description text not null default '';
alter table public.media_assets add column if not exists category text not null default '';
alter table public.media_assets add column if not exists section text not null default '';
alter table public.media_assets add column if not exists aspect_ratio text not null default '';
alter table public.media_assets add column if not exists source text not null default 'SUPABASE_STORAGE';
alter table public.media_assets add column if not exists public_path text;
alter table public.media_assets add column if not exists external_url text;

alter table public.media_assets drop constraint if exists media_assets_source_check;
alter table public.media_assets add constraint media_assets_source_check
  check (source in ('LOCAL_PUBLIC','SUPABASE_STORAGE','EXTERNAL'));

create index if not exists media_assets_section on public.media_assets(section);
create index if not exists media_assets_source on public.media_assets(source);

notify pgrst, 'reload schema';
commit;
