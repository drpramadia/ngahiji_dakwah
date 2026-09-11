-- NGAHIJI / Phase 12 profiles auth extension / Supabase PostgreSQL
-- Extends public.profiles with fields required by the modern auth flow.
-- Additive: does not drop or rename existing columns.
begin;

alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists provider text,
  add column if not exists role text not null default 'MEMBER' check (role in ('GUEST','MEMBER','ORGANIZER','ADMIN'));

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_email_idx on public.profiles(email);

-- Auto-create profile row when a new auth.users record is inserted.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  detected_provider text := coalesce(new.raw_app_meta_data->>'provider', 'email');
  full_name text := coalesce(meta->>'full_name', meta->>'name', '');
  avatar text := coalesce(meta->>'avatar_url', meta->>'picture', '');
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url, provider, role)
  values (
    new.id,
    full_name,
    new.email,
    new.phone,
    avatar,
    detected_provider,
    'MEMBER'
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar_url = case when public.profiles.avatar_url = '' or public.profiles.avatar_url is null then excluded.avatar_url else public.profiles.avatar_url end,
    provider = coalesce(public.profiles.provider, excluded.provider),
    updated_at = now();
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Backfill existing auth.users into profiles (idempotent via ON CONFLICT).
insert into public.profiles (id, full_name, email, phone, avatar_url, provider, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.email,
  u.phone,
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', ''),
  coalesce(u.raw_app_meta_data->>'provider', 'email'),
  'MEMBER'
from auth.users u
on conflict (id) do nothing;

-- Promote existing organizer_members to ADMIN/ORGANIZER role in profiles.
update public.profiles p
set role = 'ADMIN'
from public.organizer_members m
where m.user_id = p.id
  and m.role in ('SUPER_ADMIN','ADMIN','EDITOR','EVENT_MANAGER','CHECKIN_OPERATOR','SPONSOR_MANAGER');

update public.profiles p
set role = 'ORGANIZER'
from public.organizer_members m
where m.user_id = p.id
  and m.role = 'ORGANIZER'
  and p.role = 'MEMBER';

notify pgrst, 'reload schema';
commit;