import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { LiveStream, LiveStreamFeed } from '@/lib/live-streams/types';

const COLUMNS = 'id, title, description, youtube_video_id, youtube_url, thumbnail_url, category, status, is_live, scheduled_at, duration_label';

/**
 * Get the currently active live stream (single featured video).
 * Priority: is_live true first, then most recent by scheduled_at/created_at.
 */
export async function getActiveLiveStream(): Promise<LiveStream | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('live_streams')
      .select(COLUMNS)
      .eq('status', 'PUBLISHED')
      .eq('category', 'KAJIAN')
      .order('is_live', { ascending: false })
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as LiveStream | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Get combined feed for the Ngahiji Live section:
 * - featured: active live stream (or latest published KAJIAN)
 * - sidebar: 3 latest published KAJIAN videos (excluding featured)
 */
export async function getLiveStreamFeed(): Promise<LiveStreamFeed> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('live_streams')
      .select(COLUMNS)
      .eq('status', 'PUBLISHED')
      .eq('category', 'KAJIAN')
      .order('is_live', { ascending: false })
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(4);
    if (error) throw error;
    const rows = (data as LiveStream[] | null) ?? [];
    const featured = rows[0] ?? null;
    const sidebar = rows.slice(1, 4);
    return { featured, sidebar };
  } catch {
    return { featured: null, sidebar: [] };
  }
}