// app/page.tsx
import Link from "next/link";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative min-h-[86vh] w-full overflow-hidden">
        {/* background (placeholder) */}
        <div className="absolute inset-0">
          {/* faux-photo gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.18),_rgba(0,0,0,0.75))]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,_rgba(0,0,0,0.65),_rgba(0,0,0,0.2))]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(0,0,0,0.35),_rgba(0,0,0,0.88))]" />
        </div>
      
        <div className="relative mx-auto flex min-h-[86vh] max-w-6xl flex-col items-center justify-center px-4 text-center text-white">
          {/* Logo badge */}
          <div className="flex w-full justify-center">
            <div className="inline-flex items-center">
              <div className="inline-flex overflow-hidden rounded-sm shadow-sm ring-1 ring-white/20">
                <div className="whitespace-nowrap bg-black px-6 py-3 text-sm font-black tracking-[0.25em] sm:tracking-[0.35em]">
                  RATE MY
                </div>
                <div className="whitespace-nowrap bg-white px-6 py-3 text-sm font-black tracking-[0.25em] sm:tracking-[0.35em] text-black">
                  TEACHER
                </div>
              </div>
            </div>
          </div>
      
          <h1 className="mt-10 text-3xl font-semibold tracking-tight md:text-4xl">
            Find a teacher at{" "}
            <span className="underline decoration-white/50 underline-offset-4">
              Basis Int. School Park Lane Harbor
            </span>
          </h1>
      
          {/* No search box — button instead */}
          <div className="mt-10 w-full max-w-2xl">
            <Link
              href="/teachers"
              className="group relative flex h-14 w-full items-center justify-center rounded-full bg-white/95 px-6 text-sm font-semibold text-black shadow-lg ring-1 ring-white/20 hover:bg-white"
              prefetch
            >
              <span>Enter Rate My Teacher</span>
              <span className="ml-2 opacity-70 group-hover:opacity-100">→</span>
      
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/80">
                Click to view teachers and ratings (sign in to post)
              </span>
            </Link>
          </div>
      
          {/* scroll hint */}
          <a
            href="#about"
            className="mt-16 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-white/80 hover:text-white"
          >
            Learn more
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      
        {/* Yellow callout on the extra black area */}
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-yellow-300/95 p-6 text-left text-black shadow-xl ring-1 ring-yellow-200 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-black/80" />
                <div className="text-xs font-extrabold tracking-[0.22em] uppercase">We need you!</div>
              </div>
      
              <div className="mt-3 text-lg font-extrabold tracking-tight">Help us shape this new site.</div>
      
              <p className="mt-2 text-sm leading-6 text-black/80">
                We’re BIPH students who built and operate this website. It just launched, and we’d love your help—whether
                you’d like to contribute to the project or simply share suggestions. Please scroll to the bottom of this page
                and click <span className="font-semibold underline underline-offset-2">Contact Us</span>.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* INFO / ABOUT */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-14">
        {/* intro card (your custom requirement) */}
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome back!</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            <span className="font-semibold">Rate My Teacher</span> is a school-only rating site built specifically for{" "}
            <span className="font-semibold">BIPH</span>. Browse teacher pages freely, and sign in with your{" "}
            <span className="font-mono">@basischina.com</span> email to post ratings and tags.{" "}
          </p>
        </div>

        {/* section header like screenshot */}
        <div className="mt-14 text-center">
          <div className="text-5xl font-extrabold tracking-tight">RMT-BIPH</div>
        </div>

        {/* three feature blocks (match screenshot 2 layout) */}
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {/* 1 */}
          <div className="flex flex-col items-center text-center">
            {/* illustration placeholder */}
            <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_30%_30%,_rgba(253,230,138,0.9),_rgba(255,255,255,0)_60%)]">
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-2xl bg-white/70 px-6 py-4 text-4xl leading-none text-neutral-800 shadow-sm">
                  ✏️
                </div>
              </div>
            </div>
            <div className="mt-6 text-3xl font-extrabold tracking-tight">Manage and edit your ratings</div>
          </div>

          {/* 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_40%,_rgba(216,180,254,0.9),_rgba(255,255,255,0)_60%)]">
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-2xl bg-white/70 px-6 py-4 text-4xl leading-none text-neutral-800 shadow-sm">
                  🕶️
                </div>
              </div>
            </div>
            <div className="mt-6 text-3xl font-extrabold tracking-tight">Your ratings are always anonymous</div>
          </div>

          {/* 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_70%_35%,_rgba(147,197,253,0.9),_rgba(255,255,255,0)_60%)]">
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-2xl bg-white/70 px-6 py-4 text-4xl leading-none text-neutral-800 shadow-sm">
                  👍👎
                </div>
              </div>
            </div>
            <div className="mt-6 text-3xl font-extrabold tracking-tight">Like or dislike ratings</div>
          </div>
        </div>
      </section>
    </main>
  );
}
