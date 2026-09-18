import Link from 'next/link';
import AdminLoginForm from './AdminLoginForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Admin Login - Ngahiji'
};

export default function AdminLoginPage() {
  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel">
        <Link className="pageback" href="/">← Kembali ke website</Link>
        <div className="eyebrow">NGAHIJI CMS</div>
        <h1>Admin login.</h1>
        <p>Masuk dengan email dan password admin Supabase. Setelah login, akses tetap membutuhkan role admin di <code>organizer_members</code>.</p>
        <AdminLoginForm />
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
