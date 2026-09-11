import { describe, expect, it } from 'vitest';
import { assertTicketActivation, canActivateTicket } from '@/lib/ticketing/state';

describe('ticketing state', () => {
  it('only activates tickets after paid and verified state', () => {
    expect(canActivateTicket('PAID', 'VERIFIED')).toBe(true);
    expect(canActivateTicket('PENDING', 'VERIFIED')).toBe(false);
    expect(canActivateTicket('PAID', 'PENDING')).toBe(false);
  });

  it('rejects active tickets that are not paid and verified', () => {
    expect(() => assertTicketActivation('ACTIVE', 'PENDING', 'VERIFIED')).toThrow('paid and verified');
    expect(() => assertTicketActivation('ACTIVE', 'PAID', 'PENDING')).toThrow('paid and verified');
    expect(() => assertTicketActivation('PENDING_PAYMENT', 'PENDING', 'PENDING')).not.toThrow();
  });
});
