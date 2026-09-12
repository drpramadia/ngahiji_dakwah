import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ticketHmac } from './qr';

/**
 * Issue tickets for a PAID order. Idempotent: if tickets already exist for
 * (order_id, attendee_id), they are skipped. Returns the total ticket count.
 *
 * Ticket lifecycle:
 *   - status='ACTIVE', payment_status='PAID', verification_status='VERIFIED'
 *     satisfies the DB trigger guard (guard_ticket_payment_state).
 *   - qr_token_hash = HMAC(ticket_id) ... but we don't know the ticket ID
 *     until after insert. So we insert first with a placeholder, then
 *     update with the real hash. Since qr_token_hash is unique, we generate
 *     a temporary UUID-based hash for the initial insert.
 */
export async function issueTicketsForOrder(orderId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  // Load order to get event_id + registration_id
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, event_id, registration_id, status')
    .eq('id', orderId)
    .maybeSingle();
  if (orderErr) throw new Error(`Load order gagal: ${orderErr.message}`);
  if (!order) throw new Error('Order tidak ditemukan');
  if (order.status !== 'PAID') {
    // Skip silently: only issue tickets for paid orders.
    return 0;
  }

  // Load order items (to know ticket_type + quantity)
  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('ticket_type_id, quantity')
    .eq('order_id', orderId);
  if (itemsErr) throw new Error(`Load order_items gagal: ${itemsErr.message}`);
  if (!items || items.length === 0) return 0;

  // Load attendees for this registration
  const { data: attendees, error: attErr } = await supabase
    .from('attendees')
    .select('id')
    .eq('registration_id', order.registration_id)
    .order('created_at', { ascending: true });
  if (attErr) throw new Error(`Load attendees gagal: ${attErr.message}`);
  if (!attendees || attendees.length === 0) return 0;

  // Load already-issued tickets to skip duplicates (idempotent)
  const { data: existing } = await supabase
    .from('tickets')
    .select('attendee_id')
    .eq('order_id', orderId);
  const existingSet = new Set((existing ?? []).map((t: { attendee_id: string }) => t.attendee_id));

  // Map attendees to ticket_type (first item wins for MVP; expand later for
  // orders with mixed ticket types)
  const primaryTicketTypeId = items[0].ticket_type_id;

  let issued = 0;
  for (const a of attendees) {
    if (existingSet.has(a.id)) continue;

    // Insert with a placeholder hash first (must be unique per row).
    const placeholder = `pending-${a.id}-${Date.now()}`;
    const { data: inserted, error: insErr } = await supabase
      .from('tickets')
      .insert({
        event_id: order.event_id,
        attendee_id: a.id,
        ticket_type_id: primaryTicketTypeId,
        order_id: orderId,
        qr_token_hash: placeholder,
        status: 'ACTIVE',
        payment_status: 'PAID',
        verification_status: 'VERIFIED',
        issued_at: new Date().toISOString()
      })
      .select('id')
      .single();
    if (insErr) {
      // Unique(order_id, attendee_id) collision → already issued between load and insert; skip.
      if (insErr.message?.includes('duplicate') || insErr.code === '23505') continue;
      throw new Error(`Insert ticket gagal: ${insErr.message}`);
    }

    // Update with real HMAC hash keyed by the actual ticket ID
    const realHash = ticketHmac(inserted.id);
    const { error: updErr } = await supabase
      .from('tickets')
      .update({ qr_token_hash: realHash })
      .eq('id', inserted.id);
    if (updErr) throw new Error(`Set ticket hash gagal: ${updErr.message}`);

    // Also verify the attendee (they've paid)
    await supabase.from('attendees').update({ verification_status: 'VERIFIED' }).eq('id', a.id);

    issued += 1;
  }

  return issued;
}
