import { describe, expect, it } from 'vitest';
import { getAssetUrl, resolveMedia } from '@/lib/assets';

describe('asset resolver', () => {
  it('returns external URLs unchanged', () => {
    expect(getAssetUrl({ url: 'https://example.com/image.jpg' })).toBe('https://example.com/image.jpg');
  });

  it('builds public Supabase Storage URLs', () => {
    expect(getAssetUrl({ bucket_id: 'event-assets', storage_path: 'events/hero image.webp' }, 'https://demo.supabase.co')).toBe('https://demo.supabase.co/storage/v1/object/public/event-assets/events/hero%20image.webp');
  });

  it('resolves src and alt text together', () => {
    expect(resolveMedia({ url: '/NGAHIJI_LOGO.png', alt_text: 'Ngahiji' })).toEqual({ src: '/NGAHIJI_LOGO.png', alt: 'Ngahiji' });
  });
});
