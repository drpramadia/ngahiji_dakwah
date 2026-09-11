-- NGAHIJI / Phase 11 live_streams duration label / Supabase PostgreSQL
-- Adds a display-only duration label (e.g. "12 menit", "1 jam 5 menit").
begin;

alter table public.live_streams
  add column if not exists duration_label text not null default '';

notify pgrst, 'reload schema';
commit;