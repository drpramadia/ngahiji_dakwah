export type MediaKind = 'ARTICLE' | 'VIDEO' | 'PODCAST' | 'SHORT_STORY';

export interface StoryRecord {
  slug: string;
  title: string;
  category: string;
  format: MediaKind;
  published_at: string;
  reading_time: string;
  image_url: string;
  excerpt: string;
  body: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CommunityRecord {
  slug: string;
  name: string;
  mark: string;
  color: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface PublicContentRepository {
  getStories(): Promise<StoryRecord[]>;
  getStoryBySlug(slug: string): Promise<StoryRecord | null>;
  getCommunities(): Promise<CommunityRecord[]>;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid content record');
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Expected content string');
  return value;
}

function mediaKind(value: unknown): MediaKind {
  if (value === 'ARTICLE' || value === 'VIDEO' || value === 'PODCAST' || value === 'SHORT_STORY') return value;
  throw new Error('Invalid media kind');
}

export function parseStory(value: unknown): StoryRecord {
  const row = record(value);
  if (row.status !== 'PUBLISHED') throw new Error('Public content returned unpublished story');
  const publishedAt = text(row.published_at);
  if (!Number.isFinite(Date.parse(publishedAt))) throw new Error('Invalid story publish date');
  return {
    slug: text(row.slug),
    title: text(row.title),
    category: text(row.category),
    format: mediaKind(row.format),
    published_at: publishedAt,
    reading_time: text(row.reading_time),
    image_url: text(row.image_url),
    excerpt: text(row.excerpt),
    body: text(row.body),
    status: 'PUBLISHED'
  };
}

export function parseCommunity(value: unknown): CommunityRecord {
  const row = record(value);
  if (row.status !== 'PUBLISHED') throw new Error('Public content returned unpublished community');
  return {
    slug: text(row.slug),
    name: text(row.name),
    mark: text(row.mark),
    color: text(row.color),
    description: text(row.description),
    status: 'PUBLISHED'
  };
}

export function createDemoContentRepository(stories: StoryRecord[], communities: CommunityRecord[]): PublicContentRepository {
  const snapshot = structuredClone({ stories, communities });
  return {
    async getStories() {
      return structuredClone(snapshot.stories.filter((story) => story.status === 'PUBLISHED'));
    },
    async getStoryBySlug(slug) {
      return structuredClone(snapshot.stories.find((story) => story.slug === slug && story.status === 'PUBLISHED') ?? null);
    },
    async getCommunities() {
      return structuredClone(snapshot.communities.filter((community) => community.status === 'PUBLISHED'));
    }
  };
}

export function createSupabaseContentRepository(config: {
  url: string;
  publishableKey: string;
  fetcher?: typeof fetch;
}): PublicContentRepository {
  const base = new URL(config.url);
  if (base.protocol !== 'https:' || !config.publishableKey.trim()) throw new Error('HTTPS Supabase URL and public anon key required');
  const fetcher = config.fetcher ?? fetch;

  async function query(table: string, parameters: Record<string, string>): Promise<unknown[]> {
    const url = new URL('/rest/v1/' + table, base);
    url.search = new URLSearchParams(parameters).toString();
    const response = await fetcher(url, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Content request failed (${response.status})`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error('Content response is not an array');
    return payload;
  }

  return {
    async getStories() {
      return (await query('media_items', {
        select: 'slug,title,category,format,published_at,reading_time,image_url,excerpt,body,status',
        status: 'eq.PUBLISHED',
        order: 'published_at.desc',
        limit: '12'
      })).map(parseStory);
    },
    async getStoryBySlug(slug) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
      const rows = await query('media_items', {
        select: 'slug,title,category,format,published_at,reading_time,image_url,excerpt,body,status',
        status: 'eq.PUBLISHED',
        slug: 'eq.' + slug,
        limit: '1'
      });
      return rows.length ? parseStory(rows[0]) : null;
    },
    async getCommunities() {
      return (await query('communities', {
        select: 'slug,name,mark,color,description,status',
        status: 'eq.PUBLISHED',
        order: 'name.asc',
        limit: '24'
      })).map(parseCommunity);
    }
  };
}

export function createPublicContentService(repository: PublicContentRepository) {
  return {
    getStories: () => repository.getStories(),
    getStoryBySlug: (slug: string) => repository.getStoryBySlug(slug),
    getCommunities: () => repository.getCommunities(),
    async getFeaturedStories() {
      return (await repository.getStories()).slice(0, 3);
    }
  };
}
