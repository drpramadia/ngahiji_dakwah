'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getAuthRedirectUrl } from '@/lib/app-url';

type Props = {
  next?: string;
};

export default function PasswordSignupForm({ next = '/' }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthRedirectUrl(next, window.location.origin);
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: fullName.trim() }
        }
      });
      if (authError) throw authError;
      if (data.session) {
        router.refresh();
        router.push(next);
        return;
      }
      setStatus('Akun dibuat. Cek inbox email kamu dan klik link konfirmasi, lalu masuk dengan password.');
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : 'Pendaftaran gagal.';
      if (/already (been )?registered|already exists/i.test(raw)) {
        setError('Email ini sudah terdaftar. Masuk dengan password atau kirim ulang OTP.');
      } else if (/rate.?limit|too.?many|exceed/i.test(raw)) {
        setError('Terlalu banyak permintaan email. Coba lagi 5-10 menit atau gunakan OTP.');
      } else {
        setError(raw);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="signupFullName">Nama lengkap</label>
      <input
        id="signupFullName"
        type="text"
        required
        autoComplete="name"
        placeholder="Nama kamu"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <label htmlFor="signupEmail">Email</label>
      <input
        id="signupEmail"
        type="email"
        required
        autoComplete="email"
        placeholder="hello@you.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="signupPassword">Password (min. 8 karakter)</label>
      <input
        id="signupPassword"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label htmlFor="signupPasswordConfirm">Konfirmasi password</label>
      <input
        id="signupPasswordConfirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Membuat akun...' : 'Daftar dengan Password'}
      </button>
      <p className="notice">Konfirmasi email wajib diklik sebelum akun bisa dipakai. Kalau email tidak masuk, cek folder Spam.</p>
      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  );
}
