"use client";

// app/login/page.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, signUpWithEmailAndPassword } from "@/lib/actions";

type LoginPageProps = {
  searchParams?: {
    message?: string;
    error?: string;
    redirectTo?: string;
    mode?: string; // "signin" | "signup"
  };
};

type Mode = "signin" | "signup";

function Alert({ kind, text }: { kind: "error" | "message"; text: string }) {
  const base = "w-full rounded-lg border px-4 py-3 text-sm leading-5";
  const cls =
    kind === "error"
      ? `${base} border-red-300 bg-red-50 text-red-800`
      : `${base} border-emerald-300 bg-emerald-50 text-emerald-900`;
  return <div className={cls}>{text}</div>;
}

/**
 * ✅ 防 open-redirect：只允许站内相对路径
 * - 必须以 "/" 开头
 * - 不能以 "//" 开头（协议相对）
 * - 不能包含 "://"
 */
function sanitizeRedirectTo(value: string | undefined, fallback = "/teachers") {
  const v = (value ?? "").trim();
  if (!v) return fallback;
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//")) return fallback;
  if (v.includes("://")) return fallback;
  return v;
}

function pickMode(searchParams?: LoginPageProps["searchParams"]): Mode {
  const modeRaw = (searchParams?.mode ?? "").toLowerCase();
  if (modeRaw === "signup" || modeRaw === "register") return "signup";
  if (modeRaw === "signin" || modeRaw === "login") return "signin";

  const error = (searchParams?.error ?? "").toLowerCase();
  // 这些错误更像是注册流程产生的
  if (error.includes("do not match") || error.includes("match") || error.includes("at least 8")) return "signup";

  return "signin";
}

/**
 * 表单提交“立即响应”的关键：给用户一个 pending UI。
 * 我们不用 useFormStatus（它需要拆出 Client Component），
 * 直接用 onSubmit + 本地 pending 状态，保证单文件可用。
 */
function useSubmitPending() {
  const [pending, setPending] = React.useState(false);

  const onSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;

    // 若浏览器校验不通过，不进入 pending（避免“点了没提交却一直转”）
    if (!form.checkValidity()) {
      // 触发浏览器提示
      form.reportValidity?.();
      setPending(false);
      return;
    }
    setPending(true);
  }, []);

  // 如果 server action 返回到同一页并展示 error/message，页面会重新渲染，pending 会自然重置（刷新组件状态）
  return { pending, onSubmit, setPending };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const router = useRouter();

  const message = searchParams?.message;
  const error = searchParams?.error;

  const redirectTo = sanitizeRedirectTo(searchParams?.redirectTo, "/teachers");

  const initialMode = pickMode(searchParams);
  const [mode, setMode] = React.useState<Mode>(initialMode);

  // ✅ tab 切换：立刻切换 UI，同时仅用 replace 同步 URL（不触发整页跳转等待）
  const setModeAndSyncUrl = React.useCallback(
    (nextMode: Mode) => {
      setMode(nextMode);
      const href = `/login?mode=${encodeURIComponent(nextMode)}&redirectTo=${encodeURIComponent(redirectTo)}`;
      router.replace(href, { scroll: false });
    },
    [router, redirectTo]
  );

  const signin = useSubmitPending();
  const signup = useSubmitPending();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Rate My Teacher</h1>
            <p className="mt-2 text-sm text-neutral-600">BASIS International School Park Lane Harbor (High School)</p>
            <p className="mt-3 text-sm text-neutral-700">Viewing is public. Posting reviews requires sign in.</p>
            <p className="mt-1 text-sm font-medium text-neutral-800">
              Only internal email addresses (<span className="font-mono">@basischina.com</span>) are allowed.
            </p>
          </div>

          <div className="mb-6 space-y-3">
            {error ? <Alert kind="error" text={error} /> : null}
            {message ? <Alert kind="message" text={message} /> : null}
          </div>

          <div className="mx-auto w-full max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
            {/* Tabs (no Link navigation; instant) */}
            <div className="mb-6">
              <div className="inline-flex w-full rounded-full bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => setModeAndSyncUrl("signin")}
                  className={[
                    "flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition",
                    mode === "signin" ? "bg-white shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                  ].join(" ")}
                  aria-current={mode === "signin" ? "page" : undefined}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => setModeAndSyncUrl("signup")}
                  className={[
                    "flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition",
                    mode === "signup" ? "bg-white shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                  ].join(" ")}
                  aria-current={mode === "signup" ? "page" : undefined}
                >
                  Create account
                </button>
              </div>

              <p className="mt-3 text-sm text-neutral-600">
                {mode === "signin"
                  ? "Use your internal school email to sign in and post reviews."
                  : "Registration is open to internal emails only. We’ll send a verification email."}
              </p>
            </div>

            {/* Content */}
            {mode === "signin" ? (
              <section>
                <form action={signInWithPassword} onSubmit={signin.onSubmit} className="space-y-4">
                  {/* ✅ redirect after sign-in */}
                  <input type="hidden" name="redirectTo" value={redirectTo} />

                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="name@basischina.com"
                      autoComplete="email"
                      inputMode="email"
                      required
                      disabled={signin.pending}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring disabled:opacity-70"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Password</span>
                    <input
                      name="password"
                      type="password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      required
                      disabled={signin.pending}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring disabled:opacity-70"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={signin.pending}
                    aria-busy={signin.pending}
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signin.pending ? "Signing in..." : "Sign in"}
                  </button>

                  <p className="text-xs text-neutral-500">
                    If you just created an account, verify your email first, then sign in.
                  </p>
                </form>
              </section>
            ) : (
              <section>
                <form action={signUpWithEmailAndPassword} onSubmit={signup.onSubmit} className="space-y-4">
                  {/* ✅ keep behavior consistent */}
                  <input type="hidden" name="redirectTo" value={redirectTo} />

                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="name@basischina.com"
                      autoComplete="email"
                      inputMode="email"
                      required
                      disabled={signup.pending}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring disabled:opacity-70"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Password</span>
                    <input
                      name="password"
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={signup.pending}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring disabled:opacity-70"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Confirm password</span>
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={signup.pending}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring disabled:opacity-70"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={signup.pending}
                    aria-busy={signup.pending}
                    className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signup.pending ? "Creating..." : "Create account"}
                  </button>

                  <p className="text-xs text-neutral-500">
                    After verifying your email, come back and sign in to post reviews.
                  </p>
                </form>
              </section>
            )}
          </div>

          <p className="mt-6 text-xs text-neutral-500">Your ratings are always anonymous.</p>
        </div>
      </div>
    </main>
  );
}
