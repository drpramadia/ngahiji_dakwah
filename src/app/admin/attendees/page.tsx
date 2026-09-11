import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsAttendees } from '@/lib/admin/ticketing';

export const metadata = { title: 'Attendees - Ngahiji CMS' };

export default async function AdminAttendeesPage() {
  await requireAdmin();
  const attendees = await getCmsAttendees();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / Attendees</div>
        <h1>Attendees.</h1>
        <p>Buyer dan attendee dipisahkan. Data personal hanya tersedia untuk admin/organizer berwenang.</p>
        <div className="admin-table" role="table" aria-label="Attendees">
          <div className="admin-table-row head"><span>Attendee</span><span>Status</span><span>Event</span><span>Instagram</span><span>WhatsApp</span></div>
          {attendees.map((attendee) => <div className="admin-table-row" key={attendee.id}><span><strong>{attendee.full_name}</strong><small>{attendee.email}</small></span><span><b className="admin-pill">{attendee.verification_status}</b></span><span>{attendee.registrations?.events?.title ?? 'Event unavailable'}</span><span>{attendee.instagram || '-'}</span><span>{attendee.whatsapp || '-'}</span></div>)}
        </div>
        {!attendees.length && <div className="emptybox"><h2>Belum ada attendee.</h2><p>Attendee akan dibuat dari registration flow production, bukan dari data demo.</p></div>}
      </section>
    </main>
  );
}
