import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsLiveStreamById } from '@/lib/admin/live-streams';
import LiveStreamForm from '../LiveStreamForm';
import { deleteLiveStreamAction } from '../actions';

export const metadata = { title: 'Edit Live - Ngahiji CMS' };

type Props = { params: Promise<{ id: string }> };

export default async function EditLiveStreamPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const item = await getCmsLiveStreamById(id);
  if (!item) notFound();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel">
        <Link className="pageback" href="/admin/live">← Live streams</Link>
        <div className="eyebrow">NGAHIJI CMS / Live / Edit</div>
        <h1>Edit live stream.</h1>
        <p>Ubah detail live stream. Perubahan akan langsung terlihat di homepage setelah disimpan.</p>
        <LiveStreamForm item={item} />

        <div className="admin-card muted" style={{ marginTop: 24 }}>
          <span>Danger zone</span>
          <form action={deleteLiveStreamAction} style={{ marginTop: 8 }}>
            <input type="hidden" name="id" value={item.id} />
            <button className="btn light" type="submit">Hapus live stream ini</button>
          </form>
        </div>
      </section>
    </main>
  );
}
