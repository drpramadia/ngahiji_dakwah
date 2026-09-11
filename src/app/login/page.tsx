import Link from 'next/link';
import PublicAuthForm from './PublicAuthForm';

export const metadata = { title: 'Masuk - Ngahiji' };

export default function LoginPage() {
  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel">
        <Link className="pageback" href="/">← Kembali ke website</Link>
        <div className="eyebrow">MY NGAHIJI</div>
        <h1>Masuk.</h1>
        <p>Lanjutkan perjalananmu bersama Ngahiji dengan akun yang terhubung ke Supabase Auth.</p>
        <PublicAuthForm mode="login" />
      </section>
    </main>
  );
}
