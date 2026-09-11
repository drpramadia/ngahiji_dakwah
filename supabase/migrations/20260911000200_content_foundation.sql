-- NGAHIJI / Phase 2 content foundation / Supabase PostgreSQL
-- Non-destructive additive migration. No drops, no resets.
begin;

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 220),
  category text not null check (length(trim(category)) between 1 and 80),
  format text not null check (format in ('ARTICLE','VIDEO','PODCAST','SHORT_STORY')),
  excerpt text not null default '',
  body text not null default '',
  image_url text not null default '',
  reading_time text not null default '',
  published_at timestamptz not null default now(),
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique check (length(trim(name)) between 1 and 120),
  mark text not null default '',
  color text not null default '#d5fa47',
  description text not null default '',
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.touch_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;
revoke all on function private.touch_updated_at() from public;

drop trigger if exists media_items_touch_updated_at on public.media_items;
create trigger media_items_touch_updated_at before update on public.media_items
for each row execute function private.touch_updated_at();

drop trigger if exists communities_touch_updated_at on public.communities;
create trigger communities_touch_updated_at before update on public.communities
for each row execute function private.touch_updated_at();

drop trigger if exists media_items_audit on public.media_items;
create trigger media_items_audit after insert or update on public.media_items
for each row execute function private.audit_catalog();

drop trigger if exists communities_audit on public.communities;
create trigger communities_audit after insert or update on public.communities
for each row execute function private.audit_catalog();

alter table public.media_items enable row level security;
alter table public.communities enable row level security;

revoke all on public.media_items, public.communities from anon, authenticated;
grant select on public.media_items, public.communities to anon, authenticated;
grant insert, update on public.media_items, public.communities to authenticated;

drop policy if exists media_public_read on public.media_items;
create policy media_public_read on public.media_items for select to anon, authenticated
using (status = 'PUBLISHED');

drop policy if exists media_staff_write on public.media_items;
create policy media_staff_write on public.media_items for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('ADMIN','EDITOR')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('ADMIN','EDITOR')));

drop policy if exists community_public_read on public.communities;
create policy community_public_read on public.communities for select to anon, authenticated
using (status = 'PUBLISHED');

drop policy if exists community_staff_write on public.communities;
create policy community_staff_write on public.communities for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('ADMIN','EDITOR')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('ADMIN','EDITOR')));

create index if not exists media_items_public_date on public.media_items(published_at desc) where status = 'PUBLISHED';
create index if not exists media_items_category on public.media_items(category);
create index if not exists communities_public_order on public.communities(sort_order, name) where status = 'PUBLISHED';

notify pgrst, 'reload schema';
commit;
