import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => req.cookies.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Not logged in → redirect to home
  if (!session) {
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return res;
  }

  const role = session.user.user_metadata.role;

  // Broker-only routes
  if (pathname.startsWith("/verifiser") && role !== "broker") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Bidder-only routes
  if (pathname.startsWith("/dashboard") && role === "broker") {
    return NextResponse.redirect(new URL("/verifiser", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/verifiser/:path*"],
};
