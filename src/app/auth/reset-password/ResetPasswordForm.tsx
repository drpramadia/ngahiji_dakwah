'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { resolvePostLoginTarget } from '@/lib/auth/shared';

type Props = {
  next?: string;
  isAdmin: boolean;
};

export default function ResetPasswordForm({ next, isAdmin }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      router.refresh();
      router.push(resolvePostLoginTarget(next, isAdmin));
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : 'Gagal mengubah password.';
      if (/recovery|not.?allowed|invalid claim|recent login|security reasons/i.test(raw)) {
        setError('Sesi reset password tidak berlaku atau sudah kedaluwarsa. Minta link baru lewat "Lupa password?" di halaman login.');
      } else {
        setError(raw);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label htmlFor="resetNewPassword">Password baru (min. 8 karakter)</label>
      <input
        id="resetNewPassword"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label htmlFor="resetNewPasswordConfirm">Konfirmasi password baru</label>
      <input
        id="resetNewPasswordConfirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Menyimpan...' : 'Simpan Password Baru'}
      </button>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  );
}
