'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password
    });

    setPending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setStatus('Login berhasil. Membuka dashboard admin...');
    router.refresh();
    router.push('/admin');
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="adminIdentifier">Email / username admin</label>
      <input id="adminIdentifier" type="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="username" placeholder="admin@ngahiji.id" />
      <label htmlFor="adminPassword">Password</label>
      <input id="adminPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Memeriksa...' : 'Login ke CMS'}</button>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="notice">Gunakan akun admin yang dibuat di Supabase Auth. Login berhasil tetap harus lolos RBAC server-side di `organizer_members`.</p>
    </form>
  );
}
