import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import CommunityForm from '../CommunityForm';

export const metadata = {
  title: 'Create Community - Ngahiji CMS'
};

export default async function NewCommunityPage() {
  await requireAdmin();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin/community">← Community</Link>
        <div className="eyebrow">NGAHIJI CMS / Create Community</div>
        <h1>Create community.</h1>
        <p>Community baru disimpan ke Supabase dan tampil di public UI setelah dipublish.</p>
        <CommunityForm />
      </section>
    </main>
  );
}
