import { describe, expect, it } from 'vitest';
import { getCatalogService, isDemoMode } from '@/lib/catalog-runtime';

describe('catalog runtime mode selection', () => {
  it('requires explicit demo mode', () => {
    expect(isDemoMode({ NEXT_PUBLIC_DEMO_MODE: 'true' })).toBe(true);
    expect(isDemoMode({ NEXT_PUBLIC_DEMO_MODE: 'false' })).toBe(false);
    expect(isDemoMode({})).toBe(false);
  });

  it('does not silently fallback to demo when production config is missing', () => {
    expect(() => getCatalogService({ NEXT_PUBLIC_DEMO_MODE: 'false' })).toThrow('Demo fallback is disabled');
  });

  it('creates a demo-backed service only when demo mode is explicit', async () => {
    const catalog = getCatalogService({ NEXT_PUBLIC_DEMO_MODE: 'true' });
    await expect(catalog.getEvents()).resolves.toHaveLength(3);
  });
});
