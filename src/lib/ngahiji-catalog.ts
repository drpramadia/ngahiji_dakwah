export type EventStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface EventRecord {
  id: string;
  organizer_id: string;
  slug: string;
  title: string;
  description: string;
  status: EventStatus;
  starts_at: string;
  ends_at: string;
  timezone: string;
  city: string;
  venue: string | null;
  hero_storage_path: string | null;
  category: string;
  format: string;
  image_url: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  currency: 'IDR';
  price_idr: number;
  quota: number;
  active: boolean;
}

export interface CatalogRepository {
  getEvents(): Promise<EventRecord[]>;
  getEventBySlug(slug: string): Promise<EventRecord | null>;
  getTicketTypes(eventId: string): Promise<TicketType[]>;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid catalog record');
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Expected catalog string');
  return value;
}

function optionalText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}

export function parseEvent(value: unknown): EventRecord {
  const row = record(value);
  if (row.status !== 'PUBLISHED') throw new Error('Public catalog returned unpublished event');
  const startsAt = text(row.starts_at);
  const endsAt = text(row.ends_at);
  if (!Number.isFinite(Date.parse(startsAt)) || !Number.isFinite(Date.parse(endsAt))) throw new Error('Invalid event dates');
  return {
    id: text(row.id),
    organizer_id: text(row.organizer_id),
    slug: text(row.slug),
    title: text(row.title),
    description: text(row.description),
    status: 'PUBLISHED',
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: text(row.timezone),
    city: text(row.city),
    venue: nullableText(row.venue),
    hero_storage_path: nullableText(row.hero_storage_path),
    category: optionalText(row.category, 'Event'),
    format: optionalText(row.format, 'Community'),
    image_url: optionalText(row.image_url, '')
  };
}

export function parseTicket(value: unknown): TicketType {
  const row = record(value);
  if (row.currency !== 'IDR' || typeof row.price_idr !== 'number' || !Number.isSafeInteger(row.price_idr)
    || row.price_idr < 0 || typeof row.quota !== 'number' || !Number.isSafeInteger(row.quota)
    || row.quota < 0 || typeof row.active !== 'boolean') throw new Error('Invalid ticket type');
  return {
    id: text(row.id),
    event_id: text(row.event_id),
    name: text(row.name),
    currency: 'IDR',
    price_idr: row.price_idr,
    quota: row.quota,
    active: row.active
  };
}

export function createSupabaseCatalog(config: {
  url: string;
  publishableKey: string;
  fetcher?: typeof fetch;
}): CatalogRepository {
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
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error('Catalog response is not an array');
    return payload;
  }

  const eventColumns = 'id,organizer_id,slug,title,description,status,starts_at,ends_at,timezone,city,venue,hero_storage_path,category,format,image_url';

  return {
    async getEvents() {
      return (await query('events', { select: eventColumns, status: 'eq.PUBLISHED', order: 'starts_at.asc', limit: '100' })).map(parseEvent);
    },
    async getEventBySlug(slug) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
      const rows = await query('events', { select: eventColumns, status: 'eq.PUBLISHED', slug: 'eq.' + slug, limit: '1' });
      return rows.length ? parseEvent(rows[0]) : null;
    },
    async getTicketTypes(eventId) {
      if (!/^[0-9a-f-]{36}$/i.test(eventId)) throw new Error('Invalid event ID');
      return (await query('ticket_types', { select: 'id,event_id,name,currency,price_idr,quota,active', event_id: 'eq.' + eventId, active: 'eq.true', order: 'price_idr.asc' })).map(parseTicket);
    }
  };
}

export function createDemoCatalog(events: EventRecord[], tickets: TicketType[]): CatalogRepository {
  const snapshot = structuredClone({ events, tickets });
  return {
    async getEvents() {
      return structuredClone(snapshot.events.filter((event) => event.status === 'PUBLISHED'));
    },
    async getEventBySlug(slug) {
      return structuredClone(snapshot.events.find((event) => event.slug === slug && event.status === 'PUBLISHED') ?? null);
    },
    async getTicketTypes(eventId) {
      const visible = snapshot.events.some((event) => event.id === eventId && event.status === 'PUBLISHED');
      return structuredClone(visible ? snapshot.tickets.filter((ticket) => ticket.event_id === eventId && ticket.active) : []);
    }
  };
}

export function createCatalogService(repository: CatalogRepository) {
  return {
    getEvents: () => repository.getEvents(),
    getEventBySlug: (slug: string) => repository.getEventBySlug(slug),
    getTicketTypes: (eventId: string) => repository.getTicketTypes(eventId),
    async getFeaturedEvents() {
      return (await repository.getEvents()).slice(0, 3);
    },
    async getUpcomingEvents(now = new Date()) {
      return (await repository.getEvents()).filter((event) => Date.parse(event.starts_at) >= now.getTime());
    }
  };
}
