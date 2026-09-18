import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth/server';
import { isAdminRole } from '@/lib/auth/shared';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = { title: 'Atur Ulang Password - Ngahiji' };

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login?error=recovery_required');
  }

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>

        <div className="auth-hero">
          <div className="eyebrow">MY NGAHIJI</div>
          <h1>Atur password baru.</h1>
          <p>Halo <strong>{profile.full_name || profile.email}</strong>, buat password baru untuk akun kamu.</p>
        </div>

        <div className="auth-panel-wrap">
          <ResetPasswordForm next={next} isAdmin={isAdminRole(profile.role)} />
        </div>

        <footer className="auth-footer">
          Setelah password baru tersimpan, kamu bisa masuk kapan saja dengan email + password.
          <span><Link href="/login">← Kembali ke login</Link></span>
        </footer>
      </div>
    </main>
  );
}
