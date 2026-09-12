import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOutPublic } from '@/app/actions/auth';

export const metadata = { title: 'Member Area - Ngahiji' };

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

export default async function MemberPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/member');

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, avatar_url, role').eq('id', user.id).maybeSingle(),
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

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner" style={{ width: 'min(900px,100%)' }}>
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>

        <div className="auth-hero">
          <div className="eyebrow">MEMBER AREA</div>
          <h1>Halo{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
          <p>Kelola tiket, event, dan aktivitasmu di Ngahiji.</p>
        </div>

        <div className="auth-panel-wrap">
          <div className="member-profile">
            <div>
              <span className="member-label">Email</span>
              <strong>{profile?.email ?? user.email}</strong>
            </div>
            <div>
              <span className="member-label">Role</span>
              <strong>{profile?.role ?? 'MEMBER'}</strong>
            </div>
            <Link className="btn light" href="/profile">Edit profil</Link>
          </div>
        </div>

        <section>
          <h2 style={{ fontSize: 24, margin: '20px 0 12px' }}>Tiket & Event Saya ({rows.length})</h2>
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
          <span>Kamu masuk sebagai <strong>{user.email}</strong></span>
          <form action={signOutPublic}>
            <button className="btn light" type="submit">Logout</button>
          </form>
        </footer>
      </div>
    </main>
  );
}