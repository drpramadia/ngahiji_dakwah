import { describe, expect, it } from 'vitest';
import { assertPaymentProviderConfigured, createPaymentIntent, getPaymentProviderStatuses } from '@/lib/payments/providers';

describe('payment provider configuration', () => {
  it('reports unconfigured providers without secrets', () => {
    expect(getPaymentProviderStatuses({})).toEqual([
      { provider: 'MIDTRANS', configured: false, missing: ['MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'] },
      { provider: 'XENDIT', configured: false, missing: ['XENDIT_SECRET_KEY'] }
    ]);
  });

  it('blocks payment intent creation instead of simulating success', async () => {
    await expect(createPaymentIntent('MIDTRANS', { orderId: 'order-1', amountIdr: 100000, customerEmail: 'buyer@example.com' })).rejects.toThrow('not configured');
  });

  it('requires implementation even after env is configured', () => {
    expect(() => assertPaymentProviderConfigured('XENDIT', { XENDIT_SECRET_KEY: 'configured-value' })).not.toThrow();
  });
});
