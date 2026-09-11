'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadAssetAction } from '@/lib/admin/uploads';
import type { UploadBucket } from '@/lib/admin/upload-types';

type Props = {
  name: string; // hidden input name (e.g. 'image_url')
  bucket: UploadBucket;
  folder?: string;
  defaultValue?: string;
  label?: string;
  required?: boolean;
};

export default function MediaUploader({ name, bucket, folder = '', defaultValue = '', label = 'Cover image', required }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('bucket', bucket);
    if (folder) fd.set('folder', folder);
    startTransition(async () => {
      try {
        const result = await uploadAssetAction(fd);
        setUrl(result.publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload gagal');
      }
    });
  }

  return (
    <div className="media-uploader">
      <span className="uploader-label">{label}</span>
      <div
        className={`uploader-drop${dragOver ? ' drag' : ''}${isPending ? ' pending' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (isPending) return;
          handleFiles(e.dataTransfer.files);
        }}
      >
        {url ? (
          <div className="uploader-preview">
            <img src={url} alt="Preview" />
            <div className="uploader-preview-actions">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={isPending}>Ganti</button>
              <button type="button" onClick={() => setUrl('')} disabled={isPending}>Hapus</button>
            </div>
          </div>
        ) : (
          <button type="button" className="uploader-empty" onClick={() => inputRef.current?.click()} disabled={isPending}>
            <strong>{isPending ? 'Mengunggah…' : 'Drag & drop atau klik untuk upload'}</strong>
            <small>PNG, JPG, WEBP, atau SVG · maks 10 MB · bucket: {bucket}</small>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input type="hidden" name={name} value={url} required={required} readOnly />
      {error && <p className="admin-error" role="alert">{error}</p>}
      {url && (
        <label className="uploader-url">
          <span>URL</span>
          <input type="text" value={url} readOnly onFocus={(e) => e.target.select()} />
        </label>
      )}
    </div>
  );
}