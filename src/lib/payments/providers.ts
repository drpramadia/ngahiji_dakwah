export type PaymentProviderName = 'MIDTRANS' | 'XENDIT';

export type PaymentProviderStatus = {
  provider: PaymentProviderName;
  configured: boolean;
  missing: string[];
};

export type PaymentIntentInput = {
  orderId: string;
  amountIdr: number;
  customerEmail: string;
};

export type PaymentIntent = {
  provider: PaymentProviderName;
  providerReference: string;
  redirectUrl: string;
};

function hasValue(name: string, env: Record<string, string | undefined>) {
  const value = env[name];
  return Boolean(value && value.trim() && !value.includes('replace-') && !value.includes('your-'));
}

export function getPaymentProviderStatuses(env: Record<string, string | undefined> = process.env): PaymentProviderStatus[] {
  const midtransMissing = ['MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'].filter((name) => !hasValue(name, env));
  const xenditMissing = ['XENDIT_SECRET_KEY'].filter((name) => !hasValue(name, env));

  return [
    { provider: 'MIDTRANS', configured: midtransMissing.length === 0, missing: midtransMissing },
    { provider: 'XENDIT', configured: xenditMissing.length === 0, missing: xenditMissing }
  ];
}

export function assertPaymentProviderConfigured(provider: PaymentProviderName, env: Record<string, string | undefined> = process.env) {
  const status = getPaymentProviderStatuses(env).find((item) => item.provider === provider);
  if (!status?.configured) {
    throw new Error(`${provider} payment provider is not configured. Missing: ${status?.missing.join(', ') || 'unknown'}`);
  }
}

export async function createPaymentIntent(provider: PaymentProviderName, input: PaymentIntentInput): Promise<PaymentIntent> {
  void input;
  assertPaymentProviderConfigured(provider);
  throw new Error(`${provider} adapter is not implemented yet. Configure webhook verification before enabling checkout.`);
}
