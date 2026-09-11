import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsTickets } from '@/lib/admin/ticketing';

export const metadata = { title: 'Tickets - Ngahiji CMS' };

export default async function AdminTicketsPage() {
  await requireAdmin();
  const tickets = await getCmsTickets();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / Tickets</div>
        <h1>Tickets.</h1>
        <p>Ticket hanya aktif setelah payment `PAID` dan attendee `VERIFIED`. QR token disimpan sebagai hash, bukan token mentah.</p>
        <div className="admin-table" role="table" aria-label="Tickets">
          <div className="admin-table-row head"><span>Ticket</span><span>Status</span><span>Event</span><span>Attendee</span><span>Check-in</span></div>
          {tickets.map((ticket) => <div className="admin-table-row" key={ticket.id}><span><strong>{ticket.id}</strong><small>{ticket.payment_status} · {ticket.verification_status}</small></span><span><b className="admin-pill">{ticket.status}</b></span><span>{ticket.events?.title ?? 'Event unavailable'}</span><span>{ticket.attendees?.full_name ?? '-'}</span><span>{ticket.check_in_status}</span></div>)}
        </div>
        {!tickets.length && <div className="emptybox"><h2>Belum ada ticket.</h2><p>Ticket akan diterbitkan setelah order/payment server-side aktif.</p></div>}
      </section>
    </main>
  );
}
