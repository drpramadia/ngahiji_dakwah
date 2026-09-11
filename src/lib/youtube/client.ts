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
 * Get combined live + recent feed for a search query.
 * Priority: currently live > upcoming > most recent uploads.
 */
export async function getLiveFeed(query?: string): Promise<LiveFeed> {
  const q = (query || process.env.YOUTUBE_SEARCH_QUERY || 'ust hanan attaki dakwah').trim();

  const [live, upcoming, recent] = await Promise.all([
    searchVideos({ q, eventType: 'live', maxResults: '4' }).catch(() => []),
    searchVideos({ q, eventType: 'upcoming', maxResults: '4' }).catch(() => []),
    searchVideos({ q, order: 'date', maxResults: '8' }).catch(() => [])
  ]);

  let featured: YouTubeVideo | null = null;
  let source: LiveFeed['source'] = 'recent';

  if (live.length > 0) {
    featured = live[0];
    source = 'live';
  } else if (upcoming.length > 0) {
    featured = upcoming[0];
    source = 'upcoming';
  } else if (recent.length > 0) {
    featured = recent[0];
    source = 'recent';
  }

  const seen = new Set<string>();
  if (featured) seen.add(featured.videoId);
  const pool = [...live, ...upcoming, ...recent];
  const sidebar: YouTubeVideo[] = [];
  for (const v of pool) {
    if (seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    sidebar.push(v);
    if (sidebar.length >= 3) break;
  }

  return { featured, sidebar, source, query: q };
}