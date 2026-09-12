import Link from 'next/link';
import PublicAuthPanel from '@/components/PublicAuthPanel';
import { getCurrentProfile } from '@/lib/auth/server';
import { getRoleRedirect } from '@/lib/auth/shared';
import { signOutPublic } from '@/app/actions/auth';

export const metadata = { title: 'Masuk - Ngahiji' };

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const profile = await getCurrentProfile();

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>

        {profile ? (
          <>
            <div className="auth-hero">
              <div className="eyebrow">MY NGAHIJI</div>
              <h1>Sudah masuk.</h1>
              <p>Login sebagai <strong>{profile.email}</strong> ({profile.role}).</p>
            </div>
            <div className="auth-panel-wrap" style={{ display: 'grid', gap: 10 }}>
              <Link className="btn" href={next || getRoleRedirect(profile.role)}>
                Lanjut ke {profile.role === 'ADMIN' ? 'Admin' : profile.role === 'ORGANIZER' ? 'Organizer' : 'Member Area'} ↗
              </Link>
              <form action={signOutPublic}>
                <button className="btn light" type="submit" style={{ width: '100%' }}>Logout</button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="auth-hero">
              <div className="eyebrow">MY NGAHIJI</div>
              <h1>Masuk dan bertumbuh bersama.</h1>
              <p>Satu akun untuk event, kajian, media, dan komunitas Ngahiji.</p>
            </div>
            <div className="auth-panel-wrap">
              <PublicAuthPanel mode="login" next={next || '/'} />
            </div>
          </>
        )}

        <footer className="auth-footer">
          Dengan bergabung kamu menyetujui aturan komunitas Ngahiji.
          <span><Link href="/">← Kembali ke beranda</Link></span>
        </footer>
      </div>
    </main>
  );
}