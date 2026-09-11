import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminMetric = {
  label: string;
  value: string;
  status: 'ready' | 'not-configured';
};

async function countRows(table: 'events' | 'ticket_types' | 'media_items' | 'communities') {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`Unable to read ${table}: ${error.message}`);
  return count ?? 0;
}

export async function getAdminDashboardMetrics(): Promise<AdminMetric[]> {
  const [events, ticketTypes, mediaItems, communities] = await Promise.all([
    countRows('events'),
    countRows('ticket_types'),
    countRows('media_items'),
    countRows('communities')
  ]);

  return [
    { label: 'Total Events', value: String(events), status: 'ready' },
    { label: 'Ticket Types', value: String(ticketTypes), status: 'ready' },
    { label: 'Media Items', value: String(mediaItems), status: 'ready' },
    { label: 'Communities', value: String(communities), status: 'ready' },
    { label: 'Orders', value: 'Belum dikonfigurasi', status: 'not-configured' },
    { label: 'Revenue', value: 'Belum dikonfigurasi', status: 'not-configured' },
    { label: 'Check-ins', value: 'Belum dikonfigurasi', status: 'not-configured' },
    { label: 'Conversion Rate', value: 'Belum dikonfigurasi', status: 'not-configured' }
  ];
}
