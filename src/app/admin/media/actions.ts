'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { parseMediaForm, type MediaFormInput } from '@/lib/admin/media-validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function mediaPayload(input: MediaFormInput) {
  return {
    slug: input.slug,
    title: input.title,
    category: input.category,
    format: input.format,
    excerpt: input.excerpt,
    body: input.body,
    image_url: input.image_url,
    reading_time: input.reading_time,
    published_at: input.published_at,
    status: input.status,
    seo_title: input.seo_title,
    seo_description: input.seo_description
  };
}

export async function createMediaAction(formData: FormData) {
  await requireAdmin();
  const input = parseMediaForm(formData);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('media_items')
    .insert(mediaPayload(input))
    .select('id')
    .single();

  if (error) throw new Error(`Unable to create media item: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/media');
  redirect(`/admin/media/${data.id}`);
}

export async function updateMediaAction(formData: FormData) {
  await requireAdmin();
  const input = parseMediaForm(formData);
  if (!input.id) throw new Error('Media item ID is required');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('media_items')
    .update(mediaPayload(input))
    .eq('id', input.id);

  if (error) throw new Error(`Unable to update media item: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/media');
  revalidatePath(`/admin/media/${input.id}`);
}

export async function setMediaStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid media item ID');
  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) throw new Error('Invalid media status');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('media_items').update({ status }).eq('id', id);
  if (error) throw new Error(`Unable to update media status: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/media');
  revalidatePath(`/admin/media/${id}`);
}
