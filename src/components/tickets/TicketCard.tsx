'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { TicketView } from '@/lib/tickets/service';

function fmtDateTime(iso: string | null) {
  if (!iso) return 'Tanggal diumumkan';
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
  }) + ' WIB';
}

export default function TicketCard({ ticket }: { ticket: TicketView }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(ticket.qr_payload, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#17181a', light: '#ffffff' }
    })
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'QR render gagal'); });
    // Also render onto canvas for high-DPI download.
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, ticket.qr_payload, {
        width: 640,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#17181a', light: '#ffffff' }
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [ticket.qr_payload]);

  function download() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngahiji-tiket-${ticket.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const used = ticket.check_in_status === 'CHECKED_IN';

  return (
    <article className={`ticket-card${used ? ' used' : ''}`}>
      <header className="ticket-card-head">
        <div>
          <div className="eyebrow">TIKET NGAHIJI</div>
          <h2>{ticket.event_title}</h2>
          <p>{ticket.event_venue}{ticket.event_city ? ` · ${ticket.event_city}` : ''}</p>
          <p><strong>{fmtDateTime(ticket.event_starts_at)}</strong></p>
        </div>
        <span className={`ticket-status${used ? ' used' : ''}`}>
          {used ? 'SUDAH DIPAKAI' : 'AKTIF'}
        </span>
      </header>

      <div className="ticket-card-body">
        <div className="ticket-qr">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR Code Tiket" />
          ) : error ? (
            <p className="admin-error">{error}</p>
          ) : (
            <p className="muted">Membuat QR...</p>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <dl className="ticket-meta">
          <div><dt>Nama peserta</dt><dd>{ticket.attendee_name}</dd></div>
          <div><dt>Jenis tiket</dt><dd>{ticket.ticket_name}</dd></div>
          <div><dt>Email</dt><dd>{ticket.attendee_email || '—'}</dd></div>
          {ticket.attendee_whatsapp && <div><dt>WhatsApp</dt><dd>{ticket.attendee_whatsapp}</dd></div>}
          <div><dt>Kode tiket</dt><dd className="mono">{ticket.id.slice(0, 8).toUpperCase()}</dd></div>
        </dl>
      </div>

      <footer className="ticket-card-foot">
        <button type="button" className="btn light" onClick={download} disabled={!dataUrl}>Download QR ↓</button>
        <small>Tunjukkan QR ini di pintu masuk event. Jangan bagikan ke orang lain.</small>
      </footer>
    </article>
  );
}
