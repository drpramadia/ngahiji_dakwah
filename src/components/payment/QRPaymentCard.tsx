import type { PaymentSettings } from '@/lib/payments/qris/types';

type Props = {
  settings: PaymentSettings;
  totalIdr: number;
  orderId: string;
};

function money(value: number) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
}

export default function QRPaymentCard({ settings, totalIdr, orderId }: Props) {
  return (
    <div className="qr-payment-card">
      <div className="qr-payment-head">
        <div className="eyebrow">{settings.payment_method} · {settings.merchant_name}</div>
        <h2 className="qr-payment-total">{money(totalIdr)}</h2>
        <small>Order #{orderId.slice(0, 8).toUpperCase()}</small>
      </div>
      <div className="qr-payment-image">
        <img src={settings.qr_image_url} alt="QRIS NGAHIJI" />
      </div>
      <ol className="qr-payment-steps">
        {settings.instructions.split(/\n+/).map((line, idx) => {
          const trimmed = line.replace(/^\d+\.\s*/, '').trim();
          if (!trimmed) return null;
          return <li key={idx}>{trimmed}</li>;
        })}
      </ol>
    </div>
  );
}