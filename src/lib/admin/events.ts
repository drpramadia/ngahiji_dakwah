import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CmsEventStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type CmsEvent = {
  id: string;
  organizer_id: string;
  slug: string;
  title: string;
  description: string;
  status: CmsEventStatus;
  starts_at: string;
  ends_at: string;
  timezone: string;
  city: string;
  venue: string | null;
  category: string;
  format: string;
  image_url: string;
  ticket_types: CmsTicketType[];
};

export type CmsTicketType = {
  id: string;
  event_id: string;
  name: string;
  currency: 'IDR';
  price_idr: number;
  quota: number;
  active: boolean;
};

export async function getCmsEvents() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('id,organizer_id,slug,title,description,status,starts_at,ends_at,timezone,city,venue,category,format,image_url,ticket_types(id,event_id,name,currency,price_idr,quota,active)')
    .order('starts_at', { ascending: true });

  if (error) throw new Error(`Unable to load events: ${error.message}`);
  return (data ?? []) as CmsEvent[];
}

export async function getCmsEventById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('id,organizer_id,slug,title,description,status,starts_at,ends_at,timezone,city,venue,category,format,image_url,ticket_types(id,event_id,name,currency,price_idr,quota,active)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load event: ${error.message}`);
  return data as CmsEvent | null;
}

export async function getWritableOrganizerId() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('organizer_members')
    .select('organizer_id, role')
    .eq('user_id', user.id)
    .in('role', ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR', 'ORGANIZER'])
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to verify organizer access: ${error.message}`);
  if (!data?.organizer_id) throw new Error('No writable organizer role found');
  return String(data.organizer_id);
}
