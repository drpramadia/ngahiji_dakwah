import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ticketQrPayload } from './qr';

export type TicketView = {
  id: string;
  status: string;
  check_in_status: string;
  issued_at: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_whatsapp: string;
  ticket_name: string;
  event_id: string;
  event_title: string;
  event_slug: string;
  event_starts_at: string | null;
  event_city: string;
  event_venue: string;
  qr_payload: string;
};

function pick<T>(rel: T | T[] | null | undefined): T | null {
  return !rel ? null : Array.isArray(rel) ? rel[0] ?? null : rel;
}

export async function getTicketsForOrder(orderId: string): Promise<TicketView[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select(`id, status, check_in_status, issued_at, event_id,
             attendee:attendees(full_name, email, whatsapp),
             ticket_type:ticket_types(name),
             event:events(title, slug, starts_at, city, venue)`)
    .eq('order_id', orderId)
    .order('issued_at', { ascending: true });
  if (error) return [];

  type Row = {
    id: string;
    status: string;
    check_in_status: string;
    issued_at: string | null;
    event_id: string;
    attendee: { full_name: string; email: string; whatsapp: string } | { full_name: string; email: string; whatsapp: string }[] | null;
    ticket_type: { name: string } | { name: string }[] | null;
    event: { title: string; slug: string; starts_at: string | null; city: string; venue: string } | { title: string; slug: string; starts_at: string | null; city: string; venue: string }[] | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  return rows.map((r) => {
    const a = pick(r.attendee);
    const t = pick(r.ticket_type);
    const e = pick(r.event);
    return {
      id: r.id,
      status: r.status,
      check_in_status: r.check_in_status,
      issued_at: r.issued_at,
      attendee_name: a?.full_name ?? '(nama tidak tersedia)',
      attendee_email: a?.email ?? '',
      attendee_whatsapp: a?.whatsapp ?? '',
      ticket_name: t?.name ?? 'Tiket',
      event_id: r.event_id,
      event_title: e?.title ?? '(event tidak ditemukan)',
      event_slug: e?.slug ?? '',
      event_starts_at: e?.starts_at ?? null,
      event_city: e?.city ?? '',
      event_venue: e?.venue ?? '',
      qr_payload: ticketQrPayload(r.id)
    };
  });
}

export async function getTicketsForUser(userId: string): Promise<TicketView[]> {
  const supabase = await createSupabaseServerClient();
  // Get order IDs for this user first
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('buyer_id', userId)
    .eq('status', 'PAID');
  const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('tickets')
    .select(`id, status, check_in_status, issued_at, event_id, order_id,
             attendee:attendees(full_name, email, whatsapp),
             ticket_type:ticket_types(name),
             event:events(title, slug, starts_at, city, venue)`)
    .in('order_id', orderIds)
    .order('issued_at', { ascending: false });
  if (error) return [];

  type Row = {
    id: string;
    status: string;
    check_in_status: string;
    issued_at: string | null;
    event_id: string;
    attendee: { full_name: string; email: string; whatsapp: string } | { full_name: string; email: string; whatsapp: string }[] | null;
    ticket_type: { name: string } | { name: string }[] | null;
    event: { title: string; slug: string; starts_at: string | null; city: string; venue: string } | { title: string; slug: string; starts_at: string | null; city: string; venue: string }[] | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  return rows.map((r) => {
    const a = pick(r.attendee);
    const t = pick(r.ticket_type);
    const e = pick(r.event);
    return {
      id: r.id,
      status: r.status,
      check_in_status: r.check_in_status,
      issued_at: r.issued_at,
      attendee_name: a?.full_name ?? '(nama tidak tersedia)',
      attendee_email: a?.email ?? '',
      attendee_whatsapp: a?.whatsapp ?? '',
      ticket_name: t?.name ?? 'Tiket',
      event_id: r.event_id,
      event_title: e?.title ?? '(event tidak ditemukan)',
      event_slug: e?.slug ?? '',
      event_starts_at: e?.starts_at ?? null,
      event_city: e?.city ?? '',
      event_venue: e?.venue ?? '',
      qr_payload: ticketQrPayload(r.id)
    };
  });
}
