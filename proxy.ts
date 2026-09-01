import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  isPublicPath,
  canRead,
} from "@/lib/permission";

// Coarse request-level guard (defence in depth).
//
// NOTE: This runs before rendering. It is NOT the only protection — every
// route that needs it also enforces its own check via lib/guards.ts (server
// components + server actions), as recommended by the Next.js docs. Proxy
// here handles the fast, first-line redirect for unauth'd / unauthorised
// visits.

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static + API + auth plumbing: let these through untouched.
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Public pages (e.g. /register) never require a session here.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const actor = token
    ? {
        isSuperAdmin: !!(token as any).isSuperAdmin,
        permissions: ((token as any).permissions as any) || {},
      }
    : null;

  // Not signed in (or token invalid/expired) -> send to the login screen at "/".
  // "/" itself is the login screen (rendered by AppShell when unauthenticated),
  // so routing to it must not bounce back here (which would loop forever).
  if (!token) {
    if (pathname === "/") {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Signed in but this page is not readable for this user -> back to dashboard.
  if (!canRead(pathname, actor)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all page routes but skip API, static assets, image
     * optimization and misc metadata files.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
