import { demoCommunities, demoStories } from '@/data/demo/catalog';
import { createDemoContentRepository, createPublicContentService, createSupabaseContentRepository } from '@/lib/ngahiji-content';
import { isDemoMode } from '@/lib/catalog-runtime';

type RuntimeEnv = Record<string, string | undefined>;

export function getPublicContentService(env: RuntimeEnv = process.env) {
  if (isDemoMode(env)) {
    return createPublicContentService(createDemoContentRepository(demoStories, demoCommunities));
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error('Production content requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Demo fallback is disabled.');
  }

  return createPublicContentService(createSupabaseContentRepository({ url, publishableKey }));
}
