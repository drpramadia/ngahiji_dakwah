'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function safeSet<T>(setter: (v: T) => void, value: T) {
    if (mountedRef.current) setter(value);
  }

  function onSelect(files: FileList | null) {
    setError(null);
    setStatus(null);
    const f = files?.[0] ?? null;
    setFile(f);
    if (f && f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => safeSet(setPreview, String(reader.result));
      reader.onerror = () => safeSet(setPreview, null);
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
        // revalidatePath in the server action may unmount this component.
        // Guard subsequent state updates to prevent React error #441.
        safeSet(setStatus, 'Bukti pembayaran berhasil diunggah. Tim NGAHIJI akan verifikasi maks. 1x24 jam.');
        safeSet(setFile, null);
        safeSet(setPreview, null);
        if (mountedRef.current && fileRef.current) fileRef.current.value = '';
      } catch (err) {
        safeSet(setError, err instanceof Error ? err.message : 'Upload gagal');
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