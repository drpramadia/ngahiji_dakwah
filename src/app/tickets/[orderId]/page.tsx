import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getTicketsForOrder } from '@/lib/tickets/service';
import { getOrderById } from '@/lib/payments/qris/service';
import TicketCard from '@/components/tickets/TicketCard';

export const metadata = { title: 'Tiket Saya - Ngahiji' };

type Props = { params: Promise<{ orderId: string }> };

export default async function TicketsPage({ params }: Props) {
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/tickets/${orderId}`);

  const order = await getOrderById(orderId);
  if (!order) notFound();
  if (order.buyer_id !== user.id) {
    // Buyer-scoped; admins can still view via /admin.
    return (
      <main className="auth-shell">
        <div className="auth-shell-inner" style={{ width: 'min(700px,100%)' }}>
          <div className="auth-hero"><h1>Tiket tidak tersedia.</h1><p>Kamu tidak memiliki akses ke tiket ini.</p></div>
          <div className="auth-panel-wrap"><Link className="btn" href="/member">Kembali ke Member Area</Link></div>
        </div>
      </main>
    );
  }

  const tickets = await getTicketsForOrder(orderId);

  return (
    <main className="auth-shell">
      <div className="auth-shell-inner" style={{ width: 'min(920px,100%)' }}>
        <Link className="auth-brand" href="/" aria-label="Ngahiji Home">
          <img src="/NGAHIJI_LOGO.png" alt="Ngahiji" />
        </Link>

        <div className="auth-hero">
          <div className="eyebrow">TIKET SAYA</div>
          <h1>{tickets.length > 0 ? `${tickets.length} Tiket siap.` : 'Belum ada tiket.'}</h1>
          <p>
            {order.status === 'PAID'
              ? 'Pembayaran sudah lunas. Tunjukkan QR di pintu masuk event.'
              : order.status === 'WAITING_VERIFICATION'
              ? 'Pembayaran sedang diverifikasi tim NGAHIJI. QR akan muncul di sini setelah approved.'
              : 'Selesaikan pembayaran untuk mendapatkan QR tiket.'}
          </p>
        </div>

        {tickets.length === 0 && order.status !== 'PAID' && (
          <div className="auth-panel-wrap">
            <p>Status order saat ini: <strong>{order.status}</strong></p>
            <Link className="btn" href={`/checkout/${orderId}`}>Buka halaman checkout ↗</Link>
          </div>
        )}

        {tickets.length === 0 && order.status === 'PAID' && (
          <div className="auth-panel-wrap">
            <p>Tiket sedang di-generate. Refresh halaman ini beberapa saat lagi.</p>
          </div>
        )}

        <div className="ticket-list">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>

        <div className="auth-footer">
          <Link href="/member">← Member Area</Link>
          <Link href="/">Kembali ke Beranda ↗</Link>
        </div>
      </div>
    </main>
  );
}
