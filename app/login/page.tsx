// app/login/page.tsx
import Link from "next/link";
import { signInWithPassword, signUpWithEmailAndPassword } from "@/lib/actions";

type LoginPageProps = {
  searchParams?: {
    message?: string;
    error?: string;
    redirectTo?: string;
    mode?: string; // "signin" | "signup"
  };
};

function Alert({ kind, text }: { kind: "error" | "message"; text: string }) {
  const base = "w-full rounded-lg border px-4 py-3 text-sm leading-5";
  const cls =
    kind === "error"
      ? `${base} border-red-300 bg-red-50 text-red-800`
      : `${base} border-emerald-300 bg-emerald-50 text-emerald-900`;

  return <div className={cls}>{text}</div>;
}

function pickMode(searchParams?: LoginPageProps["searchParams"]) {
  const modeRaw = (searchParams?.mode ?? "").toLowerCase();
  if (modeRaw === "signup" || modeRaw === "register") return "signup";
  if (modeRaw === "signin" || modeRaw === "login") return "signin";

  const error = (searchParams?.error ?? "").toLowerCase();
  // 这些错误更像是注册流程产生的
  if (error.includes("do not match") || error.includes("match") || error.includes("at least 8")) return "signup";

  // 默认登录
  return "signin";
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const message = searchParams?.message;
  const error = searchParams?.error;

  // ✅ important: allow redirect back to the page that required auth
  const redirectTo = searchParams?.redirectTo ?? "/teachers";

  const mode = pickMode(searchParams);

  const signinHref = `/login?mode=signin&redirectTo=${encodeURIComponent(redirectTo)}`;
  const signupHref = `/login?mode=signup&redirectTo=${encodeURIComponent(redirectTo)}`;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Rate My Teacher</h1>
            <p className="mt-2 text-sm text-neutral-600">
              BASIS International School Park Lane Harbor (High School)
            </p>
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
            {/* Tabs */}
            <div className="mb-6">
              <div className="inline-flex w-full rounded-full bg-neutral-100 p-1">
                <Link
                  href={signinHref}
                  className={[
                    "flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition",
                    mode === "signin" ? "bg-white shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                  ].join(" ")}
                  aria-current={mode === "signin" ? "page" : undefined}
                >
                  Sign in
                </Link>

                <Link
                  href={signupHref}
                  className={[
                    "flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition",
                    mode === "signup" ? "bg-white shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                  ].join(" ")}
                  aria-current={mode === "signup" ? "page" : undefined}
                >
                  Create account
                </Link>
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
                <form action={signInWithPassword} className="space-y-4">
                  {/* ✅ redirect after sign-in */}
                  <input type="hidden" name="redirectTo" value={redirectTo} />

                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="name@basischina.com"
                      autoComplete="email"
                      required
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
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
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Sign in
                  </button>

                  <p className="text-xs text-neutral-500">
                    If you just created an account, verify your email first, then sign in.
                  </p>
                </form>
              </section>
            ) : (
              <section>
                <form action={signUpWithEmailAndPassword} className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="name@basischina.com"
                      autoComplete="email"
                      required
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
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
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
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
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    Create account
                  </button>

                  <p className="text-xs text-neutral-500">
                    After verifying your email, come back and sign in to post reviews.
                  </p>
                </form>
              </section>
            )}
          </div>

          <p className="mt-6 text-xs text-neutral-500">
            Your ratings are always anonymous.
          </p>
        </div>
      </div>
    </main>
  );
}
