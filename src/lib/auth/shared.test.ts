import { describe, expect, it } from 'vitest';
import { getRoleRedirect, isAdminRole, normalizeIndonesianPhone, resolvePostLoginTarget } from './shared';

describe('resolvePostLoginTarget', () => {
  it('keeps a safe internal next param for admins and members alike', () => {
    expect(resolvePostLoginTarget('/checkout/abc', true)).toBe('/checkout/abc');
    expect(resolvePostLoginTarget('/checkout/abc', false)).toBe('/checkout/abc');
  });

  it('sends admins to /admin when no explicit next is given', () => {
    expect(resolvePostLoginTarget(null, true)).toBe('/admin');
    expect(resolvePostLoginTarget('/', true)).toBe('/admin');
    expect(resolvePostLoginTarget('', true)).toBe('/admin');
  });

  it('sends everyone else to /member when no explicit next is given', () => {
    expect(resolvePostLoginTarget(null, false)).toBe('/member');
    expect(resolvePostLoginTarget('/', false)).toBe('/member');
    expect(resolvePostLoginTarget(undefined, false)).toBe('/member');
  });

  it('rejects external and protocol-relative next values', () => {
    expect(resolvePostLoginTarget('https://evil.example', true)).toBe('/admin');
    expect(resolvePostLoginTarget('//evil.example', false)).toBe('/member');
    expect(resolvePostLoginTarget('javascript:alert(1)', false)).toBe('/member');
  });
});

describe('isAdminRole', () => {
  it('recognizes all organizer roles accepted by requireAdmin', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR', 'CHECKIN_OPERATOR', 'SPONSOR_MANAGER', 'ORGANIZER']) {
      expect(isAdminRole(role)).toBe(true);
    }
  });

  it('rejects non-admin roles', () => {
    expect(isAdminRole('MEMBER')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe('getRoleRedirect', () => {
  it('still routes profile roles as before', () => {
    expect(getRoleRedirect('ADMIN')).toBe('/admin');
    expect(getRoleRedirect('ORGANIZER')).toBe('/organizer');
    expect(getRoleRedirect('MEMBER')).toBe('/');
    expect(getRoleRedirect(null)).toBe('/');
  });
});

describe('normalizeIndonesianPhone', () => {
  it('normalizes common formats', () => {
    expect(normalizeIndonesianPhone('08123456789')).toBe('+628123456789');
    expect(normalizeIndonesianPhone('+628123456789')).toBe('+628123456789');
  });

  it('rejects invalid input', () => {
    expect(normalizeIndonesianPhone('123')).toBeNull();
    expect(normalizeIndonesianPhone('')).toBeNull();
  });
});
