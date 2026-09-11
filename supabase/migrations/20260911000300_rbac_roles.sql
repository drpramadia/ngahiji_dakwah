-- NGAHIJI / Phase 3 RBAC roles / Supabase PostgreSQL
-- Non-destructive constraint update. No table drops, no data deletes.
begin;

alter table public.organizer_members
  drop constraint if exists organizer_members_role_check;

alter table public.organizer_members
  add constraint organizer_members_role_check
  check (role in (
    'SUPER_ADMIN',
    'ADMIN',
    'EVENT_MANAGER',
    'EDITOR',
    'CHECKIN_OPERATOR',
    'SPONSOR_MANAGER',
    'ORGANIZER'
  ));

notify pgrst, 'reload schema';
commit;
