import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ADMIN_ROLES, isAdminRole } from '@/lib/auth/shared';

export type AdminRole = (typeof ADMIN_ROLES)[number];

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) redirect('/admin/login');

  const { data: memberships, error: roleError } = await supabase
    .from('organizer_members')
    .select('organizer_id, role')
    .eq('user_id', user.id);

  if (roleError) throw new Error(`Unable to verify admin permissions: ${roleError.message}`);

  const roles = (memberships ?? []).filter((membership) => isAdminRole(String(membership.role)));
  if (!roles.length) redirect('/admin/unauthorized');

  return { user, roles };
}
