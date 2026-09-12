import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.NGAHIJI_TICKET_SECRET || process.env.NEXTAUTH_SECRET || 'ngahiji-dev-ticket-secret-change-in-production';

/**
 * Generate deterministic HMAC-SHA256 for a ticket ID.
 * The QR encodes this so verification does not need to store the raw token.
 *
 * Pure function (no server-only guard) so it can be unit tested. Runtime
 * access from client code is still prevented because SECRET reads process.env,
 * which is a build-time replacement only for NEXT_PUBLIC_* variables.
 */
export function ticketHmac(ticketId: string): string {
  return createHmac('sha256', SECRET).update(ticketId).digest('hex');
}

export function ticketQrPayload(ticketId: string): string {
  return `NGAHIJI:${ticketId}:${ticketHmac(ticketId)}`;
}

export function parseAndVerifyTicketQr(payload: string): string | null {
  const parts = payload.trim().split(':');
  if (parts.length !== 3) return null;
  const [prefix, ticketId, hmac] = parts;
  if (prefix !== 'NGAHIJI') return null;
  if (!/^[0-9a-f-]{36}$/i.test(ticketId)) return null;
  if (!/^[0-9a-f]{64}$/.test(hmac)) return null;
  const expected = ticketHmac(ticketId);
  const a = Buffer.from(hmac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? ticketId : null;
}
