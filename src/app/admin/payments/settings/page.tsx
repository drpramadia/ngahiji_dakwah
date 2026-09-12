import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsPaymentSettings } from '@/lib/admin/payment-settings';
import { activatePaymentSettingAction } from './actions';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

export const metadata = { title: 'Payment settings - Ngahiji CMS' };

export default async function AdminPaymentSettingsPage() {
  await requireAdmin();
  const items = await getCmsPaymentSettings();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <div className="admin-page-head">
          <div>
            <Link className="pageback" href="/admin/payments">← Payments</Link>
            <div className="eyebrow">NGAHIJI CMS / Payments / Settings</div>
            <h1>Payment settings.</h1>
            <p>Kelola QRIS image, merchant info, dan instruksi pembayaran. Setting aktif otomatis tampil di halaman checkout.</p>
          </div>
          <Link className="btn" href="/admin/payments/settings/new">Create setting ↗</Link>
        </div>

        <div className="admin-table" role="table" aria-label="Payment settings">
          <div className="admin-table-row head" role="row"><span>Method / Merchant</span><span>Status</span><span>QR</span><span>Updated</span><span>Actions</span></div>
          {items.map((item) => (
            <div className="admin-table-row" role="row" key={item.id}>
              <span>
                <strong>{item.payment_method}</strong>
                <small>{item.merchant_name}{item.bank_name ? ` · ${item.bank_name}` : ''}</small>
              </span>
              <span>
                {item.active ? <b className="admin-pill">ACTIVE</b> : <b className="admin-pill muted">inactive</b>}
              </span>
              <span>
                {item.qr_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.qr_image_url} alt="QRIS thumbnail" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                ) : <small className="muted">no image</small>}
              </span>
              <span><small>{formatDate(item.updated_at)}</small></span>
              <span className="admin-actions">
                <Link href={`/admin/payments/settings/${item.id}`}>Edit</Link>
                {!item.active && (
                  <form action={activatePaymentSettingAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit">Activate</button>
                  </form>
                )}
              </span>
            </div>
          ))}
        </div>

        {!items.length && (
          <div className="emptybox">
            <h2>Belum ada payment setting.</h2>
            <p>Tambah setting pertama untuk menampilkan QRIS di halaman checkout.</p>
          </div>
        )}
      </section>
    </main>
  );
}
