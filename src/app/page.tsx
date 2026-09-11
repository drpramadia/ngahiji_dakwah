import { getCatalogService } from '@/lib/catalog-runtime';
import { getPublicContentService } from '@/lib/content-runtime';
import NgahijiApp, { type CatalogEvent } from '@/components/NgahijiApp';
import type { CommunityRecord, StoryRecord } from '@/lib/ngahiji-content';
import { getLiveStreamFeed } from '@/lib/live-streams/service';
import type { LiveStreamFeed } from '@/lib/live-streams/types';
import { getCurrentProfile } from '@/lib/auth/server';
import { getRoleRedirect } from '@/lib/auth/shared';

export const revalidate = 300;

export default async function Home() {
  let events: CatalogEvent[] = [];
  let catalogError: string | null = null;
  let stories: StoryRecord[] = [];
  let communities: CommunityRecord[] = [];
  let contentError: string | null = null;

  try {
    const catalog = getCatalogService();
    const records = await catalog.getFeaturedEvents();
    events = await Promise.all(records.map(async (event) => ({
      ...event,
      tickets: await catalog.getTicketTypes(event.id)
    })));
  } catch (error) {
    catalogError = error instanceof Error ? error.message : 'Catalog service failed';
  }

    try {
    const content = getPublicContentService();
    [stories, communities] = await Promise.all([content.getStories(), content.getCommunities()]);
  } catch (error) {
    contentError = error instanceof Error ? error.message : 'Content service failed';
  }

    let liveFeed: LiveStreamFeed | null = null;
    try {
      liveFeed = await getLiveStreamFeed();
    } catch {
      liveFeed = null;
    }

    const profile = await getCurrentProfile();
    const viewer = profile
      ? {
          name: profile.full_name || profile.email || 'Member',
          role: profile.role,
          homeHref: getRoleRedirect(profile.role)
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
