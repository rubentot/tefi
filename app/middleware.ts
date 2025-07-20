import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) return NextResponse.redirect(new URL('/', req.url));
    if (session.user.user_metadata.role === "broker") {
      return NextResponse.redirect(new URL('/verifiser', req.url));
    }
  }
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};