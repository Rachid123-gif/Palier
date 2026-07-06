import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, decodeSession } from "./lib/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? decodeSession(token) : null;

  // Public routes — always accessible
  if (pathname === "/bienvenue" || pathname.startsWith("/_next") || pathname.startsWith("/icon") || pathname === "/manifest.webmanifest") {
    // If already authenticated and visiting /bienvenue, redirect to home
    if (pathname === "/bienvenue" && session) {
      const dest = session.role === "syndic" ? "/syndic" : "/";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // No session → redirect to onboarding
  if (!session) {
    return NextResponse.redirect(new URL("/bienvenue", request.url));
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
