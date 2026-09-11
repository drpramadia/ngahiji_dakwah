import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsCommunities } from '@/lib/admin/communities';
import { setCommunityStatusAction } from './actions';

export const metadata = {
  title: 'Community - Ngahiji CMS'
};

export default async function AdminCommunityPage() {
  await requireAdmin();
  const communities = await getCmsCommunities();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <div className="admin-page-head">
          <div>
            <Link className="pageback" href="/admin">← Dashboard</Link>
            <div className="eyebrow">NGAHIJI CMS / Community</div>
            <h1>Community.</h1>
            <p>Kelola kategori komunitas yang tampil di public section Find your people.</p>
          </div>
          <Link className="btn" href="/admin/community/new">Create community ↗</Link>
        </div>
        <div className="admin-table community-table" role="table" aria-label="CMS communities">
          <div className="admin-table-row head" role="row"><span>Community</span><span>Status</span><span>Visual</span><span>Order</span><span>Actions</span></div>
          {communities.map((community) => (
            <div className="admin-table-row" role="row" key={community.id}>
              <span><strong>{community.name}</strong><small>{community.slug} · {community.description}</small></span>
              <span><b className="admin-pill">{community.status}</b></span>
              <span><b className="communityicon" style={{ background: community.color }}>{community.mark}</b></span>
              <span>{community.sort_order}</span>
              <span className="admin-actions">
                <Link href={`/admin/community/${community.id}`}>Edit</Link>
                <Link href="/#community">Preview</Link>
                <form action={setCommunityStatusAction}><input type="hidden" name="id" value={community.id} /><input type="hidden" name="status" value="PUBLISHED" /><button type="submit">Publish</button></form>
                <form action={setCommunityStatusAction}><input type="hidden" name="id" value={community.id} /><input type="hidden" name="status" value="DRAFT" /><button type="submit">Unpublish</button></form>
                <form action={setCommunityStatusAction}><input type="hidden" name="id" value={community.id} /><input type="hidden" name="status" value="ARCHIVED" /><button type="submit">Archive</button></form>
              </span>
            </div>
          ))}
        </div>
        {!communities.length && <div className="emptybox"><h2>Belum ada community.</h2><p>Buat community pertama untuk menampilkan kategori setelah dipublish.</p></div>}
      </section>
    </main>
  );
}
