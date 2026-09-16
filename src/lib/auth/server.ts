import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminRole, type Profile } from '@/lib/auth/shared';

const PROFILE_COLUMNS = 'id, full_name, email, phone, avatar_url, provider, role';

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userData.user.id)
      .maybeSingle();
    if (error) return null;
    return (data as Profile | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Viewer context for public navigation: profile plus a real organizer
 * membership check (organizer_members), not just the profiles.role column.
 */
export async function getViewerContext(): Promise<{ profile: Profile | null; isAdmin: boolean }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { profile: null, isAdmin: false };

    const [profileRes, memberRes] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userData.user.id).maybeSingle(),
      supabase.from('organizer_members').select('role').eq('user_id', userData.user.id)
    ]);

    const profile = (profileRes.data as Profile | null) ?? null;
    const isAdmin = !memberRes.error && (memberRes.data ?? []).some((m) => isAdminRole(String(m.role)));
    return { profile, isAdmin };
  } catch {
    return { profile: null, isAdmin: false };
  }
}