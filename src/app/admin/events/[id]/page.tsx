import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsEventById } from '@/lib/admin/events';
import EventForm from '../EventForm';

export const metadata = {
  title: 'Edit Event - Ngahiji CMS'
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const event = await getCmsEventById(id);
  if (!event) notFound();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin/events">← Events</Link>
        <div className="eyebrow">NGAHIJI CMS / Edit Event</div>
        <h1>Edit event.</h1>
        <p>{event.title}</p>
        <EventForm event={event} />
      </section>
    </main>
  );
}
