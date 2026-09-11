import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CmsCommunityStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CmsCommunity = {
  id: string;
  slug: string;
  name: string;
  mark: string;
  color: string;
  description: string;
  status: CmsCommunityStatus;
  sort_order: number;
};

export async function getCmsCommunities() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('communities')
    .select('id,slug,name,mark,color,description,status,sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Unable to load communities: ${error.message}`);
  return (data ?? []) as CmsCommunity[];
}

export async function getCmsCommunityById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('communities')
    .select('id,slug,name,mark,color,description,status,sort_order')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load community: ${error.message}`);
  return data as CmsCommunity | null;
}
