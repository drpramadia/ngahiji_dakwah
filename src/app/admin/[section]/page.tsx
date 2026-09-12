import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';

const sections: Record<string, { title: string; description: string; status: string }> = {
  events: { title: 'Events', description: 'Event CRUD, preview, publish, unpublish, archive.', status: 'Foundation ready: events and ticket_types tables exist.' },
  tickets: { title: 'Tickets', description: 'Ticket type and quota management.', status: 'Foundation ready: ticket_types table exists; reservation/order logic not active yet.' },
  orders: { title: 'Orders', description: 'Order review and payment status.', status: 'Not configured: orders schema is not created yet.' },
  attendees: { title: 'Attendees', description: 'Buyer and attendee management.', status: 'Not configured: registrations/attendees schema is not created yet.' },
  'check-in': { title: 'Check-in', description: 'QR scanner and manual ticket lookup.', status: 'Not configured: tickets/check_ins schema is not created yet.' },
    media: { title: 'Media', description: 'Articles, videos, podcasts, and gallery.', status: 'Foundation ready: media_items table exists.' },
  community: { title: 'Community', description: 'Community categories and posts.', status: 'Foundation ready: communities table exists; posts/members not active yet.' },
  sponsors: { title: 'Sponsors', description: 'Sponsors, campaigns, placement, and aggregate analytics.', status: 'Not configured: sponsor schema is not created yet.' },
  analytics: { title: 'Analytics', description: 'Visits, conversion, ticket, and check-in metrics.', status: 'Not configured: analytics_events schema is not created yet.' },
  settings: { title: 'Settings', description: 'Platform content and integration configuration.', status: 'Not configured: settings/homepage schema is not created yet.' }
};

type Props = {
  params: Promise<{ section: string }>;
};

export async function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function AdminSectionPage({ params }: Props) {
  await requireAdmin();
  const { section } = await params;
  const config = sections[section];
  if (!config) notFound();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / {config.title}</div>
        <h1>{config.title}.</h1>
        <p>{config.description}</p>
        <div className="admin-card muted">
          <span>Production status</span>
          <strong>{config.status}</strong>
        </div>
        <p className="notice">Halaman ini protected server-side. Konten tidak dibuat palsu; modul akan diaktifkan setelah schema, RLS, dan service production tersedia.</p>
      </section>
    </main>
  );
}
