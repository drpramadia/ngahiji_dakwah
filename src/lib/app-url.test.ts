import { describe, expect, it, vi } from 'vitest';
import { getAppBaseUrl, getAuthRedirectUrl } from '@/lib/app-url';

describe('app URL helpers', () => {
  it('uses NEXT_PUBLIC_APP_URL when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ngahiji-dakwah.vercel.app/');
    expect(getAppBaseUrl('http://localhost:3000')).toBe('https://ngahiji-dakwah.vercel.app');
    expect(getAuthRedirectUrl('/profile', 'http://localhost:3000')).toBe('https://ngahiji-dakwah.vercel.app/auth/callback?next=%2Fprofile');
    vi.unstubAllEnvs();
  });

  it('falls back to current origin when app URL is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    expect(getAuthRedirectUrl('/profile', 'http://localhost:3000')).toBe('http://localhost:3000/auth/callback?next=%2Fprofile');
    vi.unstubAllEnvs();
  });
});
