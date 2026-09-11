import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MediaKind } from '@/lib/ngahiji-content';

export type CmsMediaStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CmsMediaItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  format: MediaKind;
  excerpt: string;
  body: string;
  image_url: string;
  reading_time: string;
  published_at: string;
  status: CmsMediaStatus;
  seo_title: string | null;
  seo_description: string | null;
};

export async function getCmsMediaItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('media_items')
    .select('id,slug,title,category,format,excerpt,body,image_url,reading_time,published_at,status,seo_title,seo_description')
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Unable to load media items: ${error.message}`);
  return (data ?? []) as CmsMediaItem[];
}

export async function getCmsMediaItemById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('media_items')
    .select('id,slug,title,category,format,excerpt,body,image_url,reading_time,published_at,status,seo_title,seo_description')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load media item: ${error.message}`);
  return data as CmsMediaItem | null;
}
