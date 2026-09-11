/**
 * YouTube Data API v3 client (server-side only).
 * Key MUST be provided via YOUTUBE_API_KEY env (never NEXT_PUBLIC_).
 */

export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  isLive: boolean;
  isUpcoming: boolean;
};

type SearchItem = {
  id?: { kind?: string; videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    liveBroadcastContent?: 'live' | 'upcoming' | 'none';
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
  };
};

const API_BASE = 'https://www.googleapis.com/youtube/v3';

function requireApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || key.trim() === '' || key.includes('your-')) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }
  return key.trim();
}

function normalize(item: SearchItem): YouTubeVideo | null {
  const videoId = item.id?.videoId;
  if (!videoId) return null;
  const snip = item.snippet ?? {};
  const thumb =
    snip.thumbnails?.high?.url ||
    snip.thumbnails?.medium?.url ||
    snip.thumbnails?.default?.url ||
    '';
  return {
    videoId,
    title: snip.title ?? '',
    description: snip.description ?? '',
    channelTitle: snip.channelTitle ?? '',
    publishedAt: snip.publishedAt ?? '',
    thumbnail: thumb,
    isLive: snip.liveBroadcastContent === 'live',
    isUpcoming: snip.liveBroadcastContent === 'upcoming'
  };
}

async function searchVideos(params: Record<string, string>): Promise<YouTubeVideo[]> {
  const key = requireApiKey();
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set('key', key);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('safeSearch', 'strict');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YouTube search failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { items?: SearchItem[] };
  return (data.items ?? []).map(normalize).filter((v): v is YouTubeVideo => v !== null);
}

export type LiveFeed = {
  featured: YouTubeVideo | null;
  sidebar: YouTubeVideo[];
  source: 'live' | 'upcoming' | 'recent';
  query: string;
};

/**
 * Interleave arrays round-robin so each query gets fair representation.
 */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) if (list[i] !== undefined) out.push(list[i]);
  }
  return out;
}

/**
 * Get combined feed. Prioritizes recent uploads (existing videos).
 * Live streams are added as bonus if any are active.
 * Supports multiple queries via YOUTUBE_SEARCH_QUERIES (comma-separated) or falls back to YOUTUBE_SEARCH_QUERY.
 */
export async function getLiveFeed(query?: string): Promise<LiveFeed> {
  const queries = query
    ? [query]
    : (process.env.YOUTUBE_SEARCH_QUERIES?.split(',').map((s) => s.trim()).filter(Boolean)
        ?? [process.env.YOUTUBE_SEARCH_QUERY || 'ust hanan attaki dakwah']);

  const recentPerQuery = await Promise.all(
    queries.map((q) => searchVideos({ q, order: 'date', maxResults: '4' }).catch(() => []))
  );
  const livePerQuery = await Promise.all(
    queries.map((q) => searchVideos({ q, eventType: 'live', maxResults: '2' }).catch(() => []))
  );

  const recent = interleave(recentPerQuery);
  const live = interleave(livePerQuery);

  let featured: YouTubeVideo | null = null;
  let source: LiveFeed['source'] = 'recent';

  if (recent.length > 0) {
    featured = recent[0];
    source = 'recent';
  } else if (live.length > 0) {
    featured = live[0];
    source = 'live';
  }

  const seen = new Set<string>();
  if (featured) seen.add(featured.videoId);
  const pool = [...recent, ...live];
  const sidebar: YouTubeVideo[] = [];
  for (const v of pool) {
    if (seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    sidebar.push(v);
    if (sidebar.length >= 3) break;
  }

  return { featured, sidebar, source, query: queries.join(' | ') };
}