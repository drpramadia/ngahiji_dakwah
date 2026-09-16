import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ADMIN_ROLES, resolvePostLoginTarget } from '@/lib/auth/shared';

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
    return NextResponse.redirect(new URL(`/login?error=session_not_established`, requestUrl.origin));
  }

  // Role-aware landing: membership is needed to authorize admin routes and
  // to pick the default landing page when no explicit `next` was requested.
  const targetsAdminRoute = next === '/admin' || next.startsWith('/admin/');
  let isAdmin = false;

  if (next === '/' || targetsAdminRoute) {
    const { data: memberships, error: memberError } = await supabase
      .from('organizer_members')
      .select('role')
      .eq('user_id', userData.user.id);

    if (memberError && targetsAdminRoute) {
      return NextResponse.redirect(new URL(`/admin/unauthorized?reason=${encodeURIComponent(memberError.message)}`, requestUrl.origin));
    }

    isAdmin = (memberships ?? []).some((m) => (ADMIN_ROLES as readonly string[]).includes(String(m.role)));
    if (targetsAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/admin/unauthorized', requestUrl.origin));
    }
  }

  const target = resolvePostLoginTarget(nextRaw, isAdmin);
  return NextResponse.redirect(new URL(target, requestUrl.origin));
}
