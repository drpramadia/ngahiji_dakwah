import { getCatalogService } from '@/lib/catalog-runtime';
import { getPublicContentService } from '@/lib/content-runtime';
import NgahijiApp, { type CatalogEvent } from '@/components/NgahijiApp';
import type { CommunityRecord, StoryRecord } from '@/lib/ngahiji-content';
import { getLiveStreamFeed } from '@/lib/live-streams/service';
import type { LiveStreamFeed } from '@/lib/live-streams/types';
import { getViewerContext } from '@/lib/auth/server';

export const revalidate = 300;

async function loadCatalog(): Promise<{ events: CatalogEvent[]; error: string | null }> {
  try {
    const catalog = getCatalogService();
    const records = await catalog.getFeaturedEvents();
    const events = await Promise.all(records.map(async (event) => ({
      ...event,
      tickets: await catalog.getTicketTypes(event.id)
    })));
    return { events, error: null };
  } catch {
    return { events: [], error: 'Event sedang diperbarui. Silakan kembali beberapa saat lagi.' };
  }
}

async function loadContent(): Promise<{ stories: StoryRecord[]; communities: CommunityRecord[]; error: string | null }> {
  try {
    const content = getPublicContentService();
    const [stories, communities] = await Promise.all([content.getStories(), content.getCommunities()]);
    return { stories, communities, error: null };
  } catch {
    return { stories: [], communities: [], error: 'Stories sedang diperbarui. Silakan kembali beberapa saat lagi.' };
  }
}

async function loadLive(): Promise<LiveStreamFeed | null> {
  try {
    return await getLiveStreamFeed();
  } catch {
    return null;
  }
}

export default async function Home() {
  // Parallel fetch to prevent 10s function timeout on cold starts.
  const [catalog, content, liveFeed, viewerCtx] = await Promise.all([
    loadCatalog(),
    loadContent(),
    loadLive(),
    getViewerContext()
  ]);

  const { events, error: catalogError } = catalog;
  const { stories, communities, error: contentError } = content;
  const { profile, isAdmin } = viewerCtx;
    const viewer = profile
      ? {
          name: profile.full_name || profile.email || 'Member',
          role: profile.role,
          isAdmin,
          homeHref: isAdmin ? '/admin' : '/member'
        }
      : null;

    return (
      <NgahijiApp
        communities={communities}
        events={events}
        stories={stories}
        catalogError={catalogError}
        contentError={contentError}
        liveFeed={liveFeed}
        viewer={viewer}
      />
    );
}
