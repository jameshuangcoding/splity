// Phase 1: passes all requests through — no auth enforcement.
// Phase 2: uncomment the redirect block to gate bill routes behind login.

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Phase 2 enforcement goes here:
  // const supabase = createServerClient(...)
  // const { data: { session } } = await supabase.auth.getSession()
  // if (!session && request.nextUrl.pathname.startsWith('/bill')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
  return NextResponse.next();
}

export const config = {
  matcher: ["/bill/:path*", "/api/bills/:path*"],
};
