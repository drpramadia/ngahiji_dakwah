'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseAndVerifyTicketQr } from '@/lib/tickets/qr';

export type CheckInResult = {
  status: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT' | 'UNPAID' | 'CANCELLED' | 'REFUNDED' | 'ERROR';
  ticket_id: string | null;
  attendee_name: string | null;
  ticket_name: string | null;
  event_title: string | null;
  event_id: string | null;
  scanned_at: string;
  message: string;
};

/**
 * Verify a scanned QR payload and record a check_in row.
 *
 * The DB trigger `guard_check_in` handles the actual atomic state transition:
 *   - Checks payment_status, event_id match, already-used status, etc.
 *   - Sets check_ins.status to VALID / ALREADY_USED / UNPAID / WRONG_EVENT / CANCELLED / REFUNDED
 *   - On VALID: updates tickets.check_in_status='CHECKED_IN', tickets.status='USED'
 *
 * If eventId is provided, we scope check-in to that event; otherwise infer
 * from the ticket record.
 */
export async function scanTicketAction(input: { qr: string; eventId?: string }): Promise<CheckInResult> {
  const { user } = await requireAdmin();

  const scanned_at = new Date().toISOString();
  const ticketId = parseAndVerifyTicketQr(input.qr);
  if (!ticketId) {
    return {
      status: 'INVALID',
      ticket_id: null,
      attendee_name: null,
      ticket_name: null,
      event_title: null,
      event_id: null,
      scanned_at,
      message: 'QR tidak valid atau bukan tiket NGAHIJI.'
    };
  }

  const supabase = await createSupabaseServerClient();

  // Load ticket + relations for feedback
  const { data: ticketRaw, error: loadErr } = await supabase
    .from('tickets')
    .select(`id, event_id, status, check_in_status, payment_status,
             attendee:attendees(full_name),
             ticket_type:ticket_types(name),
             event:events(title)`)
    .eq('id', ticketId)
    .maybeSingle();

  if (loadErr || !ticketRaw) {
    return {
      status: 'INVALID',
      ticket_id: ticketId,
      attendee_name: null,
      ticket_name: null,
      event_title: null,
      event_id: null,
      scanned_at,
      message: 'Tiket tidak ditemukan di database.'
    };
  }

  type Rel<T> = T | T[] | null;
  const pick = <T,>(rel: Rel<T> | undefined): T | null => (!rel ? null : Array.isArray(rel) ? rel[0] ?? null : rel);

  type TicketRow = {
    id: string;
    event_id: string;
    status: string;
    check_in_status: string;
    payment_status: string;
    attendee: Rel<{ full_name: string }>;
    ticket_type: Rel<{ name: string }>;
    event: Rel<{ title: string }>;
  };
  const t = ticketRaw as unknown as TicketRow;
  const attendee_name = pick(t.attendee)?.full_name ?? null;
  const ticket_name = pick(t.ticket_type)?.name ?? null;
  const event_title = pick(t.event)?.title ?? null;
  const event_id = t.event_id;

  const targetEventId = input.eventId || event_id;

  // Insert check_in. Trigger will compute final status.
  const { data: checkIn, error: insErr } = await supabase
    .from('check_ins')
    .insert({
      ticket_id: ticketId,
      event_id: targetEventId,
      operator_id: user.id
    })
    .select('status')
    .single();

  if (insErr) {
    // unique(ticket_id): if already exists row from earlier scan
    if (insErr.code === '23505') {
      return {
        status: 'ALREADY_USED',
        ticket_id: ticketId,
        attendee_name,
        ticket_name,
        event_title,
        event_id,
        scanned_at,
        message: `${attendee_name ?? 'Peserta'} sudah check-in sebelumnya.`
      };
    }
    return {
      status: 'ERROR',
      ticket_id: ticketId,
      attendee_name,
      ticket_name,
      event_title,
      event_id,
      scanned_at,
      message: `Gagal mencatat check-in: ${insErr.message}`
    };
  }

  const finalStatus = checkIn.status as CheckInResult['status'];
  const messageMap: Record<string, string> = {
    VALID: `✓ ${attendee_name ?? 'Peserta'} · ${ticket_name ?? 'Tiket'} — Selamat datang!`,
    ALREADY_USED: `${attendee_name ?? 'Peserta'} sudah check-in sebelumnya.`,
    UNPAID: `Tiket belum lunas. Arahkan ke admin.`,
    WRONG_EVENT: `Tiket untuk event lain (${event_title ?? '—'}).`,
    CANCELLED: `Tiket dibatalkan.`,
    REFUNDED: `Tiket sudah di-refund.`,
    INVALID: 'Tiket tidak valid.'
  };

  return {
    status: finalStatus,
    ticket_id: ticketId,
    attendee_name,
    ticket_name,
    event_title,
    event_id,
    scanned_at,
    message: messageMap[finalStatus] ?? `Status: ${finalStatus}`
  };
}
