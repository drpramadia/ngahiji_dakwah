import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsLiveStreams } from '@/lib/admin/live-streams';
import { setLiveStreamStatusAction, toggleLiveStreamIsLiveAction } from './actions';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

export const metadata = { title: 'Live - Ngahiji CMS' };

export default async function AdminLivePage() {
  await requireAdmin();
  const items = await getCmsLiveStreams();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <div className="admin-page-head">
          <div>
            <Link className="pageback" href="/admin">← Dashboard</Link>
            <div className="eyebrow">NGAHIJI CMS / Live</div>
            <h1>Live streams.</h1>
            <p>Kelola konten Ngahiji Live: featured video, jadwal, dan status siaran.</p>
          </div>
          <Link className="btn" href="/admin/live/new">Create live stream ↗</Link>
        </div>

        <div className="admin-table media-table" role="table" aria-label="CMS live streams">
          <div className="admin-table-row head" role="row"><span>Title</span><span>Status</span><span>Live</span><span>Scheduled</span><span>Actions</span></div>
          {items.map((item) => (
            <div className="admin-table-row" role="row" key={item.id}>
              <span>
                <strong>{item.title}</strong>
                <small>{item.category} · {item.youtube_video_id}</small>
              </span>
              <span><b className="admin-pill">{item.status}</b></span>
              <span>{item.is_live ? <b className="admin-pill live">LIVE</b> : <span className="muted">off</span>}</span>
              <span>{formatDate(item.scheduled_at)}</span>
              <span className="admin-actions">
                <Link href={`/admin/live/${item.id}`}>Edit</Link>
                <a href={item.youtube_url} target="_blank" rel="noreferrer">Preview</a>
                <form action={toggleLiveStreamIsLiveAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="is_live" value={item.is_live ? 'false' : 'true'} />
                  <button type="submit">{item.is_live ? 'Stop live' : 'Set live'}</button>
                </form>
                <form action={setLiveStreamStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="PUBLISHED" /><button type="submit">Publish</button></form>
                <form action={setLiveStreamStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="DRAFT" /><button type="submit">Unpublish</button></form>
                <form action={setLiveStreamStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="ARCHIVED" /><button type="submit">Archive</button></form>
              </span>
            </div>
          ))}
        </div>

        {!items.length && (
          <div className="emptybox">
            <h2>Belum ada live stream.</h2>
            <p>Tambahkan link YouTube untuk menampilkan Ngahiji Live di homepage.</p>
          </div>
        )}
      </section>
    </main>
  );
}
