-- NGAHIJI / Phase 1 foundation / Supabase PostgreSQL
-- Review and run on a NEW staging database first. Not executed in this session.
-- Scope: profiles, organizer membership, event CMS and ticket-type catalog.
-- No orders, payment, reservations or QR issuance in this migration.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  instagram text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Email/auth verification remain owned by Supabase Auth.
create table public.organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  created_at timestamptz not null default now()
);
create table public.organizer_members (
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('ADMIN','EVENT_MANAGER','EDITOR','CHECKIN_OPERATOR')),
  primary key (organizer_id,user_id)
);
-- Membership provisioning is a trusted server/admin operation only.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  status text not null default 'DRAFT'
    check (status in ('DRAFT','REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Asia/Jakarta',
  city text not null,
  venue text,
  hero_storage_path text,
  category text not null default 'Event',
  format text not null default 'Community',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  currency text not null default 'IDR' check (currency = 'IDR'),
  price_idr bigint not null check (price_idr between 0 and 1000000000),
  quota integer not null check (quota >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id,name)
);
-- quota is configured capacity, NOT available inventory.
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  operation text not null,
  object_table text not null,
  object_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create function private.has_role(org uuid, allowed text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organizer_members
    where organizer_id = org and user_id = (select auth.uid()) and role = any(allowed));
$$;
revoke all on function private.has_role(uuid,text[]) from public;
grant execute on function private.has_role(uuid,text[]) to authenticated;

create function private.guard_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' and NEW.organizer_id is distinct from OLD.organizer_id then
    raise exception 'Event organizer is immutable';
  end if;
  if auth.role() = 'authenticated' then
    -- Non-admin editors can only work with drafts/review, not publish indirectly.
    if not private.has_role(NEW.organizer_id, array['ADMIN']) then
      if NEW.status not in ('DRAFT','REVIEW') then
        raise exception 'Only organizer admins may approve, publish or archive';
      end if;
      if TG_OP = 'UPDATE' and OLD.status not in ('DRAFT','REVIEW') then
        raise exception 'Published/approved events require an admin';
      end if;
    end if;
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$;
create trigger event_guard before insert or update on public.events
for each row execute function private.guard_event();

create function private.audit_catalog()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(actor_id, operation, object_table, object_id, old_value, new_value)
  values(auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id,
    case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end, to_jsonb(NEW));
  return NEW;
end;
$$;
create trigger event_audit after insert or update on public.events
for each row execute function private.audit_catalog();
create trigger ticket_type_audit after insert or update on public.ticket_types
for each row execute function private.audit_catalog();
revoke all on function private.guard_event() from public;
revoke all on function private.audit_catalog() from public;

alter table public.profiles enable row level security;
alter table public.organizers enable row level security;
alter table public.organizer_members enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.audit_logs enable row level security;

-- Explicit privileges; do not rely on Supabase defaults.
revoke all on public.profiles, public.organizers, public.organizer_members,
 public.events, public.ticket_types, public.audit_logs from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.organizers, public.organizer_members to authenticated;
grant select on public.events, public.ticket_types to anon, authenticated;
grant insert, update on public.events, public.ticket_types to authenticated;

create policy profile_read on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profile_create on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profile_edit on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy member_read_self on public.organizer_members for select to authenticated
using (user_id = (select auth.uid()));
create policy organizer_read on public.organizers for select to authenticated
using (private.has_role(id,array['ADMIN','EVENT_MANAGER','EDITOR','CHECKIN_OPERATOR']));
create policy event_public_read on public.events for select to anon, authenticated
using (status = 'PUBLISHED');
create policy event_staff_read on public.events for select to authenticated
using (private.has_role(organizer_id,array['ADMIN','EVENT_MANAGER','EDITOR']));
create policy event_create on public.events for insert to authenticated
with check (private.has_role(organizer_id,array['ADMIN','EVENT_MANAGER','EDITOR']));
create policy event_edit on public.events for update to authenticated
using (private.has_role(organizer_id,array['ADMIN','EVENT_MANAGER','EDITOR']))
with check (private.has_role(organizer_id,array['ADMIN','EVENT_MANAGER','EDITOR']));
create policy ticket_public_read on public.ticket_types for select to anon, authenticated
using (active and exists(select 1 from public.events e where e.id = event_id and e.status = 'PUBLISHED'));
create policy ticket_staff_read on public.ticket_types for select to authenticated
using (exists(select 1 from public.events e where e.id = event_id
  and private.has_role(e.organizer_id,array['ADMIN','EVENT_MANAGER'])));
create policy ticket_create on public.ticket_types for insert to authenticated
with check (exists(select 1 from public.events e where e.id = event_id
  and private.has_role(e.organizer_id,array['ADMIN','EVENT_MANAGER'])));
create policy ticket_edit on public.ticket_types for update to authenticated
using (exists(select 1 from public.events e where e.id = event_id
  and private.has_role(e.organizer_id,array['ADMIN','EVENT_MANAGER'])))
with check (exists(select 1 from public.events e where e.id = event_id
  and private.has_role(e.organizer_id,array['ADMIN','EVENT_MANAGER'])));
-- No browser grants/policies on audit_logs. Read through authorized server tooling.
create index events_public_date on public.events(starts_at) where status = 'PUBLISHED';
create index events_organizer on public.events(organizer_id);
create index members_user on public.organizer_members(user_id);
create index ticket_types_event on public.ticket_types(event_id);
commit;
