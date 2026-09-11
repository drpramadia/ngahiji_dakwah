'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Props = {
  mode: 'login' | 'join';
};

export default function PublicAuthForm({ mode }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/profile`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: mode === 'join'
      }
    });

    setPending(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setStatus(mode === 'join'
      ? 'Link bergabung sudah dikirim. Buka email untuk melanjutkan ke profil Ngahiji.'
      : 'Link masuk sudah dikirim. Buka email untuk melanjutkan ke profil Ngahiji.');
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="publicEmail">Email</label>
      <input id="publicEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="hello@you.com" />
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Mengirim...' : mode === 'join' ? 'Join Ngahiji' : 'Masuk'}</button>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="notice">Akun memakai Supabase Auth. Profil Ngahiji dapat dilengkapi setelah login.</p>
    </form>
  );
}
