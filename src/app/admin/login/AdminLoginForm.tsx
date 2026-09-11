'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getAuthRedirectUrl } from '@/lib/app-url';

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

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthRedirectUrl('/admin', window.location.origin);
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false }
      });
      if (authError) throw authError;
      setStatus('Magic link dikirim. Buka email untuk masuk ke dashboard admin.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengirim magic link.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="adminEmail">Email admin</label>
      <input
        id="adminEmail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="admin@ngahiji.id"
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Mengirim magic link...' : 'Kirim Magic Link'}
      </button>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="notice">Hanya akun terdaftar di <code>organizer_members</code> yang bisa mengakses dashboard. shouldCreateUser=false.</p>
    </form>
  );
}