-- NGAHIJI / Phase 7 ticketing foundation / Supabase PostgreSQL
-- Additive registration/order/ticket schema. No payment provider activation, no QR check-in UI activation.
begin;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_PAYMENT','PAID','FAILED','EXPIRED','CANCELLED','REFUNDED')),
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  email text not null check (position('@' in email) > 1),
  instagram text not null default '',
  whatsapp text not null default '',
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','FAILED','EXPIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete restrict,
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_PAYMENT','PROCESSING','PAID','FAILED','EXPIRED','CANCELLED','REFUNDED')),
  currency text not null default 'IDR' check (currency = 'IDR'),
  subtotal_idr bigint not null default 0 check (subtotal_idr >= 0),
  fee_idr bigint not null default 0 check (fee_idr >= 0),
  discount_idr bigint not null default 0 check (discount_idr >= 0),
  total_idr bigint generated always as (greatest((subtotal_idr + fee_idr - discount_idr), 0)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_idr bigint not null check (unit_price_idr >= 0),
  line_total_idr bigint generated always as (quantity * unit_price_idr) stored,
  created_at timestamptz not null default now(),
  unique(order_id, ticket_type_id)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('MIDTRANS','XENDIT')),
  provider_reference text,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','PAID','FAILED','EXPIRED','CANCELLED','REFUNDED')),
  amount_idr bigint not null check (amount_idr >= 0),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_reference)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  attendee_id uuid not null references public.attendees(id) on delete restrict,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  qr_token_hash text not null unique,
  status text not null default 'PENDING_PAYMENT' check (status in ('PENDING_PAYMENT','ACTIVE','CANCELLED','REFUNDED','USED','EXPIRED')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING','PAID','FAILED','EXPIRED','CANCELLED','REFUNDED')),
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','FAILED','EXPIRED')),
  check_in_status text not null default 'NOT_CHECKED_IN' check (check_in_status in ('NOT_CHECKED_IN','CHECKED_IN')),
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, attendee_id)
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.tickets(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  operator_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'VALID' check (status in ('VALID','ALREADY_USED','INVALID','WRONG_EVENT','UNPAID','CANCELLED','REFUNDED')),
  created_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete cascade,
  consent_type text not null check (consent_type in ('TERMS','PRIVACY','WHATSAPP_UPDATES','EMAIL_UPDATES','MARKETING','PARTNER_SPONSOR')),
  status boolean not null,
  privacy_policy_version text not null default 'v1',
  created_at timestamptz not null default now(),
  unique(user_id, registration_id, consent_type, privacy_policy_version)
);

create or replace function private.is_event_staff(event uuid, allowed text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1
    from public.events e
    join public.organizer_members m on m.organizer_id = e.organizer_id
    where e.id = event
      and m.user_id = (select auth.uid())
      and (m.role = 'SUPER_ADMIN' or m.role = any(allowed))
  );
$$;
revoke all on function private.is_event_staff(uuid,text[]) from public;
grant execute on function private.is_event_staff(uuid,text[]) to authenticated;

create or replace function private.guard_ticket_payment_state()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if NEW.status = 'ACTIVE' and (NEW.payment_status <> 'PAID' or NEW.verification_status <> 'VERIFIED') then
    raise exception 'Tickets can only become active after paid and verified state';
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$;
revoke all on function private.guard_ticket_payment_state() from public;

drop trigger if exists ticket_payment_state_guard on public.tickets;
create trigger ticket_payment_state_guard before insert or update on public.tickets
for each row execute function private.guard_ticket_payment_state();

create or replace function private.guard_check_in()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_ticket record;
begin
  select * into target_ticket from public.tickets where id = NEW.ticket_id for update;
  if not found then
    raise exception 'Ticket not found';
  end if;
  if target_ticket.event_id <> NEW.event_id then
    NEW.status = 'WRONG_EVENT';
    return NEW;
  end if;
  if target_ticket.payment_status <> 'PAID' then
    NEW.status = 'UNPAID';
    return NEW;
  end if;
  if target_ticket.status = 'CANCELLED' then
    NEW.status = 'CANCELLED';
    return NEW;
  end if;
  if target_ticket.status = 'REFUNDED' then
    NEW.status = 'REFUNDED';
    return NEW;
  end if;
  if target_ticket.check_in_status = 'CHECKED_IN' then
    NEW.status = 'ALREADY_USED';
    return NEW;
  end if;
  update public.tickets set check_in_status = 'CHECKED_IN', status = 'USED', updated_at = now() where id = NEW.ticket_id;
  NEW.status = 'VALID';
  return NEW;
end;
$$;
revoke all on function private.guard_check_in() from public;

drop trigger if exists atomic_check_in_guard on public.check_ins;
create trigger atomic_check_in_guard before insert on public.check_ins
for each row execute function private.guard_check_in();

create trigger registrations_touch_updated_at before update on public.registrations for each row execute function private.touch_updated_at();
create trigger attendees_touch_updated_at before update on public.attendees for each row execute function private.touch_updated_at();
create trigger orders_touch_updated_at before update on public.orders for each row execute function private.touch_updated_at();
create trigger payment_transactions_touch_updated_at before update on public.payment_transactions for each row execute function private.touch_updated_at();

alter table public.registrations enable row level security;
alter table public.attendees enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.tickets enable row level security;
alter table public.check_ins enable row level security;
alter table public.consents enable row level security;

revoke all on public.registrations, public.attendees, public.orders, public.order_items,
  public.payment_transactions, public.tickets, public.check_ins, public.consents from anon, authenticated;

grant select, insert, update on public.registrations, public.attendees, public.orders, public.order_items,
  public.consents to authenticated;
grant select on public.payment_transactions, public.tickets, public.check_ins to authenticated;
grant insert, update on public.payment_transactions, public.tickets, public.check_ins to authenticated;

create policy registrations_owner_read on public.registrations for select to authenticated
using (buyer_id = (select auth.uid()) or private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER','EDITOR']));
create policy registrations_owner_create on public.registrations for insert to authenticated
with check (buyer_id = (select auth.uid()));
create policy registrations_owner_update on public.registrations for update to authenticated
using (buyer_id = (select auth.uid()) or private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']))
with check (buyer_id = (select auth.uid()) or private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']));

create policy attendees_related_read on public.attendees for select to authenticated
using (exists(select 1 from public.registrations r where r.id = registration_id and (r.buyer_id = (select auth.uid()) or private.is_event_staff(r.event_id, array['ADMIN','EVENT_MANAGER','CHECKIN_OPERATOR']))));
create policy attendees_owner_write on public.attendees for insert to authenticated
with check (exists(select 1 from public.registrations r where r.id = registration_id and r.buyer_id = (select auth.uid())));
create policy attendees_owner_update on public.attendees for update to authenticated
using (exists(select 1 from public.registrations r where r.id = registration_id and r.buyer_id = (select auth.uid())))
with check (exists(select 1 from public.registrations r where r.id = registration_id and r.buyer_id = (select auth.uid())));

create policy orders_related_read on public.orders for select to authenticated
using (buyer_id = (select auth.uid()) or private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']));
create policy orders_owner_create on public.orders for insert to authenticated
with check (buyer_id = (select auth.uid()));
create policy orders_staff_update on public.orders for update to authenticated
using (private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']))
with check (private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']));

create policy order_items_related_read on public.order_items for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = (select auth.uid()) or private.is_event_staff(o.event_id, array['ADMIN','EVENT_MANAGER']))));
create policy order_items_owner_create on public.order_items for insert to authenticated
with check (exists(select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())));

create policy payment_transactions_related_read on public.payment_transactions for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = (select auth.uid()) or private.is_event_staff(o.event_id, array['ADMIN','EVENT_MANAGER']))));
create policy payment_transactions_staff_write on public.payment_transactions for all to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and private.is_event_staff(o.event_id, array['ADMIN','EVENT_MANAGER'])))
with check (exists(select 1 from public.orders o where o.id = order_id and private.is_event_staff(o.event_id, array['ADMIN','EVENT_MANAGER'])));

create policy tickets_related_read on public.tickets for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = (select auth.uid()) or private.is_event_staff(o.event_id, array['ADMIN','EVENT_MANAGER','CHECKIN_OPERATOR']))));
create policy tickets_staff_write on public.tickets for all to authenticated
using (private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']))
with check (private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER']));

create policy check_ins_staff_read on public.check_ins for select to authenticated
using (private.is_event_staff(event_id, array['ADMIN','EVENT_MANAGER','CHECKIN_OPERATOR']));
create policy check_ins_operator_create on public.check_ins for insert to authenticated
with check (operator_id = (select auth.uid()) and private.is_event_staff(event_id, array['ADMIN','CHECKIN_OPERATOR']));

create policy consents_owner_read on public.consents for select to authenticated
using (user_id = (select auth.uid()) or exists(select 1 from public.registrations r where r.id = registration_id and private.is_event_staff(r.event_id, array['ADMIN','EVENT_MANAGER'])));
create policy consents_owner_create on public.consents for insert to authenticated
with check (user_id = (select auth.uid()));

create index if not exists registrations_event on public.registrations(event_id);
create index if not exists registrations_buyer on public.registrations(buyer_id);
create index if not exists attendees_registration on public.attendees(registration_id);
create index if not exists orders_buyer on public.orders(buyer_id);
create index if not exists orders_event on public.orders(event_id);
create index if not exists order_items_order on public.order_items(order_id);
create index if not exists tickets_event on public.tickets(event_id);
create index if not exists tickets_order on public.tickets(order_id);
create index if not exists tickets_attendee on public.tickets(attendee_id);
create index if not exists check_ins_event on public.check_ins(event_id);
create index if not exists consents_user on public.consents(user_id);

notify pgrst, 'reload schema';
commit;
