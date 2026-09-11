import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import EventForm from '../EventForm';

export const metadata = {
  title: 'Create Event - Ngahiji CMS'
};

export default async function NewEventPage() {
  await requireAdmin();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin/events">← Events</Link>
        <div className="eyebrow">NGAHIJI CMS / Create Event</div>
        <h1>Create event.</h1>
        <p>Event baru disimpan ke Supabase. Publish tetap dilindungi RLS dan role admin.</p>
        <EventForm />
      </section>
    </main>
  );
}
