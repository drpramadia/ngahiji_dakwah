import { describe, it, expect } from 'vitest';
import { ticketHmac, ticketQrPayload, parseAndVerifyTicketQr } from './qr-core';

const id = 'a3cde5ac-2547-489f-ae26-0044fadd3276';

describe('ticket qr', () => {
  it('generates deterministic hmac', () => {
    expect(ticketHmac(id)).toBe(ticketHmac(id));
    expect(ticketHmac(id)).toHaveLength(64);
  });

  it('payload roundtrips through parse+verify', () => {
    const payload = ticketQrPayload(id);
    expect(parseAndVerifyTicketQr(payload)).toBe(id);
  });

  it('rejects tampered payload', () => {
    const payload = ticketQrPayload(id);
    const tampered = payload.slice(0, -1) + (payload.endsWith('a') ? 'b' : 'a');
    expect(parseAndVerifyTicketQr(tampered)).toBeNull();
  });

  it('rejects invalid format', () => {
    expect(parseAndVerifyTicketQr('not a payload')).toBeNull();
    expect(parseAndVerifyTicketQr('NGAHIJI:bad-id:0000')).toBeNull();
    expect(parseAndVerifyTicketQr('')).toBeNull();
  });
});
