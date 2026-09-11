'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { normalizeIndonesianPhone } from '@/lib/auth/shared';

type Props = {
  next?: string;
};

export default function WhatsappOTPForm({ next = '/' }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [phone, setPhone] = useState('');
  const [normalized, setNormalized] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    const e164 = normalizeIndonesianPhone(phone);
    if (!e164) {
      setError('Format nomor tidak valid. Contoh: 081234567890 atau +6281234567890');
      return;
    }
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: e164 });
      if (authError) throw authError;
      setNormalized(e164);
      setStatus(`Kode OTP dikirim ke ${e164} via WhatsApp/SMS`);
      setStep('verify');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengirim OTP.');
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalized) return;
    setPending(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: code.trim(),
        type: 'sms'
      });
      if (authError) throw authError;
      router.refresh();
      router.push(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Verifikasi gagal.');
    } finally {
      setPending(false);
    }
  }

  if (step === 'input') {
    return (
      <form className="admin-login-form" onSubmit={sendOtp}>
        <label htmlFor="authPhoneInput">Nomor WhatsApp</label>
        <input
          id="authPhoneInput"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+62 812 3456 7890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Mengirim OTP...' : 'Kirim OTP'}
        </button>
        <p className="notice">Format Indonesia: 08xx atau +62. Provider (Twilio Verify / WhatsApp Business) harus aktif di Supabase.</p>
        {status && <p className="admin-status">{status}</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <form className="admin-login-form" onSubmit={verifyOtp}>
      <p className="admin-status">Kode dikirim ke <strong>{normalized}</strong></p>
      <label htmlFor="authPhoneCode">Kode OTP (6 digit)</label>
      <input
        id="authPhoneCode"
        inputMode="numeric"
        required
        minLength={6}
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
      </button>
      <button type="button" className="btn light" onClick={() => { setStep('input'); setCode(''); setNormalized(null); setError(null); }}>
        Ganti nomor
      </button>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  );
}