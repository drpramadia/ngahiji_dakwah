import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import LiveStreamForm from '../LiveStreamForm';

export const metadata = { title: 'New Live - Ngahiji CMS' };

export default async function NewLiveStreamPage() {
  await requireAdmin();
  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel">
        <Link className="pageback" href="/admin/live">← Live streams</Link>
        <div className="eyebrow">NGAHIJI CMS / Live / New</div>
        <h1>New live stream.</h1>
        <p>Tambahkan konten live baru dari YouTube. Set status ke <strong>PUBLISHED</strong> agar tampil di homepage.</p>
        <LiveStreamForm />
      </section>
    </main>
  );
}
