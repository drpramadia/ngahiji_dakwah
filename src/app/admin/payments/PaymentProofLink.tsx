'use client';

import { useState, useTransition } from 'react';
import { getSignedProofUrl } from '@/lib/payments/qris/actions';

type Props = { path: string };

export default function PaymentProofLink({ path }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    startTransition(async () => {
      try {
        const url = await getSignedProofUrl(path);
        if (!url) throw new Error('Signed URL gagal');
        window.open(url, '_blank', 'noreferrer');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal membuka bukti');
      }
    });
  }

  return (
    <>
      <button className="btn light" type="button" onClick={open} disabled={pending}>
        {pending ? 'Membuka...' : 'Lihat Bukti'}
      </button>
      {error && <small style={{ color: '#a93222' }}>{error}</small>}
    </>
  );
}