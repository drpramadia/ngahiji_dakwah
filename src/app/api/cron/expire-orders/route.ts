import { NextResponse, type NextRequest } from 'next/server';
import { expireStaleOrders } from '@/lib/orders/expire';

/**
 * Cron endpoint: expire stale pending orders.
 *
 * Auth: Vercel Cron adds header `Authorization: Bearer <CRON_SECRET>` when
 * CRON_SECRET is set as an env var. We also accept a query param for manual
 * admin runs during setup, but only if CRON_SECRET is not configured.
 *
 * Schedule: hourly (see vercel.json).
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';

  if (secret) {
    if (bearer !== secret && querySecret !== secret) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  } else {
    // If no secret is configured, allow only when explicitly enabled via env.
    if (process.env.ALLOW_UNAUTH_CRON !== 'true') {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 401 });
    }
  }

  try {
    const result = await expireStaleOrders();
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
