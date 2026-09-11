-- NGAHIJI / Phase 5 content CMS RBAC policies / Supabase PostgreSQL
-- Non-destructive policy update. No table drops, no data deletes.
begin;

drop policy if exists media_staff_write on public.media_items;
create policy media_staff_write on public.media_items for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')));

drop policy if exists community_staff_write on public.communities;
create policy community_staff_write on public.communities for all to authenticated
using (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')))
with check (exists(select 1 from public.organizer_members m where m.user_id = (select auth.uid()) and m.role in ('SUPER_ADMIN','ADMIN','EDITOR')));

notify pgrst, 'reload schema';
commit;
