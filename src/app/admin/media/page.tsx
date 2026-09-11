import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsMediaItems } from '@/lib/admin/media';
import { setMediaStatusAction } from './actions';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

export const metadata = {
  title: 'Media - Ngahiji CMS'
};

export default async function AdminMediaPage() {
  await requireAdmin();
  const items = await getCmsMediaItems();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <div className="admin-page-head">
          <div>
            <Link className="pageback" href="/admin">← Dashboard</Link>
            <div className="eyebrow">NGAHIJI CMS / Media</div>
            <h1>Media.</h1>
            <p>Kelola artikel, video, podcast, dan story content dari Supabase.</p>
          </div>
          <Link className="btn" href="/admin/media/new">Create media ↗</Link>
        </div>
        <div className="admin-table media-table" role="table" aria-label="CMS media">
          <div className="admin-table-row head" role="row"><span>Media</span><span>Status</span><span>Format</span><span>Published</span><span>Actions</span></div>
          {items.map((item) => (
            <div className="admin-table-row" role="row" key={item.id}>
              <span><strong>{item.title}</strong><small>{item.slug} · {item.category}</small></span>
              <span><b className="admin-pill">{item.status}</b></span>
              <span>{item.format.replace('_', ' ')}</span>
              <span>{formatDate(item.published_at)}</span>
              <span className="admin-actions">
                <Link href={`/admin/media/${item.id}`}>Edit</Link>
                <Link href={`/#media`}>Preview</Link>
                <form action={setMediaStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="PUBLISHED" /><button type="submit">Publish</button></form>
                <form action={setMediaStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="DRAFT" /><button type="submit">Unpublish</button></form>
                <form action={setMediaStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="ARCHIVED" /><button type="submit">Archive</button></form>
              </span>
            </div>
          ))}
        </div>
        {!items.length && <div className="emptybox"><h2>Belum ada media.</h2><p>Buat media pertama untuk menampilkan konten setelah dipublish.</p></div>}
      </section>
    </main>
  );
}
