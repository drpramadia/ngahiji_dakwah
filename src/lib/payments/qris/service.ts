import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { OrderSummary, OrderStatus, PaymentSettings, OrderWithContext } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type OrderWithContextAndProof = OrderWithContext & {
  proof_public_url: string | null;
  /** Backward compat alias — same value as proof_public_url. */
  proof_signed_url: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * Build a public URL for a payment-proofs storage path.
 * Bucket `payment-proofs` is set to public (see migration 20260911001400).
 * Path uses order UUIDs which are unguessable, so exposure risk is minimal.
 */
export function buildPaymentProofUrl(storagePath: string | null): string | null {
  if (!storagePath || !SUPABASE_URL) return null;
  const clean = storagePath.replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/payment-proofs/${clean}`;
}

/**
 * Try service-role client first (bypasses RLS, correct for admin pages that
 * are already role-guarded via requireAdmin()). If SUPABASE_SERVICE_ROLE_KEY
 * is not configured, fall back to the RLS-scoped anon client so at least
 * matching orders (per organizer_members policy) still show up.
 */
async function getAdminClient(): Promise<{ client: SupabaseClient; mode: 'service' | 'anon' }> {
  try {
    const client = createSupabaseServiceClient();
    return { client, mode: 'service' };
  } catch (err) {
    console.warn('[admin/payments] SUPABASE_SERVICE_ROLE_KEY missing, falling back to anon client:', err instanceof Error ? err.message : err);
    const client = await createSupabaseServerClient();
    return { client, mode: 'anon' };
  }
}

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
 * Admin query — service-role preferred, falls back to anon on missing key.
 * SAFE: caller must call requireAdmin() first.
 */
export async function getPendingPaymentsForAdmin(): Promise<OrderWithContext[]> {
  const { client: supabase, mode } = await getAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`id, event_id, buyer_id, status, subtotal_idr, fee_idr, discount_idr, total_idr, payment_proof_url, payment_uploaded_at, paid_at, verified_at, verified_by, rejection_reason, created_at,
             event:events(title, slug),
             items:order_items(quantity, ticket:ticket_types(name)),
             buyer:profiles(email, full_name)`)
    .in('status', ['PENDING_PAYMENT', 'WAITING_VERIFICATION', 'PAID', 'FAILED', 'EXPIRED'])
    .order('payment_uploaded_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error(`[getPendingPaymentsForAdmin] client=${mode} query error:`, error.message);
    return [];
  }
  console.log(`[getPendingPaymentsForAdmin] client=${mode} rows=${data?.length ?? 0}`);

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
 * Same as getPendingPaymentsForAdmin() but attaches a public URL for each
 * order's payment proof (no per-row click required).
 *
 * Public URL construction:
 *   ${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/{path}
 *
 * Requires bucket `payment-proofs` to be public — see migration
 * 20260911001400_payment_proofs_public.sql. `proof_signed_url` is kept as an
 * alias for backward-compat with existing components.
 */
export async function getPendingPaymentsWithSignedProofs(): Promise<OrderWithContextAndProof[]> {
  const orders = await getPendingPaymentsForAdmin();
  return orders.map((o) => {
    const url = buildPaymentProofUrl(o.payment_proof_url);
    return { ...o, proof_public_url: url, proof_signed_url: url };
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, patch: Partial<OrderSummary> = {}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('orders')
    .update({ status, ...patch })
    .eq('id', orderId);
  if (error) throw new Error(`Update order gagal: ${error.message}`);
}
