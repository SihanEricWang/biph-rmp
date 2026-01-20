// app/login/page.tsx
import { signInWithPassword, signUpWithEmailAndPassword } from "@/lib/actions";

type LoginPageProps = {
  searchParams?: {
    message?: string;
    error?: string;
  };
};

function Alert({ kind, text }: { kind: "error" | "message"; text: string }) {
  const base =
    "w-full rounded-lg border px-4 py-3 text-sm leading-5";
  const cls =
    kind === "error"
      ? `${base} border-red-300 bg-red-50 text-red-800`
      : `${base} border-emerald-300 bg-emerald-50 text-emerald-900`;

  return <div className={cls}>{text}</div>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const message = searchParams?.message;
  const error = searchParams?.error;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Rate My Teacher</h1>
            <p className="mt-2 text-sm text-neutral-600">
              BASIS International School Park Lane Harbor (High School)
            </p>
            <p className="mt-3 text-sm text-neutral-700">
              Viewing is public. Posting reviews requires sign in.
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-800">
              Only internal email addresses (<span className="font-mono">@basischina.com</span>) are allowed.
            </p>
          </div>

          <div className="mb-6 space-y-3">
            {error ? <Alert kind="error" text={error} /> : null}
            {message ? <Alert kind="message" text={message} /> : null}
          </div>

          <div className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2">
            {/* SIGN IN */}
            <section>
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Use your internal school email to sign in and post reviews.
              </p>

              <form action={signInWithPassword} className="mt-5 space-y-4">
                <input type="hidden" name="redirectTo" value="/teachers" />

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

            {/* SIGN UP */}
            <section className="md:border-l md:pl-6">
              <h2 className="text-lg font-semibold">Create an account</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Registration is open to internal emails only. We’ll send a verification email.
              </p>

              <form action={signUpWithEmailAndPassword} className="mt-5 space-y-4">
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
          </div>

          <p className="mt-6 text-xs text-neutral-500">
            Tip: In Supabase Auth settings, make sure Email confirmations are enabled and Redirect URLs include{" "}
            <span className="font-mono">/auth/callback</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
