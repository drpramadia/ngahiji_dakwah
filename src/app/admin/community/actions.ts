'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { parseCommunityForm, type CommunityFormInput } from '@/lib/admin/community-validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function communityPayload(input: CommunityFormInput) {
  return {
    slug: input.slug,
    name: input.name,
    mark: input.mark,
    color: input.color,
    description: input.description,
    status: input.status,
    sort_order: input.sort_order
  };
}

export async function createCommunityAction(formData: FormData) {
  await requireAdmin();
  const input = parseCommunityForm(formData);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('communities')
    .insert(communityPayload(input))
    .select('id')
    .single();

  if (error) throw new Error(`Unable to create community: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/community');
  redirect(`/admin/community/${data.id}`);
}

export async function updateCommunityAction(formData: FormData) {
  await requireAdmin();
  const input = parseCommunityForm(formData);
  if (!input.id) throw new Error('Community ID is required');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('communities')
    .update(communityPayload(input))
    .eq('id', input.id);

  if (error) throw new Error(`Unable to update community: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/community');
  revalidatePath(`/admin/community/${input.id}`);
}

export async function setCommunityStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid community ID');
  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) throw new Error('Invalid community status');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('communities').update({ status }).eq('id', id);
  if (error) throw new Error(`Unable to update community status: ${error.message}`);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/community');
  revalidatePath(`/admin/community/${id}`);
}
