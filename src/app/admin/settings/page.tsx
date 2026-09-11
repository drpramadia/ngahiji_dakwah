import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getIntegrationStatus } from '@/lib/integrations/config';
import { getPaymentProviderStatuses } from '@/lib/payments/providers';

export const metadata = { title: 'Settings - Ngahiji CMS' };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const integrations = getIntegrationStatus();
  const paymentProviders = getPaymentProviderStatuses();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / Settings</div>
        <h1>Settings.</h1>
        <p>Configuration status only. Nilai secret tidak pernah ditampilkan di UI.</p>
        <section className="admin-panel">
          <div className="sectionhead compact"><div><div className="eyebrow">Integrations</div><h2>Environment readiness.</h2></div></div>
          <div className="admin-table" role="table" aria-label="Integration configuration status">
            <div className="admin-table-row head"><span>Variable</span><span>Status</span><span>Scope</span><span>Required</span><span>Notes</span></div>
            {integrations.map((integration) => (
              <div className="admin-table-row" key={integration.name}>
                <span><strong>{integration.name}</strong></span>
                <span><b className={integration.status === 'configured' ? 'admin-pill' : 'admin-pill muted'}>{integration.status}</b></span>
                <span>{integration.scope}</span>
                <span>{integration.required ? 'Required' : 'Optional'}</span>
                <span>{integration.scope === 'server' ? 'Server-only; never expose in client components.' : 'May be public only when prefixed correctly.'}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <div className="sectionhead compact"><div><div className="eyebrow">Payment</div><h2>Provider status.</h2></div></div>
          <div className="admin-table" role="table" aria-label="Payment provider status">
            <div className="admin-table-row head"><span>Provider</span><span>Status</span><span>Missing</span><span>Runtime</span><span>Notes</span></div>
            {paymentProviders.map((provider) => (
              <div className="admin-table-row" key={provider.provider}>
                <span><strong>{provider.provider}</strong></span>
                <span><b className={provider.configured ? 'admin-pill' : 'admin-pill muted'}>{provider.configured ? 'configured' : 'unconfigured'}</b></span>
                <span>{provider.missing.length ? provider.missing.join(', ') : '-'}</span>
                <span>Disabled</span>
                <span>Checkout remains blocked until adapter implementation and webhook verification are complete.</span>
              </div>
            ))}
          </div>
          <p className="notice">Payment gateway belum dipersiapkan. Aplikasi tidak membuat transaksi palsu dan tidak menandai order sebagai paid dari frontend redirect.</p>
        </section>
      </section>
    </main>
  );
}
