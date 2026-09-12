'use server';


import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateOrderStatus, getOrderById } from './service';
import type { CreateOrderInput } from './action-types';

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function createOrderAction(input: CreateOrderInput): Promise<{ orderId: string }> {
  if (!UUID_RE.test(input.eventId) || !UUID_RE.test(input.ticketTypeId)) {
    throw new Error('Invalid event or ticket type');
  }
  const quantity = Math.max(1, Math.min(20, Math.floor(Number(input.quantity) || 1)));

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Silakan login terlebih dahulu untuk membeli tiket');

  const { data: ticket, error: ticketError } = await supabase
    .from('ticket_types')
    .select('id, event_id, name, price_idr, active')
    .eq('id', input.ticketTypeId)
    .maybeSingle();
  if (ticketError || !ticket) throw new Error('Ticket type tidak ditemukan');
  if (!ticket.active) throw new Error('Ticket type tidak aktif');
  if (ticket.event_id !== input.eventId) throw new Error('Ticket type bukan milik event ini');

  const subtotal = Number(ticket.price_idr) * quantity;

  // Create registration first (required by orders schema)
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .insert({
      event_id: input.eventId,
      buyer_id: user.id,
      status: 'PENDING_PAYMENT',
      quantity
    })
    .select('id')
    .single();
  if (regError) throw new Error(`Gagal membuat registrasi: ${regError.message}`);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      registration_id: registration.id,
      buyer_id: user.id,
      event_id: input.eventId,
      status: 'PENDING_PAYMENT',
      currency: 'IDR',
      subtotal_idr: subtotal,
      fee_idr: 0,
      discount_idr: 0
    })
    .select('id')
    .single();
  if (orderError) throw new Error(`Gagal membuat order: ${orderError.message}`);

  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      ticket_type_id: ticket.id,
      quantity,
      unit_price_idr: Number(ticket.price_idr)
    });
  if (itemError) throw new Error(`Gagal membuat order item: ${itemError.message}`);

  // Persist attendees (best-effort; failure does not roll back order)
  if (input.attendees && input.attendees.length > 0) {
    const rows = input.attendees.slice(0, quantity).map((a, idx) => ({
      registration_id: registration.id,
      user_id: idx === 0 ? user.id : null,
      full_name: (a.full_name || '').slice(0, 120) || `Peserta ${idx + 1}`,
      email: (a.email || user.email || '').slice(0, 200),
      whatsapp: (a.whatsapp || '').slice(0, 40),
      instagram: (a.instagram || '').slice(0, 60)
    }));
    const { error: attErr } = await supabase.from('attendees').insert(rows);
    if (attErr) console.warn(`[checkout] failed to insert attendees: ${attErr.message}`);
  }

  // Update buyer profile with any new contact info (best-effort)
  if (input.buyer && (input.buyer.full_name || input.buyer.instagram || input.buyer.whatsapp)) {
    const patch: Record<string, string> = {};
    if (input.buyer.full_name) patch.full_name = input.buyer.full_name;
    if (input.buyer.instagram) patch.instagram = input.buyer.instagram;
    if (input.buyer.whatsapp) patch.whatsapp = input.buyer.whatsapp;
    if (Object.keys(patch).length > 0) {
      await supabase.from('profiles').update(patch).eq('id', user.id);
    }
  }

  return { orderId: order.id };
}

export async function checkoutAndRedirectAction(formData: FormData): Promise<void> {
  const eventId = String(formData.get('event_id') ?? '');
  const ticketTypeId = String(formData.get('ticket_type_id') ?? '');
  const quantity = Number(formData.get('quantity') ?? 1);
  const { orderId } = await createOrderAction({ eventId, ticketTypeId, quantity });
  redirect(`/checkout/${orderId}`);
}

export async function uploadPaymentProofAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get('order_id') ?? '');
  const file = formData.get('file');
  if (!UUID_RE.test(orderId)) throw new Error('Invalid order ID');
  if (!(file instanceof File) || file.size === 0) throw new Error('File bukti pembayaran wajib diunggah');
  if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran file maksimal 8 MB');
  if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)) {
    throw new Error('Format harus PNG/JPG/WEBP/PDF');
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Silakan login terlebih dahulu');

  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order tidak ditemukan');
  if (order.buyer_id !== user.id) throw new Error('Order bukan milik akun ini');

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${orderId}/proof-${Date.now()}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, bytes, {
    contentType: file.type,
    upsert: true
  });
  if (upErr) throw new Error(`Upload bukti gagal: ${upErr.message}`);

  // Store path (bucket is private; admin fetches via signed URL)
  await updateOrderStatus(orderId, 'WAITING_VERIFICATION', {
    payment_proof_url: path,
    payment_uploaded_at: new Date().toISOString()
  });

  revalidatePath(`/checkout/${orderId}`);
  revalidatePath('/admin/payments');
}

export async function approvePaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = String(formData.get('order_id') ?? '');
  if (!UUID_RE.test(orderId)) throw new Error('Invalid order ID');

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  await updateOrderStatus(orderId, 'PAID', {
    paid_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    rejection_reason: null
  });

  // Update linked registration + payment_transaction record
  const { data: order } = await supabase
    .from('orders')
    .select('registration_id, total_idr')
    .eq('id', orderId)
    .maybeSingle();
  if (order) {
    await supabase.from('registrations').update({ status: 'CONFIRMED' }).eq('id', order.registration_id);
    await supabase.from('payment_transactions').insert({
      order_id: orderId,
      provider: 'MANUAL_QRIS',
      status: 'PAID',
      amount_idr: order.total_idr ?? 0,
      raw_payload: { verified_by: user?.id ?? null, method: 'MANUAL_QRIS_APPROVAL' }
    });
  }

  revalidatePath('/admin/payments');
  revalidatePath(`/checkout/${orderId}`);
}

export async function rejectPaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = String(formData.get('order_id') ?? '');
  const reason = String(formData.get('reason') ?? '').slice(0, 300);
  if (!UUID_RE.test(orderId)) throw new Error('Invalid order ID');

  await updateOrderStatus(orderId, 'FAILED', {
    rejection_reason: reason || 'Pembayaran tidak dapat diverifikasi',
    verified_at: new Date().toISOString()
  });

  revalidatePath('/admin/payments');
  revalidatePath(`/checkout/${orderId}`);
}

export async function getSignedProofUrl(path: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}