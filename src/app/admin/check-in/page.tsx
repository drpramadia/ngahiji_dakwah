import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsCheckIns } from '@/lib/admin/ticketing';
import QrScanner from './QrScanner';

export const metadata = { title: 'Check-in - Ngahiji CMS' };

function badge(status: string) {
  const map: Record<string, string> = {
    VALID: 'admin-pill',
    ALREADY_USED: 'admin-pill muted',
    UNPAID: 'admin-pill muted',
    WRONG_EVENT: 'admin-pill muted',
    CANCELLED: 'admin-pill muted',
    REFUNDED: 'admin-pill muted',
    INVALID: 'admin-pill muted'
  };
  return map[status] ?? 'admin-pill';
}

export default async function AdminCheckInPage() {
  await requireAdmin();
  const checkIns = await getCmsCheckIns();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / Check-in</div>
        <h1>Check-in.</h1>
        <p>Scan QR tiket peserta di pintu masuk event. Validasi & atomic state transition dijalankan di database.</p>

        <div className="checkin-layout">
          <div className="checkin-scanner-wrap">
            <h2 className="admin-section-heading">Scanner</h2>
            <QrScanner />
          </div>

          <div className="checkin-history">
            <h2 className="admin-section-heading">Riwayat check-in (100 terakhir)</h2>
            <div className="admin-table" role="table" aria-label="Check-ins">
              <div className="admin-table-row head"><span>Waktu</span><span>Status</span><span>Event</span><span>Peserta</span><span>Kode</span></div>
              {checkIns.map((c) => (
                <div className="admin-table-row" key={c.id}>
                  <span><small>{new Date(c.created_at).toLocaleString('id-ID')}</small></span>
                  <span><b className={badge(c.status)}>{c.status}</b></span>
                  <span>{c.events?.title ?? '—'}</span>
                  <span>{c.tickets?.attendees?.full_name ?? '—'}</span>
                  <span className="mono"><small>{c.tickets?.id?.slice(0, 8).toUpperCase() ?? '—'}</small></span>
                </div>
              ))}
            </div>
            {!checkIns.length && (
              <div className="emptybox">
                <h2>Belum ada check-in.</h2>
                <p>Scan QR tiket pertama untuk mulai mencatat kehadiran.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
