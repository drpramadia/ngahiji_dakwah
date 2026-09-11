import Link from 'next/link';
import PublicAuthPanel from '@/components/PublicAuthPanel';
import { getCurrentProfile } from '@/lib/auth/server';
import { getRoleRedirect } from '@/lib/auth/shared';
import { signOutAdmin } from '@/app/admin/actions';

export const metadata = { title: 'Join Ngahiji' };

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function JoinPage({ searchParams }: Props) {
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
              <h1>Kamu sudah masuk.</h1>
              <p>Login sebagai <strong>{profile.email}</strong> ({profile.role}). Lanjutkan ke areamu atau logout untuk daftar dengan akun lain.</p>
            </div>
            <div className="auth-panel-wrap" style={{ display: 'grid', gap: 10 }}>
              <Link className="btn" href={next || getRoleRedirect(profile.role)}>
                Lanjut ke {profile.role === 'ADMIN' ? 'Admin' : profile.role === 'ORGANIZER' ? 'Organizer' : 'Member Area'} ↗
              </Link>
              <form action={signOutAdmin}>
                <button className="btn light" type="submit" style={{ width: '100%' }}>Logout &amp; daftar akun lain</button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="auth-hero">
              <div className="eyebrow">JOIN NGAHIJI</div>
              <h1>Let&apos;s Ngahiji.</h1>
              <p>Buat akun Ngahiji untuk bergabung dengan event, kajian, dan komunitas.</p>
            </div>
            <div className="auth-panel-wrap">
              <PublicAuthPanel mode="join" next={next || '/member'} />
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