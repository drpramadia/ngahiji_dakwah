import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminMetric = {
  label: string;
  value: string;
  status: 'ready' | 'not-configured';
  /** Optional deep link (e.g. payments queue). */
  href?: string;
};

async function countRows(table: 'events' | 'ticket_types' | 'media_items' | 'communities') {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`Unable to read ${table}: ${error.message}`);
  return count ?? 0;
}

/**
 * Real count of orders waiting for manual QRIS verification. Reads go through
 * admin RLS (orders_staff_all); a failure must not break the whole dashboard,
 * so it degrades to null and the card shows a dash.
 */
async function countWaitingVerification(): Promise<number | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'WAITING_VERIFICATION');
    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch (err) {
    console.error('[getAdminDashboardMetrics] waiting verification count failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getAdminDashboardMetrics(): Promise<AdminMetric[]> {
  const [events, ticketTypes, mediaItems, communities, waitingVerification] = await Promise.all([
    countRows('events'),
    countRows('ticket_types'),
    countRows('media_items'),
    countRows('communities'),
    countWaitingVerification()
  ]);

  return [
    { label: 'Menunggu Verifikasi', value: waitingVerification === null ? '—' : String(waitingVerification), status: 'ready', href: '/admin/payments' },
    { label: 'Total Events', value: String(events), status: 'ready' },
    { label: 'Ticket Types', value: String(ticketTypes), status: 'ready' },
    { label: 'Media Items', value: String(mediaItems), status: 'ready' },
    { label: 'Communities', value: String(communities), status: 'ready' },
    { label: 'Revenue', value: 'Belum dikonfigurasi', status: 'not-configured' },
    { label: 'Check-ins', value: 'Belum dikonfigurasi', status: 'not-configured' },
    { label: 'Conversion Rate', value: 'Belum dikonfigurasi', status: 'not-configured' }
  ];
}
