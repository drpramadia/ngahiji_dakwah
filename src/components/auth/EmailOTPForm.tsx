'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getAuthRedirectUrl } from '@/lib/app-url';

type Props = {
  next?: string;
};

export default function EmailOTPForm({ next = '/' }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthRedirectUrl(next, window.location.origin);
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
      });
      if (authError) throw authError;
      setStatus('Kode OTP dikirim ke email. Cek inbox atau klik magic link.');
      setStep('verify');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengirim OTP.');
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'email'
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
        <label htmlFor="authEmailInput">Email</label>
        <input
          id="authEmailInput"
          type="email"
          required
          autoComplete="email"
          placeholder="hello@you.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Mengirim...' : 'Kirim OTP / Magic Link'}
        </button>
        {status && <p className="admin-status">{status}</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <form className="admin-login-form" onSubmit={verifyOtp}>
      <p className="admin-status">Kode dikirim ke <strong>{email}</strong></p>
      <label htmlFor="authEmailCode">Kode OTP (6 digit)</label>
      <input
        id="authEmailCode"
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
      <button type="button" className="btn light" onClick={() => { setStep('input'); setCode(''); setError(null); }}>
        Ganti email
      </button>
      <p className="notice">Atau klik magic link di email kamu untuk masuk otomatis.</p>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  );
}