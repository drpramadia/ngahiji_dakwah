import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { OrderSummary, OrderStatus, PaymentSettings, OrderWithContext } from './types';

export type OrderWithContextAndProof = OrderWithContext & {
  proof_signed_url: string | null;
};

export async function getActivePaymentSettings(): Promise<PaymentSettings | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('payment_settings')
    .select('id, payment_method, qr_image_url, merchant_name, instructions, bank_name, account_name, account_number, active')
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as PaymentSettings | null) ?? null;
}

export async function getOrderById(orderId: string): Promise<OrderSummary | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, event_id, buyer_id, status, subtotal_idr, fee_idr, discount_idr, total_idr, payment_proof_url, payment_uploaded_at, paid_at, verified_at, verified_by, rejection_reason, created_at')
    .eq('id', orderId)
    .maybeSingle();
  if (error) return null;
  return (data as OrderSummary | null) ?? null;
}

/**
 * Admin query — uses SERVICE-ROLE client to bypass RLS.
 * SAFE: caller must call requireAdmin() first (see /admin/payments/page.tsx).
 *
 * Fix (2025-01): server-side (anon-client) query returned 0 rows because RLS
 * policy `orders_staff_all` requires the admin user to be in `organizer_members`
 * with a role matching the order's event/organizer. If mapping is missing or
 * incomplete, admin sees empty list even when orders exist. Service client
 * bypasses RLS entirely, which is correct behavior for a role-guarded page.
 */
export async function getPendingPaymentsForAdmin(): Promise<OrderWithContext[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`id, event_id, buyer_id, status, subtotal_idr, fee_idr, discount_idr, total_idr, payment_proof_url, payment_uploaded_at, paid_at, verified_at, verified_by, rejection_reason, created_at,
             event:events(title, slug),
             items:order_items(quantity, ticket:ticket_types(name)),
             buyer:profiles(email, full_name)`)
    .in('status', ['PENDING_PAYMENT', 'WAITING_VERIFICATION', 'PAID', 'FAILED', 'EXPIRED'])
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('[getPendingPaymentsForAdmin] query error:', error.message);
    return [];
  }

  type EventRel = { title: string; slug: string };
  type TicketRel = { name: string };
  type ItemRel = { quantity: number; ticket: TicketRel | TicketRel[] | null };
  type BuyerRel = { email: string | null; full_name: string | null };
  type Row = OrderSummary & {
    event: EventRel | EventRel[] | null;
    items: ItemRel[] | null;
    buyer: BuyerRel | BuyerRel[] | null;
  };

  function pick<T>(rel: T | T[] | null | undefined): T | null {
    if (!rel) return null;
    return Array.isArray(rel) ? (rel[0] ?? null) : rel;
  }

  const rows = (data ?? []) as unknown as Row[];
  return rows.map((row) => {
    const ev = pick(row.event);
    const buyer = pick(row.buyer);
    const firstItem = row.items?.[0] ?? null;
    const ticket = pick(firstItem?.ticket);
    return {
      ...row,
      event_title: ev?.title ?? '(event tidak ditemukan)',
      event_slug: ev?.slug ?? '',
      ticket_name: ticket?.name ?? '',
      quantity: row.items?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0,
      buyer_email: buyer?.email ?? null,
      buyer_name: buyer?.full_name ?? null
    };
  });
}

/**
 * Same as getPendingPaymentsForAdmin() but also generates a short-lived signed
 * URL for each order's payment proof so the admin table can render a thumbnail
 * inline (no per-row click required).
 */
export async function getPendingPaymentsWithSignedProofs(): Promise<OrderWithContextAndProof[]> {
  const orders = await getPendingPaymentsForAdmin();
  if (orders.length === 0) return [];

  const supabase = createSupabaseServiceClient();
  const withProofs = await Promise.all(
    orders.map(async (o) => {
      if (!o.payment_proof_url) return { ...o, proof_signed_url: null };
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(o.payment_proof_url, 600);
      if (error) {
        console.warn(`[proof-url] failed for order ${o.id}: ${error.message}`);
        return { ...o, proof_signed_url: null };
      }
      return { ...o, proof_signed_url: data.signedUrl };
    })
  );
  return withProofs;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, patch: Partial<OrderSummary> = {}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('orders')
    .update({ status, ...patch })
    .eq('id', orderId);
  if (error) throw new Error(`Update order gagal: ${error.message}`);
}