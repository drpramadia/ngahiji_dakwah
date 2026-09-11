import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getCmsOrders } from '@/lib/admin/ticketing';

function money(value: number) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
}

export const metadata = { title: 'Orders - Ngahiji CMS' };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getCmsOrders();

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel admin-section-panel wide">
        <Link className="pageback" href="/admin">← Dashboard</Link>
        <div className="eyebrow">NGAHIJI CMS / Orders</div>
        <h1>Orders.</h1>
        <p>Order data dibaca dari Supabase. Payment provider belum aktif, jadi tidak ada transaksi palsu yang dibuat.</p>
        <div className="admin-table" role="table" aria-label="Orders">
          <div className="admin-table-row head"><span>Order</span><span>Status</span><span>Event</span><span>Total</span><span>Created</span></div>
          {orders.map((order) => <div className="admin-table-row" key={order.id}><span><strong>{order.id}</strong></span><span><b className="admin-pill">{order.status}</b></span><span>{order.events?.title ?? 'Event unavailable'}</span><span>{money(order.total_idr)}</span><span>{new Date(order.created_at).toLocaleString('id-ID')}</span></div>)}
        </div>
        {!orders.length && <div className="emptybox"><h2>Belum ada order.</h2><p>Order production akan muncul setelah registration dan checkout server-side aktif.</p></div>}
      </section>
    </main>
  );
}
