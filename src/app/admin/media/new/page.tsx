import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import MediaForm from '../MediaForm';

export const metadata = {
  title: 'Create Media - Ngahiji CMS'
};

export default async function NewMediaPage() {
  await requireAdmin();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin/media">← Media</Link>
        <div className="eyebrow">NGAHIJI CMS / Create Media</div>
        <h1>Create media.</h1>
        <p>Media baru disimpan ke Supabase dan tampil di public UI setelah dipublish.</p>
        <MediaForm />
      </section>
    </main>
  );
}
