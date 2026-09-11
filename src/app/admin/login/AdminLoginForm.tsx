'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (authError) throw authError;
      router.refresh();
      router.push('/admin');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login gagal.');
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
        placeholder="admin@ngahiji.com"
      />
      <label htmlFor="adminPassword">Password</label>
      <input
        id="adminPassword"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        minLength={6}
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Memeriksa...' : 'Login ke CMS'}
      </button>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="notice">Login langsung dengan password Supabase. Otorisasi role dicek server-side di <code>organizer_members</code> setelah masuk.</p>
    </form>
  );
}