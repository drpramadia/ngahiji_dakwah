import { getCatalogService, isDemoMode } from '@/lib/catalog-runtime';
import { getPublicContentService } from '@/lib/content-runtime';
import NgahijiApp, { type CatalogEvent } from '@/components/NgahijiApp';
import type { CommunityRecord, StoryRecord } from '@/lib/ngahiji-content';

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

  return (
    <NgahijiApp
      communities={communities}
      demoMode={isDemoMode()}
      events={events}
      stories={stories}
      catalogError={catalogError}
      contentError={contentError}
    />
  );
}
