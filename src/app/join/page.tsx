import Link from 'next/link';
import PublicAuthForm from '../login/PublicAuthForm';

export const metadata = { title: 'Join Ngahiji - Ngahiji' };

export default function JoinPage() {
  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel">
        <Link className="pageback" href="/">← Kembali ke website</Link>
        <div className="eyebrow">JOIN NGAHIJI</div>
        <h1>Let's Ngahiji.</h1>
        <p>Buat akun Ngahiji dan lengkapi profil untuk mengikuti event, media, dan komunitas.</p>
        <PublicAuthForm mode="join" />
      </section>
    </main>
  );
}
