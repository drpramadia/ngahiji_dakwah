'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getWritableOrganizerId } from '@/lib/admin/events';
import { parseEventForm, type EventFormInput } from '@/lib/admin/event-validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function eventPayload(input: EventFormInput, organizerId: string) {
  return {
    organizer_id: organizerId,
    slug: input.slug,
    title: input.title,
    description: input.description,
    status: input.status,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    timezone: input.timezone,
    city: input.city,
    venue: input.venue,
    category: input.category,
    format: input.format,
    image_url: input.image_url
  };
}

async function upsertPrimaryTicket(eventId: string, input: EventFormInput) {
  const supabase = await createSupabaseServerClient();
  const payload = {
    event_id: eventId,
    name: input.ticket_name,
    currency: 'IDR' as const,
    price_idr: input.ticket_price_idr,
    quota: input.ticket_quota,
    active: input.ticket_active
  };

  const { data: existing, error: lookupError } = await supabase
    .from('ticket_types')
    .select('id')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(`Unable to read ticket type: ${lookupError.message}`);

  const query = existing?.id
    ? supabase.from('ticket_types').update(payload).eq('id', existing.id)
    : supabase.from('ticket_types').insert(payload);

  const { error } = await query;
  if (error) throw new Error(`Unable to save ticket type: ${error.message}`);
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  const input = parseEventForm(formData);
  const organizerId = await getWritableOrganizerId();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('events')
    .insert(eventPayload(input, organizerId))
    .select('id')
    .single();

  if (error) throw new Error(`Unable to create event: ${error.message}`);
  await upsertPrimaryTicket(String(data.id), input);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/events');
  redirect(`/admin/events/${data.id}`);
}

export async function updateEventAction(formData: FormData) {
  await requireAdmin();
  const input = parseEventForm(formData);
  if (!input.id) throw new Error('Event ID is required');

  const organizerId = input.organizer_id;
  if (!organizerId) throw new Error('Organizer ID is required');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('events')
    .update(eventPayload(input, organizerId))
    .eq('id', input.id);

  if (error) throw new Error(`Unable to update event: ${error.message}`);
  await upsertPrimaryTicket(input.id, input);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${input.id}`);
}

export async function setEventStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid event ID');
  if (!['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'].includes(status)) throw new Error('Invalid event status');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('events').update({ status }).eq('id', id);
  if (error) throw new Error(`Unable to update event status: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${id}`);
}
