export type IntegrationStatus = 'configured' | 'unconfigured';

export type IntegrationCheck = {
  name: string;
  status: IntegrationStatus;
  required: boolean;
  scope: 'public' | 'server';
};

function hasValue(name: string, env: Record<string, string | undefined>) {
  const value = env[name];
  return Boolean(value && value.trim() && !value.includes('replace-') && !value.includes('your-'));
}

export function getIntegrationStatus(env: Record<string, string | undefined> = process.env): IntegrationCheck[] {
  return [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', status: hasValue('NEXT_PUBLIC_SUPABASE_URL', env) ? 'configured' : 'unconfigured', required: true, scope: 'public' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: hasValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', env) ? 'configured' : 'unconfigured', required: true, scope: 'public' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', status: hasValue('SUPABASE_SERVICE_ROLE_KEY', env) ? 'configured' : 'unconfigured', required: true, scope: 'server' },
    { name: 'MIDTRANS_SERVER_KEY', status: hasValue('MIDTRANS_SERVER_KEY', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' },
    { name: 'MIDTRANS_CLIENT_KEY', status: hasValue('MIDTRANS_CLIENT_KEY', env) ? 'configured' : 'unconfigured', required: false, scope: 'public' },
    { name: 'XENDIT_SECRET_KEY', status: hasValue('XENDIT_SECRET_KEY', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' },
    { name: 'GOOGLE_CLIENT_ID', status: hasValue('GOOGLE_CLIENT_ID', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' },
    { name: 'GOOGLE_CLIENT_SECRET', status: hasValue('GOOGLE_CLIENT_SECRET', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' },
    { name: 'EMAIL_PROVIDER_KEY', status: hasValue('EMAIL_PROVIDER_KEY', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' },
    { name: 'WHATSAPP_PROVIDER_KEY', status: hasValue('WHATSAPP_PROVIDER_KEY', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' },
    { name: 'STREAM_PROVIDER_KEY', status: hasValue('STREAM_PROVIDER_KEY', env) ? 'configured' : 'unconfigured', required: false, scope: 'server' }
  ];
}
