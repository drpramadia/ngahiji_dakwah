import { describe, expect, it } from 'vitest';
import { demoEvents, demoTicketTypes } from '@/data/demo/catalog';
import { createCatalogService, createDemoCatalog, parseEvent } from '@/lib/ngahiji-catalog';

const service = createCatalogService(createDemoCatalog(demoEvents, demoTicketTypes));

describe('catalog service', () => {
  it('returns published demo events through the repository boundary', async () => {
    const events = await service.getEvents();
    expect(events).toHaveLength(3);
    expect(events.every((event) => event.status === 'PUBLISHED')).toBe(true);
  });

  it('does not expose ticket types for hidden events', async () => {
    const tickets = await service.getTicketTypes('00000000-0000-4000-8000-000000000000');
    expect(tickets).toEqual([]);
  });

  it('rejects unpublished records from public catalog parsing', () => {
    expect(() => parseEvent({ ...demoEvents[0], status: 'DRAFT' })).toThrow('unpublished');
  });
});
