// lib/supabase.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * ✅ 给 Server Components 用（page.tsx / layout.tsx）
 * 只能读 cookies，不能写 cookies，否则 Next 会报：
 * Cookies can only be modified in a Server Action or Route Handler
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // ⛔️ Server Components 里不能 set cookies：这里必须是 no-op
      },
    },
  });
}

/**
 * ✅ 给 Server Actions / Route Handlers 用（actions.ts / route.ts）
 * 允许写 cookies（refresh token / sign in/out 都需要）
 */
export function createSupabaseServerActionClient() {
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
