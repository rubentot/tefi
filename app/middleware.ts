import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value; },
        set(name, value, options) { res.cookies.set(name, value, options); },
        remove(name, options) { res.cookies.delete({ name, ...options }); },  // Fixed: Pass single object
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getSession();

  // Optional: Role-based redirect logic
  const { data: { user } } = await supabase.auth.getUser();
  if (req.nextUrl.pathname.startsWith('/verifiser')) {
    if (!user || user.user_metadata?.role !== 'broker') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', // Match all except static files
  ],
};