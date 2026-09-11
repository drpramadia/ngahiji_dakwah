export type CommunityFormInput = {
  id?: string;
  slug: string;
  name: string;
  mark: string;
  color: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sort_order: number;
};

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
const statuses = new Set(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

function requiredText(value: FormDataEntryValue | null, field: string, max = 220) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${field} wajib diisi`);
  if (text.length > max) throw new Error(`${field} terlalu panjang`);
  return text;
}

function optionalId(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function integerField(value: FormDataEntryValue | null, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${field} tidak valid`);
  return number;
}

export function parseCommunityForm(formData: FormData): CommunityFormInput {
  const slug = requiredText(formData.get('slug'), 'Slug', 180);
  if (!slugPattern.test(slug)) throw new Error('Slug hanya boleh huruf kecil, angka, dan tanda hubung');

  const color = requiredText(formData.get('color'), 'Color', 20);
  if (!hexColorPattern.test(color)) throw new Error('Color harus hex format seperti #d5fa47');

  const status = requiredText(formData.get('status'), 'Status', 40) as CommunityFormInput['status'];
  if (!statuses.has(status)) throw new Error('Status community tidak valid');

  return {
    id: optionalId(formData.get('id')),
    slug,
    name: requiredText(formData.get('name'), 'Name', 120),
    mark: requiredText(formData.get('mark'), 'Mark', 12),
    color,
    description: requiredText(formData.get('description'), 'Description', 500),
    status,
    sort_order: integerField(formData.get('sort_order'), 'Sort order')
  };
}
