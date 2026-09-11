'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminLoginForm() {
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
    const redirectTo = `${window.location.origin}/auth/callback?next=/admin`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });

    setPending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setStatus('Link login admin sudah diminta. Cek email yang terdaftar di Supabase Auth.');
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="adminEmail">Email admin</label>
      <input id="adminEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="admin@ngahiji.id" />
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Mengirim...' : 'Kirim link login'}</button>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="notice">Akses admin tetap diperiksa server-side melalui Supabase Auth dan RBAC. Email login saja tidak memberi izin admin.</p>
    </form>
  );
}
