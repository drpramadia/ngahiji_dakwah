import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/auth/shared';

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