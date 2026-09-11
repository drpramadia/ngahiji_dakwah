'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Profile, ProfileRole } from '@/lib/auth/shared';

export type UseAuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: ProfileRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAuth(): UseAuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, provider, role')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) await fetchProfile(data.session.user.id);
    else setProfile(null);
  }, [fetchProfile]);

  useEffect(() => {
    let alive = true;
    const supabase = createSupabaseBrowserClient();

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      if (data.session?.user) await fetchProfile(data.session.user.id);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      setSession(nextSession);
      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    signOut,
    refresh
  };
}