import { describe, expect, it } from 'vitest';
import { parseCommunityForm } from '@/lib/admin/community-validation';

function validForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  Object.entries({
    name: 'Youth',
    slug: 'youth',
    status: 'PUBLISHED',
    sort_order: '10',
    mark: '☺',
    color: '#d5fa47',
    description: 'Ruang anak muda untuk belajar.',
    ...overrides
  }).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe('parseCommunityForm', () => {
  it('parses valid CMS community input', () => {
    const input = parseCommunityForm(validForm());
    expect(input.slug).toBe('youth');
    expect(input.status).toBe('PUBLISHED');
    expect(input.sort_order).toBe(10);
  });

  it('rejects invalid slug, color, status, and sort order', () => {
    expect(() => parseCommunityForm(validForm({ slug: 'Youth Space' }))).toThrow('Slug');
    expect(() => parseCommunityForm(validForm({ color: 'lime' }))).toThrow('Color');
    expect(() => parseCommunityForm(validForm({ status: 'LIVE' }))).toThrow('Status');
    expect(() => parseCommunityForm(validForm({ sort_order: '-1' }))).toThrow('Sort order');
  });
});
