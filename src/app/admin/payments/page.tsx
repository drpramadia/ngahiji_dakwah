import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getPendingPaymentsWithSignedProofs } from '@/lib/payments/qris/service';
import { approvePaymentAction, rejectPaymentAction } from '@/lib/payments/qris/actions';
import PaymentProofThumb from './PaymentProofThumb';
import ExpireOrdersButton from './ExpireOrdersButton';

export const metadata = { title: 'Payments - Ngahiji Admin' };

function money(value: number) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
}

function fmtDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
  });
}

function statusPill(status: string) {
  const tone: Record<string, string> = {
    PAID: 'admin-pill',
    WAITING_VERIFICATION: 'admin-pill',
    PENDING_PAYMENT: 'admin-pill muted',
    FAILED: 'admin-pill muted',
    EXPIRED: 'admin-pill muted'
  };
  return <span className={tone[status] ?? 'admin-pill muted'}>{status}</span>;
}

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const { orders, configError } = await getPendingPaymentsWithSignedProofs();

  const waiting = orders.filter((o) => o.status === 'WAITING_VERIFICATION');
  const pending = orders.filter((o) => o.status === 'PENDING_PAYMENT');
  const done = orders.filter((o) => o.status === 'PAID' || o.status === 'FAILED' || o.status === 'EXPIRED');

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="admin-page-head">
          <div>
            <div className="eyebrow">NGAHIJI CMS / PAYMENTS</div>
            <h1>Payments.</h1>
            <p>Verifikasi pembayaran QRIS manual. Approve akan set order PAID, ticket aktif, dan QR tiket terbit otomatis.</p>
          </div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
            <Link className="btn light" href="/admin/payments/settings">QRIS settings ↗</Link>
            <ExpireOrdersButton />
          </div>
        </div>

        {configError && (
          <div className="admin-error" role="alert">
            <strong>Konfigurasi payments bermasalah.</strong> {configError}
            <br />
            <small>Set SUPABASE_SERVICE_ROLE_KEY di environment lalu redeploy. Tanpa itu, daftar pembayaran tidak dapat dimuat.</small>
          </div>
        )}

        <h2 className="admin-section-heading">Menunggu Verifikasi ({waiting.length})</h2>
        <div className="payments-table" role="table" aria-label="Payments menunggu verifikasi">
          <div className="payments-table-row head" role="row">
            <span>Order</span>
            <span>Event</span>
            <span>Customer</span>
            <span>Nominal</span>
            <span>Upload</span>
            <span>Bukti</span>
            <span>Status</span>
            <span>Aksi</span>
          </div>
          {waiting.length === 0 && <div className="payments-table-row"><span style={{ gridColumn: '1 / -1' }}>Tidak ada order menunggu verifikasi.</span></div>}
          {waiting.map((o) => (
            <div key={o.id} className="payments-table-row" role="row">
              <span><strong className="mono">#{o.id.slice(0, 8).toUpperCase()}</strong><small>{fmtDateTime(o.created_at)}</small></span>
              <span><strong>{o.event_title}</strong><small>{o.quantity} × {o.ticket_name}</small></span>
              <span><strong>{o.buyer_name || '(nama belum diisi)'}</strong><small>{o.buyer_email || '—'}</small></span>
              <span><strong>{money(o.total_idr ?? o.subtotal_idr)}</strong></span>
              <span><small>{fmtDateTime(o.payment_uploaded_at)}</small></span>
              <span><PaymentProofThumb url={o.proof_signed_url} filename={o.payment_proof_url} /></span>
              <span>{statusPill(o.status)}</span>
              <span className="admin-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <form action={approvePaymentAction}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <button className="btn lime" type="submit" style={{ width: '100%' }}>Approve</button>
                </form>
                <form action={rejectPaymentAction} style={{ display: 'grid', gap: 4 }}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <input name="reason" placeholder="Alasan tolak (opsional)" style={{ minHeight: 32, fontSize: 11 }} />
                  <button className="btn light" type="submit" style={{ width: '100%' }}>Reject</button>
                </form>
              </span>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <>
            <h2 className="admin-section-heading" style={{ marginTop: 32 }}>Menunggu Pembayaran ({pending.length})</h2>
            <div className="payments-table" role="table">
              <div className="payments-table-row head"><span>Order</span><span>Event</span><span>Customer</span><span>Nominal</span><span>Dibuat</span><span>Bukti</span><span>Status</span><span>Aksi</span></div>
              {pending.map((o) => (
                <div key={o.id} className="payments-table-row">
                  <span><strong className="mono">#{o.id.slice(0, 8).toUpperCase()}</strong></span>
                  <span><strong>{o.event_title}</strong><small>{o.quantity} × {o.ticket_name}</small></span>
                  <span><strong>{o.buyer_name || '—'}</strong><small>{o.buyer_email || '—'}</small></span>
                  <span>{money(o.total_idr ?? o.subtotal_idr)}</span>
                  <span><small>{fmtDateTime(o.created_at)}</small></span>
                  <span><small className="muted">— belum upload</small></span>
                  <span>{statusPill(o.status)}</span>
                  <span><small className="muted">Menunggu buyer</small></span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="admin-section-heading" style={{ marginTop: 32 }}>Selesai ({done.length})</h2>
        <div className="payments-table" role="table">
          <div className="payments-table-row head"><span>Order</span><span>Event</span><span>Customer</span><span>Nominal</span><span>Upload</span><span>Bukti</span><span>Status</span><span>Verified</span></div>
          {done.length === 0 && <div className="payments-table-row"><span style={{ gridColumn: '1 / -1' }}>Belum ada order selesai.</span></div>}
          {done.map((o) => (
            <div key={o.id} className="payments-table-row">
              <span><strong className="mono">#{o.id.slice(0, 8).toUpperCase()}</strong></span>
              <span><strong>{o.event_title}</strong><small>{o.quantity} × {o.ticket_name}</small></span>
              <span><strong>{o.buyer_name || '—'}</strong><small>{o.buyer_email || '—'}</small></span>
              <span>{money(o.total_idr ?? o.subtotal_idr)}</span>
              <span><small>{fmtDateTime(o.payment_uploaded_at)}</small></span>
              <span><PaymentProofThumb url={o.proof_signed_url} filename={o.payment_proof_url} /></span>
              <span>{statusPill(o.status)}</span>
              <span>
                <small>{fmtDateTime(o.verified_at)}</small>
                {o.status === 'FAILED' && o.rejection_reason && (
                  <small style={{ display: 'block', color: '#a93222', marginTop: 4 }}>{o.rejection_reason}</small>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
