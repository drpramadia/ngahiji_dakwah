-- NGAHIJI / Phase 10 live_streams / Supabase PostgreSQL
-- YouTube-embed based live stream registry for the public Ngahiji Live section.
begin;

create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  youtube_video_id text not null,
  youtube_url text not null default '',
  thumbnail_url text not null default '',
  category text not null default 'KAJIAN',
  status text not null default 'PUBLISHED' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  is_live boolean not null default false,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists live_streams_touch_updated_at on public.live_streams;
create trigger live_streams_touch_updated_at before update on public.live_streams
for each row execute function private.touch_updated_at();

alter table public.live_streams enable row level security;
revoke all on public.live_streams from anon, authenticated;
grant select on public.live_streams to anon, authenticated;
grant insert, update, delete on public.live_streams to authenticated;

drop policy if exists live_streams_public_read on public.live_streams;
create policy live_streams_public_read on public.live_streams
for select to anon, authenticated
using (status = 'PUBLISHED');

drop policy if exists live_streams_staff_write on public.live_streams;
create policy live_streams_staff_write on public.live_streams
for all to authenticated
using (private.is_content_staff())
with check (private.is_content_staff());

create index if not exists live_streams_status_live_idx on public.live_streams(status, is_live desc, scheduled_at desc, created_at desc);
create index if not exists live_streams_category_idx on public.live_streams(category);

notify pgrst, 'reload schema';
commit;