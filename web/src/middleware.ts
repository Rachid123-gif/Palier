import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, decodeSession } from "./lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await decodeSession(token) : null;

  // ── CSRF protection for mutations ──
  // Block non-GET/HEAD/OPTIONS requests from foreign origins
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: "csrf_rejected" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "csrf_rejected" }, { status: 403 });
      }
    }
  }

  // Public routes — always accessible
  if (pathname === "/bienvenue" || pathname === "/site" || pathname.startsWith("/_next") || pathname.startsWith("/icon") || pathname === "/manifest.webmanifest" || pathname === "/sw.js") {
    // If already authenticated and visiting /bienvenue, redirect to home
    if (pathname === "/bienvenue" && session) {
      const dest = session.role === "syndic" ? "/syndic" : "/";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // API routes — require valid session (except internal server-to-server)
  if (pathname.startsWith("/api/")) {
    // Dev-login bypass (disabled in production by the route itself)
    if (pathname === "/api/dev-login") return NextResponse.next();
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const requestSecret = request.headers.get("x-internal-secret");
    if (internalSecret && requestSecret === internalSecret) {
      return NextResponse.next(); // Internal server-to-server call
    }
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // No session → redirect to landing page
  if (!session) {
    return NextResponse.redirect(new URL("/site", request.url));
  }

  // Syndic routes require syndic role
  if (pathname.startsWith("/syndic") && session.role !== "syndic") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Resident routes — syndic users trying to access resident pages redirect to /syndic
  if (!pathname.startsWith("/syndic") && session.role === "syndic") {
    return NextResponse.redirect(new URL("/syndic", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.svg$).*)"],
};
