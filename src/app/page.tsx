import { demoCommunities, demoStories } from '@/data/demo/catalog';
import { getCatalogService, isDemoMode } from '@/lib/catalog-runtime';
import NgahijiApp, { type CatalogEvent } from '@/components/NgahijiApp';

export default async function Home() {
  let events: CatalogEvent[] = [];
  let catalogError: string | null = null;

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

  return (
    <NgahijiApp
      communities={demoCommunities}
      demoMode={isDemoMode()}
      events={events}
      stories={demoStories}
      catalogError={catalogError}
    />
  );
}
