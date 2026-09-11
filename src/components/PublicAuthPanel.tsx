'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { getAuthRedirectUrl } from '@/lib/app-url';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type AuthMode = 'login' | 'join';
type AuthMethod = 'google' | 'email' | 'phone' | 'account' | 'password';

type Props = {
  mode: AuthMode;
};

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';
const PHONE_ENABLED = process.env.NEXT_PUBLIC_AUTH_PHONE_ENABLED === 'true';

function redirectToProfile() {
  return getAuthRedirectUrl('/profile', window.location.origin);
}

export default function PublicAuthPanel({ mode: initialMode }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<AuthMethod>(initialMode === 'join' ? 'account' : 'password');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setStatus(null);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Proses autentikasi gagal.');
    } finally {
      setPending(false);
    }
  }

  async function googleAuth() {
    await run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectToProfile() }
      });
      if (authError) throw authError;
    });
  }

  async function emailMagic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectToProfile(),
          shouldCreateUser: mode === 'join'
        }
      });
      if (authError) throw authError;
      setStatus(mode === 'join'
        ? 'Link bergabung sudah dikirim. Buka email untuk melanjutkan ke profil Ngahiji.'
        : 'Link masuk sudah dikirim. Buka email untuk melanjutkan ke profil Ngahiji.');
    });
  }

  async function requestPhoneOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({ phone });
      if (authError) throw authError;
      setPhoneOtpSent(true);
      setStatus('Kode OTP sudah diminta melalui provider phone/WhatsApp yang aktif di Supabase.');
    });
  }

  async function verifyPhoneOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (authError) throw authError;
      router.refresh();
      router.push('/profile');
    });
  }

    async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectToProfile(),
          data: { full_name: fullName }
        }
      });
      if (authError) throw authError;
      setStatus('Akun sudah dibuat. Jika konfirmasi email aktif, cek inbox untuk melanjutkan.');
    });
  }

  async function passwordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.refresh();
      router.push('/profile');
    });
  }

    const loginMethods: { key: AuthMethod; label: string; show: boolean }[] = [
    { key: 'password', label: 'Password', show: true },
    { key: 'email', label: 'Magic Link', show: true },
    { key: 'google', label: 'Google', show: GOOGLE_ENABLED },
    { key: 'phone', label: 'WhatsApp', show: PHONE_ENABLED }
  ];
  const joinMethods: { key: AuthMethod; label: string; show: boolean }[] = [
    { key: 'account', label: 'Email + Password', show: true },
    { key: 'email', label: 'Magic Link', show: true },
    { key: 'google', label: 'Google', show: GOOGLE_ENABLED },
    { key: 'phone', label: 'WhatsApp', show: PHONE_ENABLED }
  ];
  const activeMethods = mode === 'login' ? loginMethods : joinMethods;

  function switchMode(next: AuthMode) {
    setMode(next);
    setMethod(next === 'join' ? 'account' : 'password');
    setStatus(null);
    setError(null);
  }

  return (
    <div className="public-auth-panel">
      <div className="auth-mode-toggle" role="tablist" aria-label="Login atau daftar">
        <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => switchMode('login')}>Masuk</button>
        <button type="button" className={mode === 'join' ? 'selected' : ''} onClick={() => switchMode('join')}>Daftar</button>
      </div>
      <div className="auth-methods" role="tablist" aria-label="Metode autentikasi Ngahiji">
        {activeMethods.filter((m) => m.show).map((m) => (
          <button key={m.key} type="button" className={method === m.key ? 'selected' : ''} onClick={() => setMethod(m.key)}>{m.label}</button>
        ))}
      </div>

      {method === 'password' && <form className="admin-login-form" onSubmit={passwordLogin}><label htmlFor="loginEmail">Email</label><input id="loginEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="hello@you.com" /><label htmlFor="loginPassword">Password</label><input id="loginPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="current-password" /><button className="btn" type="submit" disabled={pending}>{pending ? 'Memeriksa...' : 'Masuk'}</button></form>}

      {method === 'google' && GOOGLE_ENABLED && <div className="admin-login-form"><button className="btn" type="button" onClick={googleAuth} disabled={pending}>{pending ? 'Menghubungkan...' : 'Lanjut dengan Google'}</button><p className="notice">Google OAuth harus aktif di konfigurasi Supabase Auth.</p></div>}

      {method === 'email' && <form className="admin-login-form" onSubmit={emailMagic}><label htmlFor="authEmail">Email</label><input id="authEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="hello@you.com" /><button className="btn" type="submit" disabled={pending}>{pending ? 'Mengirim...' : mode === 'join' ? 'Kirim link bergabung' : 'Kirim link masuk'}</button></form>}

      {method === 'phone' && !phoneOtpSent && <form className="admin-login-form" onSubmit={requestPhoneOtp}><label htmlFor="authPhone">Nomor WhatsApp / phone</label><input id="authPhone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" placeholder="+628xxxxxxxxxx" /><button className="btn" type="submit" disabled={pending}>{pending ? 'Mengirim...' : 'Kirim OTP'}</button><p className="notice">OTP phone/WhatsApp bergantung pada provider yang dikonfigurasi di Supabase.</p></form>}

      {method === 'phone' && phoneOtpSent && <form className="admin-login-form" onSubmit={verifyPhoneOtp}><label htmlFor="authOtp">Kode OTP</label><input id="authOtp" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} required minLength={6} maxLength={6} placeholder="123456" /><button className="btn" type="submit" disabled={pending}>{pending ? 'Memeriksa...' : 'Verifikasi OTP'}</button><button type="button" className="btn light" onClick={() => setPhoneOtpSent(false)}>Ganti nomor</button></form>}

      {method === 'account' && <form className="admin-login-form" onSubmit={createAccount}><label htmlFor="authName">Nama lengkap</label><input id="authName" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" placeholder="Nama kamu" /><label htmlFor="signupEmail">Email</label><input id="signupEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="hello@you.com" /><label htmlFor="signupPassword">Password</label><input id="signupPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /><button className="btn" type="submit" disabled={pending}>{pending ? 'Membuat akun...' : 'Buat akun Ngahiji'}</button></form>}

      {status && <p className="admin-status">{status}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  );
}
