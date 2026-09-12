'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { scanTicketAction, type CheckInResult } from './actions';

type Props = {
  eventId?: string;
};

const SCANNER_ELEMENT_ID = 'ngahiji-qr-scanner';

type LibHandle = {
  html5Qrcode: unknown;
  scanner: {
    start: (
      cameraIdOrConfig: string | { facingMode: 'environment' | 'user' },
      config: { fps: number; qrbox: { width: number; height: number } },
      onDecoded: (text: string) => void,
      onError: (err: string) => void
    ) => Promise<void>;
    stop: () => Promise<void>;
    clear: () => void;
  };
};

export default function QrScanner({ eventId }: Props) {
  const [active, setActive] = useState(false);
  const [manual, setManual] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const libRef = useRef<LibHandle | null>(null);
  const lastScanRef = useRef<{ payload: string; at: number } | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScanner().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    setError(null);
    setResult(null);
    try {
      // Dynamic import to keep SSR clean
      const mod = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode;
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      libRef.current = { html5Qrcode: Html5Qrcode, scanner: scanner as unknown as LibHandle['scanner'] };

      await libRef.current.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => onDecoded(decodedText),
        () => { /* per-frame decode errors are noisy; ignore */ }
      );
      setActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera tidak dapat diakses. Pastikan izinkan kamera & pakai HTTPS.');
      libRef.current = null;
    }
  }

  async function stopScanner() {
    try {
      if (libRef.current?.scanner) {
        await libRef.current.scanner.stop();
        libRef.current.scanner.clear();
      }
    } finally {
      libRef.current = null;
      setActive(false);
    }
  }

  function onDecoded(text: string) {
    // Debounce: same payload within 3 seconds → ignore (kamera re-decodes frame)
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.payload === text && now - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { payload: text, at: now };
    submit(text);
  }

  function submit(qr: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await scanTicketAction({ qr, eventId });
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scan gagal');
      }
    });
  }

  function submitManual() {
    const v = manual.trim();
    if (!v) return;
    submit(v);
    setManual('');
  }

  const toneClass = result
    ? result.status === 'VALID'
      ? 'scan-ok'
      : result.status === 'ALREADY_USED'
      ? 'scan-warn'
      : 'scan-err'
    : '';

  return (
    <div className="qr-scanner">
      <div className="qr-scanner-view">
        <div id={SCANNER_ELEMENT_ID} className={`qr-scanner-camera${active ? ' active' : ''}`} />
        {!active && (
          <div className="qr-scanner-placeholder">
            <strong>Kamera nonaktif</strong>
            <small>Klik &quot;Aktifkan kamera&quot; untuk mulai scan QR tiket. Butuh HTTPS + izin kamera.</small>
          </div>
        )}
      </div>

      <div className="qr-scanner-controls">
        {!active ? (
          <button type="button" className="btn lime" onClick={startScanner}>Aktifkan kamera ▶</button>
        ) : (
          <button type="button" className="btn light" onClick={stopScanner}>Stop kamera ■</button>
        )}
      </div>

      <details className="qr-scanner-manual">
        <summary>Input manual (kalau kamera bermasalah)</summary>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="NGAHIJI:xxxx:xxxx atau paste hasil scan"
            style={{ flex: 1, minHeight: 42, fontFamily: 'monospace', fontSize: 12 }}
          />
          <button className="btn" type="button" onClick={submitManual} disabled={isPending || !manual.trim()}>Verify</button>
        </div>
      </details>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {isPending && <div className="admin-status">Memverifikasi...</div>}
      {result && !isPending && (
        <div className={`scan-result ${toneClass}`} role="status" aria-live="polite">
          <div className="scan-result-head">
            <strong>{result.message}</strong>
            <span>{new Date(result.scanned_at).toLocaleTimeString('id-ID')}</span>
          </div>
          {result.attendee_name && (
            <dl className="scan-result-meta">
              <div><dt>Peserta</dt><dd>{result.attendee_name}</dd></div>
              {result.ticket_name && <div><dt>Tiket</dt><dd>{result.ticket_name}</dd></div>}
              {result.event_title && <div><dt>Event</dt><dd>{result.event_title}</dd></div>}
              {result.ticket_id && <div><dt>Kode</dt><dd className="mono">{result.ticket_id.slice(0, 8).toUpperCase()}</dd></div>}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
