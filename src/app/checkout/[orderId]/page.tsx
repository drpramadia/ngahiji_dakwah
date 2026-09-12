import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import QRPaymentCard from '@/components/payment/QRPaymentCard';
import PaymentProofUpload from '@/components/payment/PaymentProofUpload';
import PaymentStatus from '@/components/payment/PaymentStatus';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getActivePaymentSettings, getOrderById } from '@/lib/payments/qris/service';

type Props = {
  params: Promise<{ orderId: string }>;
};

export const metadata = { title: 'Pembayaran - Ngahiji' };

export default async function CheckoutPage({ params }: Props) {
  const { orderId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout/${orderId}`);

  const order = await getOrderById(orderId);
  if (!order) notFound();
  if (order.buyer_id !== user.id) redirect('/');

  const [{ data: eventData }, { data: itemData }, settings] = await Promise.all([
    supabase.from('events').select('title, slug, city, starts_at').eq('id', order.event_id).maybeSingle(),
    supabase.from('order_items').select('quantity, unit_price_idr, ticket:ticket_types(name)').eq('order_id', orderId).maybeSingle(),
    getActivePaymentSettings()
  ]);

  const ticketName = (itemData as { ticket?: { name?: string } | null } | null)?.ticket?.name ?? 'Tiket';
  const quantity = itemData?.quantity ?? 1;

  const uploaded = Boolean(order.payment_proof_url);
  const isFinal = order.status === 'PAID' || order.status === 'FAILED' || order.status === 'CANCELLED' || order.status === 'REFUNDED';

  return (
    <main className="public-detail">
      <div className="wrap">
        <Link className="pageback" href="/">← Kembali ke Ngahiji</Link>
        <div className="checkout-layout">
          <section className="checkout-info">
            <div className="eyebrow">Pembayaran</div>
            <h1>{eventData?.title ?? 'Event'}</h1>
            <p className="checkout-meta">{quantity} × {ticketName} · {eventData?.city}</p>
            <PaymentStatus status={order.status} rejectionReason={order.rejection_reason} />
            {settings && !isFinal && (
              <QRPaymentCard settings={settings} totalIdr={order.total_idr ?? order.subtotal_idr} orderId={order.id} />
            )}
            {!settings && !isFinal && (
              <div className="admin-error">Metode pembayaran QRIS belum dikonfigurasi. Hubungi admin.</div>
            )}
          </section>
          <aside className="checkout-side">
            {order.status === 'PAID' && (
              <div className="admin-status">
                <strong>Pembayaran terverifikasi.</strong><br />
                Tiket kamu aktif. Klik tombol di bawah untuk melihat &amp; download QR tiket.
                <div style={{ marginTop: 12 }}>
                  <Link className="btn lime" href={`/tickets/${order.id}`}>Buka tiket saya ↗</Link>
                </div>
              </div>
            )}
            {order.status === 'FAILED' && (
              <div className="admin-error">
                Pembayaran ditolak. Silakan hubungi admin atau buat order baru.
              </div>
            )}
            {!isFinal && (
              <>
                <h3>Upload Bukti Pembayaran</h3>
                {uploaded && order.status === 'WAITING_VERIFICATION' && (
                  <p className="admin-status">Bukti sudah diunggah, menunggu verifikasi admin (maks. 1x24 jam).</p>
                )}
                <PaymentProofUpload orderId={order.id} disabled={order.status !== 'PENDING_PAYMENT' && order.status !== 'WAITING_VERIFICATION'} />
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}