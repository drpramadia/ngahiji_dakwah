'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { parseLiveStreamForm, type LiveStreamFormInput } from '@/lib/admin/live-stream-validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function payload(input: LiveStreamFormInput) {
  return {
    title: input.title,
    description: input.description,
    youtube_video_id: input.youtube_video_id,
    youtube_url: input.youtube_url,
    thumbnail_url: input.thumbnail_url,
    category: input.category,
    status: input.status,
    is_live: input.is_live,
    scheduled_at: input.scheduled_at,
    duration_label: input.duration_label
  };
}

function revalidateAll(id?: string) {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/live');
  if (id) revalidatePath(`/admin/live/${id}`);
}

export async function createLiveStreamAction(formData: FormData) {
  await requireAdmin();
  const input = parseLiveStreamForm(formData);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('live_streams')
    .insert(payload(input))
    .select('id')
    .single();

  if (error) throw new Error(`Unable to create live stream: ${error.message}`);
  revalidateAll();
  redirect(`/admin/live/${data.id}`);
}

export async function updateLiveStreamAction(formData: FormData) {
  await requireAdmin();
  const input = parseLiveStreamForm(formData);
  if (!input.id) throw new Error('Live stream ID is required');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('live_streams')
    .update(payload(input))
    .eq('id', input.id);

  if (error) throw new Error(`Unable to update live stream: ${error.message}`);
  revalidateAll(input.id);
}

export async function setLiveStreamStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid live stream ID');
  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) throw new Error('Invalid status');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('live_streams').update({ status }).eq('id', id);
  if (error) throw new Error(`Unable to update live stream status: ${error.message}`);
  revalidateAll(id);
}

export async function toggleLiveStreamIsLiveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const is_live = String(formData.get('is_live') ?? '') === 'true';
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid live stream ID');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('live_streams').update({ is_live }).eq('id', id);
  if (error) throw new Error(`Unable to toggle live flag: ${error.message}`);
  revalidateAll(id);
}

export async function deleteLiveStreamAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid live stream ID');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('live_streams').delete().eq('id', id);
  if (error) throw new Error(`Unable to delete live stream: ${error.message}`);
  revalidateAll();
  redirect('/admin/live');
}
