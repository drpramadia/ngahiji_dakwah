import { describe, expect, it } from 'vitest';
import { getIntegrationStatus } from '@/lib/integrations/config';

describe('integration config status', () => {
  it('treats placeholders as unconfigured', () => {
    const rows = getIntegrationStatus({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      MIDTRANS_SERVER_KEY: 'replace-only-in-secure-server-runtime',
      EMAIL_PROVIDER_KEY: 'your-email-key'
    });
    expect(rows.find((row) => row.name === 'NEXT_PUBLIC_SUPABASE_URL')?.status).toBe('configured');
    expect(rows.find((row) => row.name === 'MIDTRANS_SERVER_KEY')?.status).toBe('unconfigured');
    expect(rows.find((row) => row.name === 'EMAIL_PROVIDER_KEY')?.status).toBe('unconfigured');
  });
});
