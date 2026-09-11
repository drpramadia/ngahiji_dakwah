import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getAdminDashboardMetrics } from '@/lib/admin/dashboard';
import { signOutAdmin } from './actions';

export const metadata = {
  title: 'Admin - Ngahiji CMS'
};

const adminSections = [
  ['Events', '/admin/events', 'Kelola event, status publish, dan konten detail.'],
  ['Tickets', '/admin/tickets', 'Kelola ticket types dan kuota.'],
  ['Orders', '/admin/orders', 'Belum aktif sampai order schema tersedia.'],
  ['Attendees', '/admin/attendees', 'Belum aktif sampai registration schema tersedia.'],
  ['Check-in', '/admin/check-in', 'Belum aktif sampai ticket QR schema tersedia.'],
  ['Media', '/admin/media', 'Kelola artikel, video, podcast, dan gallery.'],
  ['Live', '/admin/live', 'Kelola live content dan jadwal.'],
  ['Community', '/admin/community', 'Kelola kategori dan konten komunitas.'],
  ['Sponsors', '/admin/sponsors', 'Belum aktif sampai sponsor schema tersedia.'],
  ['Analytics', '/admin/analytics', 'Belum aktif sampai analytics schema tersedia.'],
  ['Settings', '/admin/settings', 'Konfigurasi konten dan integrasi.']
] as const;

export default async function AdminPage() {
  const [{ user, roles }, metrics] = await Promise.all([requireAdmin(), getAdminDashboardMetrics()]);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="logo admin-logo" href="/" aria-label="Ngahiji public website"><img src="/NGAHIJI_LOGO.png" alt="Logo resmi Ngahiji Dakwah Organizer" /></Link>
        <nav aria-label="Admin navigation">
          {adminSections.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="eyebrow">NGAHIJI CMS</div>
            <h1>Dashboard.</h1>
          </div>
          <div className="admin-user">
            <span>{user.email}</span>
            <small>{roles.map((role) => role.role).join(' · ')}</small>
            <form action={signOutAdmin}><button type="submit">Logout</button></form>
          </div>
        </header>
        <div className="admin-grid">
          {metrics.map((metric) => (
            <article className={metric.status === 'ready' ? 'admin-card' : 'admin-card muted'} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
        <section className="admin-panel">
          <div className="sectionhead compact">
            <div>
              <div className="eyebrow">Operational routes</div>
              <h2>CMS modules.</h2>
            </div>
          </div>
          <div className="admin-module-grid">
            {adminSections.map(([label, href, description]) => (
              <Link className="admin-module" key={href} href={href}>
                <strong>{label}</strong>
                <span>{description}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
