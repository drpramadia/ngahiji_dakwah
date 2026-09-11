import type { OrderStatus } from '@/lib/payments/qris/types';

type Props = {
  status: OrderStatus;
  rejectionReason?: string | null;
};

const LABELS: Record<OrderStatus, { label: string; tone: 'wait' | 'ok' | 'err' | 'muted' }> = {
  DRAFT: { label: 'Draft', tone: 'muted' },
  PENDING_PAYMENT: { label: 'Menunggu Pembayaran', tone: 'wait' },
  WAITING_VERIFICATION: { label: 'Menunggu Verifikasi Admin', tone: 'wait' },
  PROCESSING: { label: 'Diproses', tone: 'wait' },
  PAID: { label: 'Lunas · Tiket Aktif', tone: 'ok' },
  FAILED: { label: 'Ditolak', tone: 'err' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'err' },
  CANCELLED: { label: 'Dibatalkan', tone: 'muted' },
  REFUNDED: { label: 'Dikembalikan', tone: 'muted' }
};

export default function PaymentStatus({ status, rejectionReason }: Props) {
  const meta = LABELS[status] ?? { label: status, tone: 'muted' as const };
  return (
    <div className={`payment-status payment-status-${meta.tone}`}>
      <span className="payment-status-dot" aria-hidden />
      <div>
        <strong>{meta.label}</strong>
        {status === 'FAILED' && rejectionReason && <small>Alasan: {rejectionReason}</small>}
      </div>
    </div>
  );
}