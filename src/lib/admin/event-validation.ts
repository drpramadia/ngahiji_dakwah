export type EventFormInput = {
  id?: string;
  organizer_id?: string;
  title: string;
  slug: string;
  description: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  starts_at: string;
  ends_at: string;
  timezone: string;
  city: string;
  venue: string | null;
  category: string;
  format: string;
  image_url: string;
  ticket_name: string;
  ticket_price_idr: number;
  ticket_quota: number;
  ticket_active: boolean;
};

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const statuses = new Set(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']);

function requiredText(value: FormDataEntryValue | null, field: string, max = 220) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${field} wajib diisi`);
  if (text.length > max) throw new Error(`${field} terlalu panjang`);
  return text;
}

function optionalText(value: FormDataEntryValue | null, max = 500) {
  const text = String(value ?? '').trim();
  if (text.length > max) throw new Error('Field terlalu panjang');
  return text || null;
}

function numberField(value: FormDataEntryValue | null, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${field} tidak valid`);
  return number;
}

function isoDateTime(value: FormDataEntryValue | null, field: string) {
  const text = requiredText(value, field, 80);
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) throw new Error(`${field} tidak valid`);
  return date.toISOString();
}

export function parseEventForm(formData: FormData): EventFormInput {
  const slug = requiredText(formData.get('slug'), 'Slug', 180);
  if (!slugPattern.test(slug)) throw new Error('Slug hanya boleh huruf kecil, angka, dan tanda hubung');

  const status = requiredText(formData.get('status'), 'Status', 40) as EventFormInput['status'];
  if (!statuses.has(status)) throw new Error('Status event tidak valid');

  const startsAt = isoDateTime(formData.get('starts_at'), 'Tanggal mulai');
  const endsAt = isoDateTime(formData.get('ends_at'), 'Tanggal selesai');
  if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('Tanggal selesai harus setelah tanggal mulai');

  return {
    id: optionalText(formData.get('id'), 80) ?? undefined,
    organizer_id: optionalText(formData.get('organizer_id'), 80) ?? undefined,
    title: requiredText(formData.get('title'), 'Title', 200),
    slug,
    description: String(formData.get('description') ?? '').trim(),
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: requiredText(formData.get('timezone'), 'Timezone', 80),
    city: requiredText(formData.get('city'), 'City', 120),
    venue: optionalText(formData.get('venue'), 200),
    category: requiredText(formData.get('category'), 'Category', 100),
    format: requiredText(formData.get('format'), 'Format', 140),
    image_url: requiredText(formData.get('image_url'), 'Hero image URL', 600),
    ticket_name: requiredText(formData.get('ticket_name'), 'Ticket name', 100),
    ticket_price_idr: numberField(formData.get('ticket_price_idr'), 'Ticket price'),
    ticket_quota: numberField(formData.get('ticket_quota'), 'Ticket quota'),
    ticket_active: formData.get('ticket_active') === 'on'
  };
}
