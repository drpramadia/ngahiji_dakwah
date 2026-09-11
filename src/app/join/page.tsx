import Link from 'next/link';
import { redirect } from 'next/navigation';
import PublicAuthPanel from '@/components/PublicAuthPanel';
import { getCurrentProfile } from '@/lib/auth/server';
import { getRoleRedirect } from '@/lib/auth/shared';

export const metadata = { title: 'Join Ngahiji' };

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function JoinPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const profile = await getCurrentProfile();
  if (profile) redirect(next || getRoleRedirect(profile.role));

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>
        <div className="auth-hero">
          <div className="eyebrow">JOIN NGAHIJI</div>
          <h1>Let&apos;s Ngahiji.</h1>
          <p>Buat akun Ngahiji untuk bergabung dengan event, kajian, dan komunitas.</p>
        </div>
        <div className="auth-panel-wrap">
        <PublicAuthPanel mode="join" next={next || '/member'} />
        </div>
        <footer className="auth-footer">
          Dengan bergabung kamu menyetujui aturan komunitas Ngahiji.
          <span>
            <Link href="/">← Kembali ke beranda</Link>
          </span>
        </footer>
      </div>
    </main>
  );
}