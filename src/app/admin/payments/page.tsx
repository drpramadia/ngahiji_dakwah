import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getPendingPaymentsForAdmin } from '@/lib/payments/qris/service';
import { approvePaymentAction, rejectPaymentAction } from '@/lib/payments/qris/actions';
import PaymentProofLink from './PaymentProofLink';

export const metadata = { title: 'Payments - Ngahiji Admin' };

function money(value: number) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
}

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const orders = await getPendingPaymentsForAdmin();

  const pending = orders.filter((o) => o.status === 'WAITING_VERIFICATION' || o.status === 'PENDING_PAYMENT');
  const done = orders.filter((o) => o.status === 'PAID' || o.status === 'FAILED');

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="admin-page-head">
          <div>
            <div className="eyebrow">NGAHIJI CMS / PAYMENTS</div>
            <h1>Payments.</h1>
            <p>Verifikasi pembayaran QRIS manual. Approve akan set order PAID, ticket aktif.</p>
          </div>
          <Link className="btn light" href="/admin/payments/settings">QRIS settings ↗</Link>
        </div>

        <h2 className="admin-section-heading">Menunggu Verifikasi ({pending.length})</h2>
        <div className="admin-table">
          <div className="admin-table-row head">
            <span>Order / Buyer</span>
            <span>Event</span>
            <span>Nominal</span>
            <span>Status</span>
            <span>Aksi</span>
          </div>
          {pending.length === 0 && <div className="admin-table-row"><span>Tidak ada order menunggu verifikasi.</span></div>}
          {pending.map((o) => (
            <div key={o.id} className="admin-table-row">
              <span>
                #{o.id.slice(0, 8).toUpperCase()}
                <small>{o.buyer_name || o.buyer_email || o.buyer_id.slice(0, 8)}</small>
              </span>
              <span>
                {o.event_title}
                <small>{o.quantity} × {o.ticket_name}</small>
              </span>
              <span>{money(o.total_idr ?? o.subtotal_idr)}</span>
              <span><span className="admin-pill">{o.status}</span></span>
              <span className="admin-actions">
                {o.payment_proof_url && <PaymentProofLink path={o.payment_proof_url} />}
                <form action={approvePaymentAction}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <button className="btn lime" type="submit">Approve</button>
                </form>
                <form action={rejectPaymentAction} style={{ display: 'flex', gap: 6 }}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <input name="reason" placeholder="Alasan (opsional)" style={{ minHeight: 36, fontSize: 12 }} />
                  <button className="btn light" type="submit">Reject</button>
                </form>
              </span>
            </div>
          ))}
        </div>

        <h2 className="admin-section-heading" style={{ marginTop: 32 }}>Selesai ({done.length})</h2>
        <div className="admin-table">
          <div className="admin-table-row head">
            <span>Order / Buyer</span>
            <span>Event</span>
            <span>Nominal</span>
            <span>Status</span>
            <span>Verified</span>
          </div>
          {done.length === 0 && <div className="admin-table-row"><span>Belum ada order selesai.</span></div>}
          {done.map((o) => (
            <div key={o.id} className="admin-table-row">
              <span>#{o.id.slice(0, 8).toUpperCase()}<small>{o.buyer_name || o.buyer_email}</small></span>
              <span>{o.event_title}<small>{o.quantity} × {o.ticket_name}</small></span>
              <span>{money(o.total_idr ?? o.subtotal_idr)}</span>
              <span><span className={o.status === 'PAID' ? 'admin-pill' : 'admin-pill muted'}>{o.status}</span></span>
              <span><small>{o.verified_at ? new Date(o.verified_at).toLocaleString('id-ID') : '—'}</small></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}