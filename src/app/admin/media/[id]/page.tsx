import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsMediaItemById } from '@/lib/admin/media';
import MediaForm from '../MediaForm';

export const metadata = {
  title: 'Edit Media - Ngahiji CMS'
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditMediaPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const item = await getCmsMediaItemById(id);
  if (!item) notFound();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin/media">← Media</Link>
        <div className="eyebrow">NGAHIJI CMS / Edit Media</div>
        <h1>Edit media.</h1>
        <p>{item.title}</p>
        <MediaForm item={item} />
      </section>
    </main>
  );
}
