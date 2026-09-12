import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsPaymentSettingById } from '@/lib/admin/payment-settings';
import PaymentSettingsForm from '../PaymentSettingsForm';
import { deletePaymentSettingAction } from '../actions';

export const metadata = { title: 'Edit payment setting - Ngahiji CMS' };

type Props = { params: Promise<{ id: string }> };

export default async function EditPaymentSettingPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const item = await getCmsPaymentSettingById(id);
  if (!item) notFound();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel">
        <Link className="pageback" href="/admin/payments/settings">← Payment settings</Link>
        <div className="eyebrow">NGAHIJI CMS / Payments / Settings / Edit</div>
        <h1>Edit payment setting.</h1>
        <p>Ubah QRIS image, instructions, atau info bank. Perubahan langsung berlaku di checkout setelah disimpan.</p>
        <PaymentSettingsForm item={item} />

        <div className="admin-card muted" style={{ marginTop: 24 }}>
          <span>Danger zone</span>
          <form action={deletePaymentSettingAction} style={{ marginTop: 8 }}>
            <input type="hidden" name="id" value={item.id} />
            <button className="btn light" type="submit">Hapus setting ini</button>
          </form>
        </div>
      </section>
    </main>
  );
}
