import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CmsOrder = {
  id: string;
  status: string;
  currency: 'IDR';
  subtotal_idr: number;
  fee_idr: number;
  discount_idr: number;
  total_idr: number;
  created_at: string;
  events: { title: string; slug: string } | null;
};

export type CmsAttendee = {
  id: string;
  full_name: string;
  email: string;
  instagram: string;
  whatsapp: string;
  verification_status: string;
  created_at: string;
  registrations: { events: { title: string; slug: string } | null } | null;
};

export type CmsTicket = {
  id: string;
  status: string;
  payment_status: string;
  verification_status: string;
  check_in_status: string;
  issued_at: string | null;
  events: { title: string; slug: string } | null;
  attendees: { full_name: string; email: string } | null;
};

export type CmsCheckIn = {
  id: string;
  status: string;
  created_at: string;
  events: { title: string; slug: string } | null;
  tickets: { id: string; attendees: { full_name: string } | null } | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getCmsOrders() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id,status,currency,subtotal_idr,fee_idr,discount_idr,total_idr,created_at,events(title,slug)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Unable to load orders: ${error.message}`);
  return (data ?? []).map((order) => ({
    ...order,
    events: firstRelation(order.events)
  })) as CmsOrder[];
}

export async function getCmsAttendees() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('attendees')
    .select('id,full_name,email,instagram,whatsapp,verification_status,created_at,registrations(events(title,slug))')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Unable to load attendees: ${error.message}`);
  return (data ?? []).map((attendee) => ({
    ...attendee,
    registrations: firstRelation(attendee.registrations)
      ? { events: firstRelation(firstRelation(attendee.registrations)?.events) }
      : null
  })) as CmsAttendee[];
}

export async function getCmsTickets() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('id,status,payment_status,verification_status,check_in_status,issued_at,events(title,slug),attendees(full_name,email)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Unable to load tickets: ${error.message}`);
  return (data ?? []).map((ticket) => ({
    ...ticket,
    events: firstRelation(ticket.events),
    attendees: firstRelation(ticket.attendees)
  })) as CmsTicket[];
}

export async function getCmsCheckIns() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('check_ins')
    .select('id,status,created_at,events(title,slug),tickets(id,attendees(full_name))')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Unable to load check-ins: ${error.message}`);
  return (data ?? []).map((checkIn) => {
    const ticket = firstRelation(checkIn.tickets);
    return {
      ...checkIn,
      events: firstRelation(checkIn.events),
      tickets: ticket ? { ...ticket, attendees: firstRelation(ticket.attendees) } : null
    };
  }) as CmsCheckIn[];
}
