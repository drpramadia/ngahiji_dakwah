import { NextResponse, type NextRequest } from 'next/server';
import { createOrderAction } from '@/lib/payments/qris/actions';
import type { AttendeeInput } from '@/lib/payments/qris/action-types';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';

  let eventId = '';
  let ticketTypeId = '';
  let quantity = 1;
  let attendees: AttendeeInput[] | undefined;
  let buyer: { full_name?: string; email?: string; whatsapp?: string; instagram?: string } | undefined;

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    eventId = String(body.event_id ?? '');
    ticketTypeId = String(body.ticket_type_id ?? '');
    quantity = Number(body.quantity ?? 1);
    attendees = Array.isArray(body.attendees) ? body.attendees : undefined;
    buyer = body.buyer && typeof body.buyer === 'object' ? body.buyer : undefined;
  } else {
    const form = await request.formData();
    eventId = String(form.get('event_id') ?? '');
    ticketTypeId = String(form.get('ticket_type_id') ?? '');
    quantity = Number(form.get('quantity') ?? 1);
  }

  try {
    const { orderId } = await createOrderAction({ eventId, ticketTypeId, quantity, attendees, buyer });
    if (contentType.includes('application/json')) {
      return NextResponse.json({ orderId, redirect: `/checkout/${orderId}` });
    }
    return NextResponse.redirect(new URL(`/checkout/${orderId}`, request.url), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout gagal';
    if (contentType.includes('application/json')) {
      const status = message.includes('login') ? 401 : 400;
      return NextResponse.json({ error: message }, { status });
    }
    if (message.includes('login')) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent('/#events')}`, request.url), { status: 303 });
    }
    return NextResponse.redirect(new URL(`/?checkout_error=${encodeURIComponent(message)}`, request.url), { status: 303 });
  }
}