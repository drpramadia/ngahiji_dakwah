'use client';

import { useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type TicketOption = {
  id: string;
  name: string;
  price_idr: number;
};

type Props = {
  eventId: string;
  eventTitle: string;
  ticket: TicketOption;
  defaultBuyer?: {
    full_name?: string;
    email?: string;
    whatsapp?: string;
    instagram?: string;
  };
};

const MIN_QTY = 1;
const MAX_QTY = 5;

type Person = {
  full_name: string;
  email: string;
  whatsapp: string;
  instagram: string;
};

const empty = (): Person => ({ full_name: '', email: '', whatsapp: '', instagram: '' });

function money(value: number) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
}

function clampQty(raw: string | number): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Math.floor(raw);
  if (!Number.isFinite(n) || n < MIN_QTY) return MIN_QTY;
  if (n > MAX_QTY) return MAX_QTY;
  return n;
}

export default function EventRegistrationForm({ eventId, eventTitle, ticket, defaultBuyer }: Props) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(1);
  const [buyer, setBuyer] = useState<Person>({
    full_name: defaultBuyer?.full_name ?? '',
    email: defaultBuyer?.email ?? '',
    whatsapp: defaultBuyer?.whatsapp ?? '',
    instagram: defaultBuyer?.instagram ?? ''
  });
  const [attendees, setAttendees] = useState<Person[]>([empty()]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = ticket.price_idr * quantity;

  function onQtyChange(e: ChangeEvent<HTMLInputElement>) {
    const next = clampQty(e.target.value);
    setQuantity(next);
    setAttendees((prev) => {
      if (prev.length === next) return prev;
      if (next > prev.length) {
        return [...prev, ...Array.from({ length: next - prev.length }, empty)];
      }
      return prev.slice(0, next);
    });
  }

  function onQtyBlur(e: ChangeEvent<HTMLInputElement>) {
    // If user cleared the field, snap back to 1 on blur.
    if (e.target.value === '') setQuantity(MIN_QTY);
  }

  function bumpQty(delta: number) {
    const next = clampQty(quantity + delta);
    setQuantity(next);
    setAttendees((prev) => {
      if (prev.length === next) return prev;
      if (next > prev.length) return [...prev, ...Array.from({ length: next - prev.length }, empty)];
      return prev.slice(0, next);
    });
  }

  function updateAttendee(index: number, field: keyof Person, value: string) {
    setAttendees((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function updateBuyer(field: keyof Person, value: string) {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedAttendees = attendees.slice(0, quantity);
    for (let i = 0; i < trimmedAttendees.length; i++) {
      const a = trimmedAttendees[i];
      if (!a.full_name.trim()) return setError(`Nama peserta ${i + 1} wajib diisi`);
      if (!a.email.trim()) return setError(`Email peserta ${i + 1} wajib diisi`);
      if (!a.whatsapp.trim()) return setError(`WhatsApp peserta ${i + 1} wajib diisi`);
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            ticket_type_id: ticket.id,
            quantity,
            buyer,
            attendees: trimmedAttendees
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login?next=/#events');
            return;
          }
          throw new Error(data.error || 'Checkout gagal');
        }
        router.push(data.redirect || `/checkout/${data.orderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout gagal');
      }
    });
  }

  return (
    <>
      <div className="eyebrow">Registration</div>
      <h2>Good things start with a hello.</h2>
      <p>{eventTitle} · {quantity} peserta · <strong>{money(total)}</strong></p>

      <form onSubmit={onSubmit} className="registration-form">
        <label htmlFor="quantity">Jumlah peserta (1-5)</label>
        <div className="qty-stepper">
          <button type="button" onClick={() => bumpQty(-1)} aria-label="Kurangi peserta" disabled={quantity <= MIN_QTY}>−</button>
          <input
            id="quantity"
            type="number"
            inputMode="numeric"
            min={MIN_QTY}
            max={MAX_QTY}
            step={1}
            value={quantity}
            onChange={onQtyChange}
            onBlur={onQtyBlur}
          />
          <button type="button" onClick={() => bumpQty(1)} aria-label="Tambah peserta" disabled={quantity >= MAX_QTY}>+</button>
        </div>

        <h3>Data pembeli</h3>
        <div className="attendee-grid">
          <label>Nama lengkap<input required maxLength={120} value={buyer.full_name} onChange={(e) => updateBuyer('full_name', e.target.value)} placeholder="Nama kamu" /></label>
          <label>Email<input required type="email" value={buyer.email} onChange={(e) => updateBuyer('email', e.target.value)} placeholder="hello@you.com" /></label>
          <label>WhatsApp<input required pattern="[+0-9 ()-]{8,20}" value={buyer.whatsapp} onChange={(e) => updateBuyer('whatsapp', e.target.value)} placeholder="08xxxxxxxxxx" /></label>
          <label>Instagram<input value={buyer.instagram} onChange={(e) => updateBuyer('instagram', e.target.value)} placeholder="@username" /></label>
        </div>

        <h3>Data peserta</h3>
        {attendees.slice(0, quantity).map((a, index) => (
          <fieldset className="attendee-block" key={index}>
            <legend>Peserta {index + 1}</legend>
            <div className="attendee-grid">
              <label>Nama lengkap<input required value={a.full_name} onChange={(e) => updateAttendee(index, 'full_name', e.target.value)} placeholder="Nama peserta" /></label>
              <label>Email<input required type="email" value={a.email} onChange={(e) => updateAttendee(index, 'email', e.target.value)} placeholder="email@peserta.com" /></label>
              <label>WhatsApp<input required pattern="[+0-9 ()-]{8,20}" value={a.whatsapp} onChange={(e) => updateAttendee(index, 'whatsapp', e.target.value)} placeholder="08xxxxxxxxxx" /></label>
              <label>Instagram<input value={a.instagram} onChange={(e) => updateAttendee(index, 'instagram', e.target.value)} placeholder="@username" /></label>
            </div>
          </fieldset>
        ))}

        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="registration-cta">
          <div><small>Total</small><strong>{money(total)}</strong></div>
          <button className="btn lime" type="submit" disabled={isPending}>
            {isPending ? 'Memproses...' : 'Lanjut ke Pembayaran ↗'}
          </button>
        </div>
      </form>
    </>
  );
}