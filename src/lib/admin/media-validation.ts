import type { MediaKind } from '@/lib/ngahiji-content';

export type MediaFormInput = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  format: MediaKind;
  excerpt: string;
  body: string;
  image_url: string;
  reading_time: string;
  published_at: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seo_title: string | null;
  seo_description: string | null;
};

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const formats = new Set(['ARTICLE', 'VIDEO', 'PODCAST', 'SHORT_STORY']);
const statuses = new Set(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

function requiredText(value: FormDataEntryValue | null, field: string, max = 220) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${field} wajib diisi`);
  if (text.length > max) throw new Error(`${field} terlalu panjang`);
  return text;
}

function optionalText(value: FormDataEntryValue | null, max = 220) {
  const text = String(value ?? '').trim();
  if (text.length > max) throw new Error('Field terlalu panjang');
  return text || null;
}

function dateTime(value: FormDataEntryValue | null, field: string) {
  const text = requiredText(value, field, 80);
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) throw new Error(`${field} tidak valid`);
  return date.toISOString();
}

export function parseMediaForm(formData: FormData): MediaFormInput {
  const slug = requiredText(formData.get('slug'), 'Slug', 180);
  if (!slugPattern.test(slug)) throw new Error('Slug hanya boleh huruf kecil, angka, dan tanda hubung');

  const format = requiredText(formData.get('format'), 'Format', 40) as MediaKind;
  if (!formats.has(format)) throw new Error('Format media tidak valid');

  const status = requiredText(formData.get('status'), 'Status', 40) as MediaFormInput['status'];
  if (!statuses.has(status)) throw new Error('Status media tidak valid');

  return {
    id: optionalText(formData.get('id'), 80) ?? undefined,
    slug,
    title: requiredText(formData.get('title'), 'Title', 220),
    category: requiredText(formData.get('category'), 'Category', 80),
    format,
    excerpt: requiredText(formData.get('excerpt'), 'Excerpt', 500),
    body: String(formData.get('body') ?? '').trim(),
    image_url: requiredText(formData.get('image_url'), 'Image URL', 600),
    reading_time: requiredText(formData.get('reading_time'), 'Reading time', 80),
    published_at: dateTime(formData.get('published_at'), 'Publish date'),
    status,
    seo_title: optionalText(formData.get('seo_title'), 220),
    seo_description: optionalText(formData.get('seo_description'), 320)
  };
}
