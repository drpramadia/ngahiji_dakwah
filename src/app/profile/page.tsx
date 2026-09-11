import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateProfileAction } from './actions';

export const metadata = { title: 'Profil - Ngahiji' };

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, instagram, whatsapp')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(`Gagal membaca profil: ${error.message}`);

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel wide">
        <Link className="pageback" href="/">← Kembali ke website</Link>
        <div className="eyebrow">MY NGAHIJI</div>
        <h1>Profile.</h1>
        <p>Lengkapi data diri untuk event, komunitas, dan komunikasi resmi Ngahiji.</p>
        <form className="admin-form" action={updateProfileAction}>
          <div className="admin-form-grid">
            <label>Nama lengkap<input name="full_name" required maxLength={120} defaultValue={profile?.full_name ?? ''} /></label>
            <label>Email<input value={user.email ?? ''} readOnly /></label>
            <label>Instagram<input name="instagram" pattern="@?[A-Za-z0-9_.]{1,30}" defaultValue={profile?.instagram ?? ''} placeholder="@username" /></label>
            <label>WhatsApp<input name="whatsapp" pattern="[+0-9 ()-]{8,20}" defaultValue={profile?.whatsapp ?? ''} placeholder="08xxxxxxxxxx" /></label>
          </div>
          <button className="btn" type="submit">Simpan profil ↗</button>
        </form>
        <div className="admin-module-grid profile-links">
          <Link className="admin-module" href="/#events"><strong>Events</strong><span>Temukan event berikutnya.</span></Link>
          <Link className="admin-module" href="/#media"><strong>Media</strong><span>Baca artikel dan cerita terbaru.</span></Link>
          <Link className="admin-module" href="/#community"><strong>Community</strong><span>Temukan komunitasmu.</span></Link>
          <Link className="admin-module" href="/admin"><strong>CMS</strong><span>Khusus akun dengan role admin.</span></Link>
        </div>
      </section>
    </main>
  );
}
