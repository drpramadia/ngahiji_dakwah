// Client-safe auth utilities. Must NOT import next/headers or server-only code.

export type ProfileRole = 'GUEST' | 'MEMBER' | 'ORGANIZER' | 'ADMIN';

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  provider: string | null;
  role: ProfileRole;
};

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR', 'CHECKIN_OPERATOR', 'SPONSOR_MANAGER', 'ORGANIZER'] as const;

export function isAdminRole(role: string | null | undefined): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(String(role));
}

/**
 * Post-login landing: a safe internal `next` param wins; otherwise admins go
 * to the CMS and everyone else to the member area.
 */
export function resolvePostLoginTarget(next: string | null | undefined, isAdminMember: boolean): string {
  const sanitized = next && next.startsWith('/') && !next.startsWith('//') && next !== '/' ? next : null;
  if (sanitized) return sanitized;
  return isAdminMember ? '/admin' : '/member';
}

export function getRoleRedirect(role: ProfileRole | null | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/organizer';
    case 'MEMBER':
    default:
      return '/';
  }
}

/**
 * Normalize Indonesian phone numbers to E.164 (+62...).
 * Accepts inputs like: 08123456789, 8123456789, +628123456789, 628123456789.
 */
export function normalizeIndonesianPhone(input: string): string | null {
  const digits = input.replace(/[^0-9+]/g, '');
  if (!digits) return null;
  let n = digits.replace(/^\+/, '');
  if (n.startsWith('62')) {
    // already country-coded
  } else if (n.startsWith('0')) {
    n = '62' + n.slice(1);
  } else if (n.startsWith('8')) {
    n = '62' + n;
  } else {
    return null;
  }
  if (n.length < 10 || n.length > 15) return null;
  return '+' + n;
}