import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add security headers and logging proxy
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers (duplicated here for completeness)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Log API calls in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[${request.method}] ${request.nextUrl.pathname}`);
  }

  return response;
}

// Configure which routes to apply proxy to
export const config = {
  matcher: [
    // Apply to all routes except static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
