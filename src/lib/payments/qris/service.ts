import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { OrderSummary, OrderStatus, PaymentSettings, OrderWithContext } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type OrderWithContextAndProof = OrderWithContext & {
  /** Short-lived signed URL (bucket `payment-proofs` is private). */
  proof_signed_url: string | null;
  /** Backward compat alias — same value as proof_signed_url. */
  proof_public_url: string | null;
};

export type AdminPaymentsResult = {
  orders: OrderWithContextAndProof[];
  /** Non-null when the admin payments view cannot load (config or query failure). */
  configError: string | null;
};

const PROOF_URL_TTL_SECONDS = 300;

/**
 * Admin client for payments — requires SUPABASE_SERVICE_ROLE_KEY.
 * Admin pages are already role-guarded via requireAdmin(); reads must bypass
 * buyer-scoped RLS, and a silently degraded anon client made the payments
 * table appear empty with no visible error. Fail loud instead.
 */
async function requireServiceClient(): Promise<SupabaseClient> {
  try {
    return createSupabaseServiceClient();
  } catch (err) {
    throw new Error(
      `Konfigurasi payments admin tidak lengkap: ${err instanceof Error ? err.message : err}`
    );
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
 * Admin query — service-role client only (throws when config is missing).
 * SAFE: caller must call requireAdmin() first.
 */
export async function getPendingPaymentsForAdmin(): Promise<OrderWithContext[]> {
  const supabase = await requireServiceClient();
  // NOTE: orders.buyer_id has an FK to auth.users(id) only — there is no FK
  // between orders and public.profiles, so PostgREST cannot embed
  // `buyer:profiles(...)` ("Could not find a relationship between 'orders' and
  // 'profiles' in the schema cache"). Buyer info is fetched in a second
  // batched query and joined in JS instead.
  const { data, error } = await supabase
    .from('orders')
    .select(`id, event_id, buyer_id, status, subtotal_idr, fee_idr, discount_idr, total_idr, payment_proof_url, payment_uploaded_at, paid_at, verified_at, verified_by, rejection_reason, created_at,
             event:events(title, slug),
             items:order_items(quantity, ticket:ticket_types(name))`)
    .in('status', ['PENDING_PAYMENT', 'WAITING_VERIFICATION', 'PAID', 'FAILED', 'EXPIRED'])
    .order('payment_uploaded_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('[getPendingPaymentsForAdmin] query error:', error.message);
    throw new Error(`Gagal memuat data payments admin: ${error.message}`);
  }

  type EventRel = { title: string; slug: string };
  type TicketRel = { name: string };
  type ItemRel = { quantity: number; ticket: TicketRel | TicketRel[] | null };
  type Row = OrderSummary & {
    event: EventRel | EventRel[] | null;
    items: ItemRel[] | null;
  };

  function pick<T>(rel: T | T[] | null | undefined): T | null {
    if (!rel) return null;
    return Array.isArray(rel) ? (rel[0] ?? null) : rel;
  }

  const rows = (data ?? []) as unknown as Row[];

  const buyerIds = [...new Set(rows.map((r) => r.buyer_id).filter((id): id is string => Boolean(id)))];
  const buyersById = new Map<string, { email: string | null; full_name: string | null }>();
  if (buyerIds.length > 0) {
    const { data: buyers, error: buyersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', buyerIds);
    if (buyersError) {
      // Non-fatal: buyer columns fall back to null instead of failing the page.
      console.error('[getPendingPaymentsForAdmin] profiles lookup failed:', buyersError.message);
    } else {
      for (const b of (buyers ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
        buyersById.set(b.id, { email: b.email, full_name: b.full_name });
      }
    }
  }

  return rows.map((row) => {
    const ev = pick(row.event);
    const buyer = buyersById.get(row.buyer_id) ?? null;
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
 * Same as getPendingPaymentsForAdmin() but attaches a short-lived signed URL
 * for each order's payment proof (bucket `payment-proofs` is private; see
 * migration 20260911001500 which reverts 20260911001400).
 *
 * Never throws for page rendering: configuration or query failures are
 * returned as `configError` so /admin/payments can show a visible warning
 * instead of an empty table.
 */
export async function getPendingPaymentsWithSignedProofs(): Promise<AdminPaymentsResult> {
  let orders: OrderWithContext[];
  try {
    orders = await getPendingPaymentsForAdmin();
  } catch (err) {
    console.error('[getPendingPaymentsWithSignedProofs]', err);
    return {
      orders: [],
      configError: err instanceof Error ? err.message : 'Gagal memuat data payments admin.'
    };
  }

  const withProofs = await Promise.all(
    orders.map(async (o) => {
      let url: string | null = null;
      if (o.payment_proof_url) {
        url = await createSignedProofUrl(o.payment_proof_url);
      }
      return { ...o, proof_signed_url: url, proof_public_url: url };
    })
  );
  return { orders: withProofs, configError: null };
}

async function createSignedProofUrl(storagePath: string): Promise<string | null> {
  try {
    const supabase = await requireServiceClient();
    const clean = storagePath.replace(/^\/+/, '');
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(clean, PROOF_URL_TTL_SECONDS);
    if (error || !data) {
      console.error(`[createSignedProofUrl] failed for ${storagePath}:`, error?.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('[createSignedProofUrl]', err);
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, patch: Partial<OrderSummary> = {}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('orders')
    .update({ status, ...patch }, { count: 'exact' })
    .eq('id', orderId);
  if (error) throw new Error(`Update order gagal: ${error.message}`);
  if (!count) {
    // Zero affected rows = RLS policy miss or wrong order id. This was a
    // silent no-op before (buyer saw "upload sukses" but the order never
    // reached WAITING_VERIFICATION) — fail loud now.
    throw new Error(`Update order ${orderId} gagal: tidak ada baris yang berubah. Periksa kebijakan RLS atau status order.`);
  }
}
