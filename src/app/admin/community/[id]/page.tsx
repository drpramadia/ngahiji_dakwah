import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsCommunityById } from '@/lib/admin/communities';
import CommunityForm from '../CommunityForm';

export const metadata = {
  title: 'Edit Community - Ngahiji CMS'
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCommunityPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const community = await getCmsCommunityById(id);
  if (!community) notFound();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin/community">← Community</Link>
        <div className="eyebrow">NGAHIJI CMS / Edit Community</div>
        <h1>Edit community.</h1>
        <p>{community.name}</p>
        <CommunityForm community={community} />
      </section>
    </main>
  );
}
