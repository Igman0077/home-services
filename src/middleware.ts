import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

const BLOCKED_PATH_PREFIXES = [
  "/.env",
  "/wp-admin",
  "/wp-login",
  "/phpmyadmin",
  "/.git",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    BLOCKED_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // Light rate limits on hot public APIs
  if (
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/auth/register")
  ) {
    const ip = clientIpFromHeaders(request.headers);
    const limit =
      pathname.startsWith("/api/auth/register")
        ? { limit: 10, windowMs: 60 * 60 * 1000 }
        : { limit: 60, windowMs: 60 * 1000 };
    const result = checkRateLimit({
      key: `${pathname}:${ip}`,
      ...limit,
    });
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSeconds),
          },
        },
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-path", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
