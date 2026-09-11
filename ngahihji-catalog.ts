// Phase 1 catalog boundary. No UI changes and no payment/auth simulation.
// Not compiled or integration-tested in this session.
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
}
export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  currency: 'IDR';
  price_idr: number;
  quota: number; // Capacity only. Never display this as remaining stock.
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
function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}
function parseEvent(value: unknown): EventRecord {
  const r = record(value);
  if (r.status !== 'PUBLISHED') throw new Error('Public catalog returned unpublished event');
  const start = text(r.starts_at), end = text(r.ends_at);
  if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end))) throw new Error('Invalid event dates');
  return {id:text(r.id), organizer_id:text(r.organizer_id), slug:text(r.slug),
    title:text(r.title), description:text(r.description), status:'PUBLISHED',
    starts_at:start, ends_at:end, timezone:text(r.timezone), city:text(r.city),
    venue:nullableText(r.venue), hero_storage_path:nullableText(r.hero_storage_path)};
}
function parseTicket(value: unknown): TicketType {
  const r = record(value);
  if (r.currency !== 'IDR' || typeof r.price_idr !== 'number' || !Number.isSafeInteger(r.price_idr)
    || r.price_idr < 0 || typeof r.quota !== 'number' || !Number.isSafeInteger(r.quota)
    || r.quota < 0 || typeof r.active !== 'boolean') throw new Error('Invalid ticket type');
  return {id:text(r.id),event_id:text(r.event_id),name:text(r.name),currency:'IDR',
    price_idr:r.price_idr,quota:r.quota,active:r.active};
}
export function createSupabaseCatalog(config: {
  url: string;
  publishableKey: string; // Public anon/publishable key only. NEVER service_role.
}): CatalogRepository {
  const base = new URL(config.url);
  if (base.protocol !== 'https:' || !config.publishableKey.trim()) throw new Error('HTTPS Supabase URL and public key required');
  async function query(table: string, parameters: Record<string,string>): Promise<unknown[]> {
    const url = new URL('/rest/v1/' + table, base);
    url.search = new URLSearchParams(parameters).toString();
    const response = await fetch(url, {
      headers: { apikey:config.publishableKey, Accept:'application/json' },
      cache:'no-store', signal:AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error('Catalog response is not an array');
    return payload;
  }
  const columns = 'id,organizer_id,slug,title,description,status,starts_at,ends_at,timezone,city,venue,hero_storage_path';
  return {
    async getEvents() {
      return (await query('events',{select:columns,status:'eq.PUBLISHED',order:'starts_at.asc',limit:'100'})).map(parseEvent);
    },
    async getEventBySlug(slug) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
      const rows = await query('events',{select:columns,status:'eq.PUBLISHED',slug:'eq.'+slug,limit:'1'});
      return rows.length ? parseEvent(rows[0]) : null;
    },
    async getTicketTypes(eventId) {
      if (!/^[0-9a-f-]{36}$/i.test(eventId)) throw new Error('Invalid event ID');
      return (await query('ticket_types',{select:'id,event_id,name,currency,price_idr,quota,active',event_id:'eq.'+eventId,active:'eq.true',order:'price_idr.asc'})).map(parseTicket);
    }
  };
}
export function createDemoCatalog(events: EventRecord[], tickets: TicketType[]): CatalogRepository {
  // Caller supplies isolated fixtures; nothing is hardcoded in UI or this adapter.
  const snapshot = structuredClone({events,tickets});
  return {
    async getEvents() {return structuredClone(snapshot.events.filter(e=>e.status==='PUBLISHED'));},
    async getEventBySlug(slug) {return structuredClone(snapshot.events.find(e=>e.slug===slug && e.status==='PUBLISHED') ?? null);},
    async getTicketTypes(eventId) {
      const visible = snapshot.events.some(e=>e.id===eventId && e.status==='PUBLISHED');
      return structuredClone(visible ? snapshot.tickets.filter(t=>t.event_id===eventId && t.active) : []);
    }
  };
}
export function createCatalogService(repository: CatalogRepository) {
  return {
    getEvents: () => repository.getEvents(),
    getEventBySlug: (slug: string) => repository.getEventBySlug(slug),
    getTicketTypes: (eventId: string) => repository.getTicketTypes(eventId),
    async getUpcomingEvents(now = new Date()) {
      return (await repository.getEvents()).filter(e=>Date.parse(e.starts_at)>=now.getTime());
    }
  };
}
// Select provider explicitly in the application composition root.
// A production network/configuration error MUST surface as an error, not demo fallback.
// Checkout must re-read prices on the server. Catalog prices are display-only.
