import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR', 'CHECKIN_OPERATOR', 'SPONSOR_MANAGER', 'ORGANIZER']);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextRaw = requestUrl.searchParams.get('next') ?? '/';
  // Only accept internal paths as next target.
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin));
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.redirect(new URL('/login?error=session_not_established', requestUrl.origin));
  }

  // If the user is heading to an admin route, verify authorization now
  // so we do not send unauthorized users deep into the admin shell.
  if (next === '/admin' || next.startsWith('/admin/')) {
    const { data: memberships, error: memberError } = await supabase
      .from('organizer_members')
      .select('role')
      .eq('user_id', userData.user.id);

    if (memberError) {
      return NextResponse.redirect(new URL(`/admin/unauthorized?reason=${encodeURIComponent(memberError.message)}`, requestUrl.origin));
    }

    const hasAdmin = (memberships ?? []).some((m) => ADMIN_ROLES.has(String(m.role)));
    if (!hasAdmin) {
      return NextResponse.redirect(new URL('/admin/unauthorized', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
