import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsEvents } from '@/lib/admin/events';
import { setEventStatusAction } from './actions';

function money(value: number) {
  return value ? 'Rp' + new Intl.NumberFormat('id-ID').format(value) : 'Gratis';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

export const metadata = {
  title: 'Events - Ngahiji CMS'
};

export default async function AdminEventsPage() {
  await requireAdmin();
  const events = await getCmsEvents();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <div className="admin-page-head">
          <div>
            <Link className="pageback" href="/admin">← Dashboard</Link>
            <div className="eyebrow">NGAHIJI CMS / Events</div>
            <h1>Events.</h1>
            <p>Create, edit, preview, publish, unpublish, and archive event content from Supabase.</p>
          </div>
          <Link className="btn" href="/admin/events/new">Create event ↗</Link>
        </div>
        <div className="admin-table" role="table" aria-label="CMS events">
          <div className="admin-table-row head" role="row"><span>Event</span><span>Status</span><span>Date</span><span>Ticket</span><span>Actions</span></div>
          {events.map((event) => {
            const ticket = event.ticket_types?.[0];
            return (
              <div className="admin-table-row" role="row" key={event.id}>
                <span><strong>{event.title}</strong><small>{event.slug} · {event.city}</small></span>
                <span><b className="admin-pill">{event.status}</b></span>
                <span>{formatDate(event.starts_at)}</span>
                <span>{ticket ? `${ticket.name} · ${money(ticket.price_idr)} · quota ${ticket.quota}` : 'No ticket type'}</span>
                <span className="admin-actions">
                  <Link href={`/admin/events/${event.id}`}>Edit</Link>
                  <Link href={`/#events`}>Preview</Link>
                  <form action={setEventStatusAction}><input type="hidden" name="id" value={event.id} /><input type="hidden" name="status" value="PUBLISHED" /><button type="submit">Publish</button></form>
                  <form action={setEventStatusAction}><input type="hidden" name="id" value={event.id} /><input type="hidden" name="status" value="DRAFT" /><button type="submit">Unpublish</button></form>
                  <form action={setEventStatusAction}><input type="hidden" name="id" value={event.id} /><input type="hidden" name="status" value="ARCHIVED" /><button type="submit">Archive</button></form>
                </span>
              </div>
            );
          })}
        </div>
        {!events.length && <div className="emptybox"><h2>Belum ada event.</h2><p>Buat event pertama untuk menampilkan konten publik setelah dipublish.</p></div>}
      </section>
    </main>
  );
}
