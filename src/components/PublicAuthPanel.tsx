'use client';

import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import EmailOTPForm from '@/components/auth/EmailOTPForm';
import WhatsappOTPForm from '@/components/auth/WhatsappOTPForm';
import PasswordLoginForm from '@/components/auth/PasswordLoginForm';
import PasswordSignupForm from '@/components/auth/PasswordSignupForm';

type Props = {
  mode?: 'login' | 'join';
  next?: string;
};

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';
const PHONE_ENABLED = process.env.NEXT_PUBLIC_AUTH_PHONE_ENABLED === 'true';

export default function PublicAuthPanel({ mode = 'login', next = '/' }: Props) {
  return (
    <div className="public-auth-panel">
      {GOOGLE_ENABLED && (
        <>
          <GoogleLoginButton next={next} />
          <div className="auth-divider"><span>atau lanjut dengan email</span></div>
        </>
      )}

      {mode === 'join' ? (
        <PasswordSignupForm next={next} />
      ) : (
        <PasswordLoginForm next={next} />
      )}

      <div className="auth-divider">
        <span>{mode === 'join' ? 'atau daftar via OTP / magic link' : 'atau masuk via OTP / magic link'}</span>
      </div>
      <EmailOTPForm next={next} />

      {PHONE_ENABLED && (
        <>
          <div className="auth-divider"><span>atau via WhatsApp</span></div>
          <WhatsappOTPForm next={next} />
        </>
      )}

      {!GOOGLE_ENABLED && !PHONE_ENABLED && (
        <p className="notice">Google &amp; WhatsApp login belum aktif. Gunakan password atau Email OTP.</p>
      )}
    </div>
  );
}
