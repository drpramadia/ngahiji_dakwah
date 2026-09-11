import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/server';

export const metadata = { title: 'Organizer - Ngahiji' };

export default async function OrganizerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/organizer');
  if (profile.role === 'ADMIN') redirect('/admin');
  if (profile.role !== 'ORGANIZER') redirect('/');

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner">
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>
        <div className="auth-hero">
          <div className="eyebrow">ORGANIZER SPACE</div>
          <h1>Coming soon.</h1>
          <p>Dashboard organizer sedang disiapkan. Sementara ini, hubungi tim Ngahiji untuk kolaborasi event.</p>
        </div>
        <footer className="auth-footer">
          Kamu masuk sebagai <strong>{profile.full_name || profile.email}</strong> ({profile.role}).
          <span><Link href="/">← Kembali ke beranda</Link></span>
        </footer>
      </div>
    </main>
  );
}