import { NextResponse, type NextRequest } from 'next/server';
import { createOrderAction } from '@/lib/payments/qris/actions';

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const eventId = String(form.get('event_id') ?? '');
  const ticketTypeId = String(form.get('ticket_type_id') ?? '');
  const quantity = Number(form.get('quantity') ?? 1);

  try {
    const { orderId } = await createOrderAction({ eventId, ticketTypeId, quantity });
    return NextResponse.redirect(new URL(`/checkout/${orderId}`, request.url), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout gagal';
    if (message.includes('login')) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent('/#events')}`, request.url), { status: 303 });
    }
    return NextResponse.redirect(new URL(`/?checkout_error=${encodeURIComponent(message)}`, request.url), { status: 303 });
  }
}