import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOutAdmin } from '@/app/admin/actions';

export const metadata = {
  title: 'Unauthorized - Ngahiji Admin'
};

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function UnauthorizedPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel">
        <Link className="pageback" href="/">← Kembali ke website</Link>
        <div className="eyebrow">403 / UNAUTHORIZED</div>
        <h1>Akses belum tersedia.</h1>
        {user ? (
          <p>Akun <strong>{user.email}</strong> (ID <code>{user.id}</code>) sudah login, tetapi belum memiliki role admin/organizer di tabel <code>organizer_members</code>.</p>
        ) : (
          <p>Kamu belum login. Kembali ke halaman admin login.</p>
        )}
        {reason && <p className="admin-error" role="alert">Detail: {reason}</p>}
        <div className="admin-login-form">
          {user && (
            <form action={signOutAdmin}>
              <button className="btn" type="submit">Logout</button>
            </form>
          )}
          <Link className="btn light" href="/admin/login">Kembali ke admin login</Link>
        </div>
        <p className="notice">Kalau kamu yakin ini akun admin, jalankan SQL berikut di Supabase (ganti UUID dengan ID kamu):<br /><code>insert into public.organizer_members (organizer_id, user_id, role) values (&#39;YOUR_ORG_ID&#39;, &#39;YOUR_USER_ID&#39;, &#39;SUPER_ADMIN&#39;);</code></p>
      </section>
    </main>
  );
}