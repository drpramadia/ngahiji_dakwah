'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getAuthRedirectUrl } from '@/lib/app-url';

const LINK_STYLE = {
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer',
  justifySelf: 'start'
} as const;

export default function ForgotPasswordForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthRedirectUrl('/auth/reset-password', window.location.origin);
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (authError) throw authError;
      setStatus('Jika email terdaftar, link reset password sudah dikirim. Cek inbox dan folder Spam.');
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : 'Gagal mengirim link reset.';
      setError(/rate.?limit|too.?many|exceed/i.test(raw)
        ? 'Terlalu banyak permintaan email. Coba lagi 5-10 menit.'
        : raw);
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" style={LINK_STYLE} onClick={() => setOpen(true)}>
        Lupa password?
      </button>
    );
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="forgotPasswordEmail">Email terdaftar</label>
      <input
        id="forgotPasswordEmail"
        type="email"
        required
        autoComplete="email"
        placeholder="hello@you.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Mengirim...' : 'Kirim link reset password'}
      </button>
      <button
        type="button"
        className="btn light"
        onClick={() => {
          setOpen(false);
          setStatus(null);
          setError(null);
        }}
      >
        Batal
      </button>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  );
}
