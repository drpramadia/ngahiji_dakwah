-- NGAHIJI / Phase 4 SUPER_ADMIN RBAC semantics / Supabase PostgreSQL
-- Non-destructive function update. No table drops, no data deletes.
begin;

create or replace function private.has_role(org uuid, allowed text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1
    from public.organizer_members
    where organizer_id = org
      and user_id = (select auth.uid())
      and (role = 'SUPER_ADMIN' or role = any(allowed))
  );
$$;

revoke all on function private.has_role(uuid,text[]) from public;
grant execute on function private.has_role(uuid,text[]) to authenticated;

notify pgrst, 'reload schema';
commit;
