import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized - Ngahiji Admin'
};

export default function UnauthorizedPage() {
  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel">
        <Link className="pageback" href="/">← Kembali ke website</Link>
        <div className="eyebrow">403 / UNAUTHORIZED</div>
        <h1>Akses belum tersedia.</h1>
        <p>Akun ini sudah login, tetapi belum memiliki role admin/organizer yang diperlukan di Supabase.</p>
      </section>
    </main>
  );
}
