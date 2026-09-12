import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export type ExpireResult = {
  pendingExpired: number;
  waitingExpired: number;
  errors: string[];
};

/**
 * Expire stale orders:
 *   - PENDING_PAYMENT with no proof uploaded and older than {pendingHours} hours → EXPIRED
 *   - WAITING_VERIFICATION older than {waitingHours} hours (admin didn't act) → EXPIRED
 *
 * Linked registrations are also set to EXPIRED so quota is freed up when
 * inventory locking is added later.
 *
 * Idempotent: rerunning does not affect already-terminal orders.
 */
export async function expireStaleOrders(
  opts: { pendingHours?: number; waitingHours?: number } = {}
): Promise<ExpireResult> {
  const pendingHours = opts.pendingHours ?? 24;
  const waitingHours = opts.waitingHours ?? 72;

  // Use service-role client: cron has no user session, must bypass RLS.
  const supabase = createSupabaseServiceClient();
  const errors: string[] = [];

  const pendingCutoff = new Date(Date.now() - pendingHours * 3600_000).toISOString();
  const waitingCutoff = new Date(Date.now() - waitingHours * 3600_000).toISOString();

  // 1. Expire PENDING_PAYMENT older than cutoff with no proof uploaded
  const { data: pending, error: pendErr } = await supabase
    .from('orders')
    .update({ status: 'EXPIRED' })
    .eq('status', 'PENDING_PAYMENT')
    .is('payment_proof_url', null)
    .lt('created_at', pendingCutoff)
    .select('id, registration_id');

  if (pendErr) errors.push(`pending expire: ${pendErr.message}`);
  const pendingIds = (pending ?? []) as { id: string; registration_id: string }[];

  // 2. Expire WAITING_VERIFICATION older than cutoff (grace period for admin action)
  const { data: waiting, error: waitErr } = await supabase
    .from('orders')
    .update({ status: 'EXPIRED' })
    .eq('status', 'WAITING_VERIFICATION')
    .lt('payment_uploaded_at', waitingCutoff)
    .select('id, registration_id');

  if (waitErr) errors.push(`waiting expire: ${waitErr.message}`);
  const waitingIds = (waiting ?? []) as { id: string; registration_id: string }[];

  // 3. Update linked registrations to EXPIRED
  const regIds = [...pendingIds, ...waitingIds].map((o) => o.registration_id).filter(Boolean);
  if (regIds.length > 0) {
    const { error: regErr } = await supabase
      .from('registrations')
      .update({ status: 'EXPIRED' })
      .in('id', regIds);
    if (regErr) errors.push(`registrations expire: ${regErr.message}`);
  }

  return {
    pendingExpired: pendingIds.length,
    waitingExpired: waitingIds.length,
    errors
  };
}
