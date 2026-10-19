import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Layer 1: a fast, cookie-only check. NOT security; the layouts do the real check.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/seeker/:path*", "/employer/:path*", "/admin/:path*"],
};