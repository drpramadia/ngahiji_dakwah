export function getAppBaseUrl(origin?: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (origin) return origin.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export function getAuthRedirectUrl(nextPath: string, origin?: string) {
  const baseUrl = getAppBaseUrl(origin);
  const url = new URL('/auth/callback', baseUrl);
  url.searchParams.set('next', nextPath);
  return url.toString();
}
