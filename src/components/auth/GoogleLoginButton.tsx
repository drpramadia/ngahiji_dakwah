'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getAuthRedirectUrl } from '@/lib/app-url';

type Props = {
  next?: string;
  disabled?: boolean;
};

export default function GoogleLoginButton({ next = '/', disabled }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthRedirectUrl(next, window.location.origin);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (authError) throw authError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google login gagal.');
      setPending(false);
    }
  }

  return (
    <div className="auth-provider-block">
      <button type="button" className="btn light auth-google" onClick={signIn} disabled={pending || disabled}>
        <span className="auth-google-icon" aria-hidden>G</span>
        {pending ? 'Menghubungkan Google...' : 'Continue with Google'}
      </button>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  );
}