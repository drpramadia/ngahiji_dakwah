import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsCheckIns } from '@/lib/admin/ticketing';

export const metadata = { title: 'Check-in - Ngahiji CMS' };

export default async function AdminCheckInPage() {
  await requireAdmin();
  const checkIns = await getCmsCheckIns();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / Check-in</div>
        <h1>Check-in.</h1>
        <p>Schema check-in sudah atomic di database. Scanner production belum diaktifkan sampai QR validation endpoint tersedia.</p>
        <div className="admin-table" role="table" aria-label="Check-ins">
          <div className="admin-table-row head"><span>Check-in</span><span>Status</span><span>Event</span><span>Ticket</span><span>Time</span></div>
          {checkIns.map((checkIn) => <div className="admin-table-row" key={checkIn.id}><span><strong>{checkIn.id}</strong></span><span><b className="admin-pill">{checkIn.status}</b></span><span>{checkIn.events?.title ?? 'Event unavailable'}</span><span>{checkIn.tickets?.attendees?.full_name ?? checkIn.tickets?.id ?? '-'}</span><span>{new Date(checkIn.created_at).toLocaleString('id-ID')}</span></div>)}
        </div>
        {!checkIns.length && <div className="emptybox"><h2>Belum ada check-in.</h2><p>Check-in akan tercatat setelah secure QR validation endpoint aktif.</p></div>}
      </section>
    </main>
  );
}
