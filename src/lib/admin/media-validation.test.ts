import { describe, expect, it } from 'vitest';
import { parseMediaForm } from '@/lib/admin/media-validation';

function validForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  Object.entries({
    title: 'Story Test',
    slug: 'story-test',
    status: 'PUBLISHED',
    format: 'ARTICLE',
    category: 'Kajian',
    excerpt: 'Short public excerpt.',
    body: 'Longer content body.',
    image_url: '/assets/ngahiji/media/story-quran-study.svg',
    reading_time: '5 menit baca',
    published_at: '2026-09-11T10:00',
    ...overrides
  }).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe('parseMediaForm', () => {
  it('parses valid CMS media input', () => {
    const input = parseMediaForm(validForm());
    expect(input.slug).toBe('story-test');
    expect(input.status).toBe('PUBLISHED');
    expect(input.format).toBe('ARTICLE');
  });

  it('rejects invalid slug, status, and format', () => {
    expect(() => parseMediaForm(validForm({ slug: 'Story Test' }))).toThrow('Slug');
    expect(() => parseMediaForm(validForm({ status: 'LIVE' }))).toThrow('Status');
    expect(() => parseMediaForm(validForm({ format: 'THREAD' }))).toThrow('Format');
  });
});
