// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  // Supabase SSR stores session cookies with names like "sb-...".
  // If no relevant cookie exists, we can skip auth.getUser() to avoid a network call.
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") ||
        c.name === "supabase-auth-token" ||
        c.name === "sb-access-token" ||
        c.name === "sb-refresh-token"
    );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Guests: let them through without touching Supabase Auth.
  if (!hasSupabaseAuthCookie(request)) return response;

  const supabase = createServerClient(
    mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Must await so Supabase can refresh the session and write Set-Cookie.
  try {
    await supabase.auth.getUser();
  } catch {
    // If Supabase is temporarily unavailable, do not block navigation.
  }

  return response;
}

export const config = {
  // Only run middleware on routes that actually benefit from session refresh.
  matcher: ["/me/:path*", "/admin/:path*", "/teachers/:path*"],
};
