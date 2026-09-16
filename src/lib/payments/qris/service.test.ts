import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: vi.fn()
}));

import { getPendingPaymentsWithSignedProofs, updateOrderStatus } from './service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

const mockServerClient = vi.mocked(createSupabaseServerClient);
const mockServiceClient = vi.mocked(createSupabaseServiceClient);

function makeUpdateQuery(result: { count: number | null; error: { message: string } | null }) {
  const eq = vi.fn(() => Promise.resolve(result));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { from, update, eq };
}

describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws with the order ID when zero rows are affected (RLS miss)', async () => {
    mockServerClient.mockResolvedValue(makeUpdateQuery({ count: 0, error: null }) as never);

    await expect(updateOrderStatus('order-1', 'WAITING_VERIFICATION')).rejects.toThrow(/order-1/);
  });

  it('resolves when exactly one row is affected', async () => {
    const query = makeUpdateQuery({ count: 1, error: null });
    mockServerClient.mockResolvedValue(query as never);

    await expect(updateOrderStatus('order-2', 'PAID', { paid_at: 'now' })).resolves.toBeUndefined();
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PAID', paid_at: 'now' }),
      { count: 'exact' }
    );
    expect(query.eq).toHaveBeenCalledWith('id', 'order-2');
  });

  it('throws the query error message when the update fails', async () => {
    mockServerClient.mockResolvedValue(makeUpdateQuery({ count: null, error: { message: 'boom' } }) as never);

    await expect(updateOrderStatus('order-3', 'FAILED')).rejects.toThrow('Update order gagal: boom');
  });
});

function makeSelectChain(result: { data: unknown; error: { message: string } | null }) {
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'in', 'order', 'limit']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (onFulfilled: unknown, onRejected: unknown) =>
    Promise.resolve(result).then(onFulfilled as never, onRejected as never);
  return chain;
}

describe('getPendingPaymentsWithSignedProofs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a visible configError instead of an empty table when the service key is missing', async () => {
    mockServiceClient.mockImplementation(() => {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    });

    const result = await getPendingPaymentsWithSignedProofs();

    expect(result.orders).toEqual([]);
    expect(result.configError).toMatch(/Konfigurasi payments admin tidak lengkap/);
    expect(result.configError).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('attaches short-lived signed URLs (private bucket) per proof row', async () => {
    const createSignedUrl = vi.fn(async (path: string, ttl: number) => ({
      data: { signedUrl: `https://signed.example/${path}?ttl=${ttl}` },
      error: null
    }));
    const storageFrom = vi.fn(() => ({ createSignedUrl }));
    const serviceClient = {
      from: vi.fn(() =>
        makeSelectChain({
          data: [
            { id: 'order-a', status: 'WAITING_VERIFICATION', payment_proof_url: 'order-a/proof-1.png' },
            { id: 'order-b', status: 'PENDING_PAYMENT', payment_proof_url: null }
          ],
          error: null
        })
      ),
      storage: { from: storageFrom }
    };
    mockServiceClient.mockReturnValue(serviceClient as never);

    const result = await getPendingPaymentsWithSignedProofs();

    expect(result.configError).toBeNull();
    expect(result.orders).toHaveLength(2);
    expect(result.orders[0].proof_signed_url).toBe('https://signed.example/order-a/proof-1.png?ttl=300');
    expect(result.orders[0].proof_public_url).toBe(result.orders[0].proof_signed_url);
    expect(createSignedUrl).toHaveBeenCalledWith('order-a/proof-1.png', 300);
    expect(result.orders[1].proof_signed_url).toBeNull();
  });
});
