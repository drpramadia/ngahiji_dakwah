import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import PaymentSettingsForm from '../PaymentSettingsForm';

export const metadata = { title: 'New payment setting - Ngahiji CMS' };

export default async function NewPaymentSettingPage() {
  await requireAdmin();
  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel">
        <Link className="pageback" href="/admin/payments/settings">← Payment settings</Link>
        <div className="eyebrow">NGAHIJI CMS / Payments / Settings / New</div>
        <h1>New payment setting.</h1>
        <p>Tambah metode pembayaran baru. Upload gambar QRIS lalu simpan.</p>
        <PaymentSettingsForm />
      </section>
    </main>
  );
}
