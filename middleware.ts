// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // ✅ 必须 await：让 Supabase 有机会刷新 session 并把 Set-Cookie 写进 response
  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase 临时不可达时不阻塞页面（按游客渲染）
  }

  return response;
}
// middleware.ts 底部
export const config = {
  matcher: ["/me/:path*", "/admin/:path*", "/teachers/:path*"],
};


export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
