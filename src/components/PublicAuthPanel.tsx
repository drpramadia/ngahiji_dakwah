'use client';

import { useState } from 'react';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import EmailOTPForm from '@/components/auth/EmailOTPForm';
import WhatsappOTPForm from '@/components/auth/WhatsappOTPForm';

type AuthMethod = 'google' | 'email' | 'whatsapp';

type Props = {
  mode?: 'login' | 'join';
  next?: string;
};

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';
const PHONE_ENABLED = process.env.NEXT_PUBLIC_AUTH_PHONE_ENABLED === 'true';

export default function PublicAuthPanel({ next = '/' }: Props) {
  // mode reserved for future differentiation between login and join copy;
  // currently the same method picker is used for both flows.
  const methods: { key: AuthMethod; label: string; show: boolean }[] = [
    { key: 'email', label: 'Email OTP', show: true },
    { key: 'google', label: 'Google', show: GOOGLE_ENABLED },
    { key: 'whatsapp', label: 'WhatsApp', show: PHONE_ENABLED }
  ];
  const visible = methods.filter((m) => m.show);
  const [method, setMethod] = useState<AuthMethod>(visible[0]?.key ?? 'email');

  return (
    <div className="public-auth-panel">
      <div className="auth-methods" role="tablist" aria-label="Metode autentikasi Ngahiji">
        {visible.map((m) => (
          <button
            key={m.key}
            type="button"
            className={method === m.key ? 'selected' : ''}
            onClick={() => setMethod(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'google' && GOOGLE_ENABLED && <GoogleLoginButton next={next} />}
      {method === 'email' && <EmailOTPForm next={next} />}
      {method === 'whatsapp' && PHONE_ENABLED && <WhatsappOTPForm next={next} />}

      {!GOOGLE_ENABLED && !PHONE_ENABLED && (
        <p className="notice">Google &amp; WhatsApp login belum aktif. Gunakan Email OTP untuk sementara.</p>
      )}
    </div>
  );
}