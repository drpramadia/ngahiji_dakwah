import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRoleRedirect } from '@/lib/auth/shared';
import { updateProfileAction } from './actions';
import { signOutPublic } from '@/app/actions/auth';

export const metadata = { title: 'Profil - Ngahiji' };

function money(value: number) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_PAYMENT: 'Menunggu pembayaran',
  WAITING_VERIFICATION: 'Menunggu verifikasi',
  PROCESSING: 'Diproses',
  PAID: 'Lunas',
  FAILED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Dikembalikan'
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in: show CTA to join
  if (!user) {
    return (
      <main className="auth-shell">
        <div className="auth-shell-inner">
          <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
            <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
          </Link>
          <div className="auth-hero">
            <div className="eyebrow">MY NGAHIJI</div>
            <h1>Gabung Ngahiji untuk<br />menyimpan perjalananmu.</h1>
            <p>Simpan event favorit, kelola tiket, dan bergabung dengan komunitas.</p>
          </div>
          <div className="auth-panel-wrap" style={{ display: 'grid', gap: 10 }}>
            <Link className="btn" href="/join?next=/profile">JOIN NGAHIJI ↗</Link>
            <Link className="btn light" href="/login?next=/profile">Sudah punya akun · Masuk</Link>
          </div>
          <footer className="auth-footer">
            Dengan bergabung kamu menyetujui aturan komunitas Ngahiji.
            <span><Link href="/">← Kembali ke beranda</Link></span>
          </footer>
        </div>
      </main>
    );
  }

  // Logged in: full profile
  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, avatar_url, role, instagram, whatsapp').eq('id', user.id).maybeSingle(),
    supabase
      .from('orders')
      .select('id, status, total_idr, subtotal_idr, created_at, event:events(title, slug, starts_at, city), items:order_items(quantity, ticket:ticket_types(name))')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  type EventRel = { title: string; slug: string; starts_at: string; city: string };
  type OrderRow = {
    id: string;
    status: string;
    total_idr: number | null;
    subtotal_idr: number;
    created_at: string;
    event: EventRel | EventRel[] | null;
    items: { quantity: number; ticket: { name: string } | { name: string }[] | null }[] | null;
  };
  const rows = (orders ?? []) as unknown as OrderRow[];
  const pick = <T,>(rel: T | T[] | null | undefined): T | null => (!rel ? null : Array.isArray(rel) ? rel[0] ?? null : rel);

  const role = profile?.role ?? 'MEMBER';
  const homeHref = getRoleRedirect(role as 'MEMBER' | 'ORGANIZER' | 'ADMIN' | 'GUEST');

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner" style={{ width: 'min(900px,100%)' }}>
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>

        <div className="auth-hero">
          <div className="eyebrow">MY PROFILE</div>
          <h1>Halo{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
          <p>Kelola profil, tiket, dan aktivitasmu di Ngahiji.</p>
        </div>

        <div className="auth-panel-wrap">
          <div className="member-profile">
            {profile?.avatar_url ? (
              <img className="member-avatar" src={profile.avatar_url} alt="Avatar" />
            ) : (
              <div className="member-avatar member-avatar-empty">{(profile?.full_name?.[0] || user.email?.[0] || 'N').toUpperCase()}</div>
            )}
            <div>
              <span className="member-label">Email</span>
              <strong>{profile?.email ?? user.email}</strong>
            </div>
            <div>
              <span className="member-label">Role</span>
              <strong>{role}</strong>
            </div>
          </div>

          <form className="admin-form" action={updateProfileAction} style={{ marginTop: 20 }}>
            <div className="admin-form-grid">
              <label>Nama lengkap<input name="full_name" required maxLength={120} defaultValue={profile?.full_name ?? ''} placeholder="Nama kamu" /></label>
              <label>Instagram<input name="instagram" pattern="@?[A-Za-z0-9_.]{1,30}" defaultValue={profile?.instagram ?? ''} placeholder="@username" /></label>
              <label>WhatsApp<input name="whatsapp" pattern="[+0-9 ()-]{8,20}" defaultValue={profile?.whatsapp ?? ''} placeholder="08xxxxxxxxxx" /></label>
            </div>
            <button className="btn" type="submit">Simpan profil ↗</button>
          </form>
        </div>

        <section>
          <h2 style={{ fontSize: 24, margin: '20px 0 12px' }}>Tiket &amp; Event Saya ({rows.length})</h2>
          {rows.length === 0 && (
            <div className="auth-panel-wrap">
              <p>Belum ada event yang kamu ikuti. <Link href="/#events" style={{ textDecoration: 'underline' }}>Lihat event terbaru →</Link></p>
            </div>
          )}
          <div className="member-orders">
            {rows.map((o) => {
              const ev = pick(o.event);
              const firstItem = o.items?.[0] ?? null;
              const ticket = pick(firstItem?.ticket);
              return (
                <Link key={o.id} className="member-order" href={`/checkout/${o.id}`}>
                  <div>
                    <div className="eyebrow">{STATUS_LABEL[o.status] ?? o.status}</div>
                    <strong>{ev?.title ?? '(event tidak ditemukan)'}</strong>
                    <small>{ev?.city} · {fmtDate(ev?.starts_at ?? null)}</small>
                  </div>
                  <div className="member-order-side">
                    <span>{firstItem?.quantity ?? 0} × {ticket?.name ?? 'Tiket'}</span>
                    <strong>{money(o.total_idr ?? o.subtotal_idr)}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="auth-footer">
          <span>
            <Link href={homeHref} style={{ textDecoration: 'underline' }}>
              {role === 'ADMIN' ? '→ Admin Dashboard' : role === 'ORGANIZER' ? '→ Organizer' : '→ My Ngahiji'}
            </Link>
          </span>
          <form action={signOutPublic}>
            <button className="btn light" type="submit">Logout</button>
          </form>
        </footer>
      </div>
    </main>
  );
}