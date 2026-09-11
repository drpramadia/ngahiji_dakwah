import { describe, expect, it } from 'vitest';
import { demoCommunities, demoStories } from '@/data/demo/catalog';
import { createDemoContentRepository, createPublicContentService, parseStory } from '@/lib/ngahiji-content';
import { getPublicContentService } from '@/lib/content-runtime';

const service = createPublicContentService(createDemoContentRepository(demoStories, demoCommunities));

describe('public content service', () => {
  it('returns published stories and communities through the repository boundary', async () => {
    await expect(service.getStories()).resolves.toHaveLength(4);
    await expect(service.getCommunities()).resolves.toHaveLength(6);
  });

  it('finds a published story by slug', async () => {
    await expect(service.getStoryBySlug('ngahiji-gerakan-bersama')).resolves.toMatchObject({
      title: 'Ngahiji: Lebih dari Sekadar Event, Tapi Gerakan Bersama'
    });
  });

  it('rejects unpublished stories from public parsing', () => {
    expect(() => parseStory({ ...demoStories[0], status: 'DRAFT' })).toThrow('unpublished');
  });

  it('does not silently fallback to demo content when production config is missing', () => {
    expect(() => getPublicContentService({ NEXT_PUBLIC_DEMO_MODE: 'false' })).toThrow('Demo fallback is disabled');
  });
});
