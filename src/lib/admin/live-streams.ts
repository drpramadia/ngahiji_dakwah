import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CmsLiveStreamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CmsLiveStream = {
  id: string;
  title: string;
  description: string;
  youtube_video_id: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  status: CmsLiveStreamStatus;
  is_live: boolean;
  scheduled_at: string | null;
  duration_label: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS = 'id,title,description,youtube_video_id,youtube_url,thumbnail_url,category,status,is_live,scheduled_at,duration_label,created_at,updated_at';

export async function getCmsLiveStreams() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('live_streams')
    .select(COLUMNS)
    .order('is_live', { ascending: false })
    .order('scheduled_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Unable to load live streams: ${error.message}`);
  return (data ?? []) as CmsLiveStream[];
}

export async function getCmsLiveStreamById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('live_streams')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load live stream: ${error.message}`);
  return (data ?? null) as CmsLiveStream | null;
}
