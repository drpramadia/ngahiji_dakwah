import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: vi.fn()
}));

import { expireStaleOrders } from './expire';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

const mockServiceClient = vi.mocked(createSupabaseServiceClient);

type UpdateResult = { data: unknown; error: { message: string } | null };

function makeUpdateChain(result: UpdateResult) {
  const calls: Record<string, unknown[][]> = {};
  const record = (method: string) => (...args: unknown[]) => {
    calls[method] = [...(calls[method] ?? []), args];
    return chain;
  };
  const chain = {
    update: record('update'),
    eq: record('eq'),
    is: record('is'),
    lt: record('lt'),
    in: record('in'),
    select: record('select'),
    then: (onFulfilled: unknown, onRejected: unknown) =>
      Promise.resolve(result).then(onFulfilled as never, onRejected as never)
  };
  return { chain, calls };
}

const HOUR = 3600_000;

describe('expireStaleOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies a 72h grace window for WAITING_VERIFICATION so active verifications survive', async () => {
    const pending = makeUpdateChain({ data: [], error: null });
    const waiting = makeUpdateChain({ data: [], error: null });
    const registrations = makeUpdateChain({ data: null, error: null });

    const orderChainQueue = [pending.chain, waiting.chain];
    mockServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'orders') return orderChainQueue.shift() ?? waiting.chain;
        if (table === 'registrations') return registrations.chain;
        throw new Error(`unexpected table ${table}`);
      })
    } as never);

    const before = Date.now();
    const result = await expireStaleOrders();
    const after = Date.now();

    expect(result).toEqual({ pendingExpired: 0, waitingExpired: 0, errors: [] });

    // PENDING_PAYMENT: only stale orders with no proof uploaded
    expect(pending.calls.update[0][0]).toEqual({ status: 'EXPIRED' });
    expect(pending.calls.eq.flat()).toEqual(['status', 'PENDING_PAYMENT']);
    expect(pending.calls.is.flat()).toEqual(['payment_proof_url', null]);
    const pendingCutoff = pending.calls.lt[0][1] as string;
    expect(Date.parse(pendingCutoff)).toBeGreaterThanOrEqual(before - 24 * HOUR - 1000);
    expect(Date.parse(pendingCutoff)).toBeLessThanOrEqual(after - 24 * HOUR + 1000);

    // WAITING_VERIFICATION: grace window (default 72h) — a proof uploaded
    // minutes ago must never be expired by this job
    expect(waiting.calls.update[0][0]).toEqual({ status: 'EXPIRED' });
    expect(waiting.calls.eq.flat()).toEqual(['status', 'WAITING_VERIFICATION']);
    const waitingCutoff = waiting.calls.lt[0][1] as string;
    expect(Date.parse(waitingCutoff)).toBeLessThanOrEqual(after - 72 * HOUR + 1000);
    expect(Date.parse(waitingCutoff)).toBeGreaterThan(before - 73 * HOUR);
  });

  it('expires linked registrations alongside stale orders', async () => {
    const pending = makeUpdateChain({ data: [{ id: 'o1', registration_id: 'r1' }], error: null });
    const waiting = makeUpdateChain({ data: [{ id: 'o2', registration_id: 'r2' }], error: null });
    const registrations = makeUpdateChain({ data: null, error: null });

    const orderChainQueue = [pending.chain, waiting.chain];
    mockServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'orders') return orderChainQueue.shift() ?? waiting.chain;
        if (table === 'registrations') return registrations.chain;
        throw new Error(`unexpected table ${table}`);
      })
    } as never);

    const result = await expireStaleOrders();

    expect(result.pendingExpired).toBe(1);
    expect(result.waitingExpired).toBe(1);
    expect(registrations.calls.update[0][0]).toEqual({ status: 'EXPIRED' });
    expect(registrations.calls.in.flat()).toEqual(['id', ['r1', 'r2']]);
    expect(result.errors).toEqual([]);
  });

  it('collects errors instead of throwing when a query fails', async () => {
    const pending = makeUpdateChain({ data: null, error: { message: 'db down' } });
    const waiting = makeUpdateChain({ data: [], error: null });

    const orderChainQueue = [pending.chain, waiting.chain];
    mockServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'orders') return orderChainQueue.shift() ?? waiting.chain;
        if (table === 'registrations') return makeUpdateChain({ data: null, error: null }).chain;
        throw new Error(`unexpected table ${table}`);
      })
    } as never);

    const result = await expireStaleOrders();

    expect(result.errors).toEqual(['pending expire: db down']);
    expect(result.pendingExpired).toBe(0);
  });

  it('honors custom grace windows', async () => {
    const pending = makeUpdateChain({ data: [], error: null });
    const waiting = makeUpdateChain({ data: [], error: null });

    const orderChainQueue = [pending.chain, waiting.chain];
    mockServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'orders') return orderChainQueue.shift() ?? waiting.chain;
        if (table === 'registrations') return makeUpdateChain({ data: null, error: null }).chain;
        throw new Error(`unexpected table ${table}`);
      })
    } as never);

    const before = Date.now();
    await expireStaleOrders({ pendingHours: 1, waitingHours: 2 });

    const pendingCutoff = Date.parse(pending.calls.lt[0][1] as string);
    const waitingCutoff = Date.parse(waiting.calls.lt[0][1] as string);
    expect(pendingCutoff).toBeLessThanOrEqual(before - 1 * HOUR + 1000);
    expect(waitingCutoff).toBeLessThanOrEqual(before - 2 * HOUR + 1000);
  });
});
