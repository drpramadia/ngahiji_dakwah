'use client';

type Props = {
  url: string | null;
  filename: string | null;
};

/**
 * Inline thumbnail preview for payment proof.
 * - Image (png/jpg/webp): render 60x60 <img>, click to open full.
 * - PDF or missing url: show icon + text link.
 */
export default function PaymentProofThumb({ url, filename }: Props) {
  if (!url) {
    return <small className="muted">— belum upload</small>;
  }
  const isPdf = (filename || '').toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="proof-thumb pdf"
        title="Buka PDF bukti pembayaran"
      >
        📄 PDF
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="proof-thumb"
      title="Klik untuk buka ukuran penuh"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Bukti pembayaran" />
    </a>
  );
}
