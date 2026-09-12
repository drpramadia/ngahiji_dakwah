'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Sign out untuk konteks publik (member, profile, login, join).
 * Selalu redirect ke homepage.
 */
export async function signOutPublic() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}