'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

type Props = {
  next?: string;
};

export default function PasswordLoginForm({ next = '/' }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(next);
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : 'Login gagal.';
      if (/invalid login credentials|invalid email or password/i.test(raw)) {
        setError('Email atau password salah. Akun yang dibuat lewat OTP/Google mungkin belum punya password — pakai OTP atau atur password lewat "Lupa password?".');
      } else if (/rate.?limit|too.?many|exceed/i.test(raw)) {
        setError('Terlalu banyak percobaan. Coba lagi 5-10 menit atau gunakan OTP.');
      } else {
        setError(raw);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <label htmlFor="loginEmail">Email</label>
        <input
          id="loginEmail"
          type="email"
          required
          autoComplete="email"
          placeholder="hello@you.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="loginPassword">Password</label>
        <input
          id="loginPassword"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Memeriksa...' : 'Masuk dengan Password'}
        </button>
        {error && <p className="admin-error" role="alert">{error}</p>}
      </form>
      <ForgotPasswordForm />
    </>
  );
}
