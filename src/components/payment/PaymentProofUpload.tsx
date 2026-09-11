'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadPaymentProofAction } from '@/lib/payments/qris/actions';

type Props = {
  orderId: string;
  disabled?: boolean;
};

export default function PaymentProofUpload({ orderId, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function onSelect(files: FileList | null) {
    setError(null);
    setStatus(null);
    const f = files?.[0] ?? null;
    setFile(f);
    if (f && f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(String(reader.result));
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  function submit() {
    if (!file) {
      setError('Pilih file bukti pembayaran terlebih dahulu');
      return;
    }
    const fd = new FormData();
    fd.set('order_id', orderId);
    fd.set('file', file);
    startTransition(async () => {
      try {
        await uploadPaymentProofAction(fd);
        setStatus('Bukti pembayaran berhasil diunggah. Tim NGAHIJI akan verifikasi maks. 1x24 jam.');
        setFile(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload gagal');
      }
    });
  }

  return (
    <div className="proof-upload">
      <label className="proof-drop">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => onSelect(e.target.files)}
          disabled={disabled || isPending}
        />
        {preview ? (
          <img src={preview} alt="Preview bukti pembayaran" />
        ) : (
          <span className="proof-drop-empty">
            <strong>Upload bukti pembayaran</strong>
            <small>PNG / JPG / WEBP / PDF · maks 8 MB</small>
          </span>
        )}
      </label>
      {file && !isPending && (
        <p className="proof-file">Terpilih: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)</p>
      )}
      <button type="button" className="btn lime" onClick={submit} disabled={disabled || isPending || !file}>
        {isPending ? 'Mengunggah...' : 'Kirim Bukti & Selesai'}
      </button>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  );
}