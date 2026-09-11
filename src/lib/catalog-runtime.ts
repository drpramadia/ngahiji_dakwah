import { demoEvents, demoTicketTypes } from '@/data/demo/catalog';
import { createCatalogService, createDemoCatalog, createSupabaseCatalog } from '@/lib/ngahiji-catalog';

type RuntimeEnv = Record<string, string | undefined>;

export function isDemoMode(env: RuntimeEnv = process.env): boolean {
  return env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function getCatalogService(env: RuntimeEnv = process.env) {
  if (isDemoMode(env)) {
    return createCatalogService(createDemoCatalog(demoEvents, demoTicketTypes));
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error('Production catalog requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Demo fallback is disabled.');
  }

  return createCatalogService(createSupabaseCatalog({ url, publishableKey }));
}
