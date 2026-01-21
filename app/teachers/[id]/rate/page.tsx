// app/teachers/[id]/rate/page.tsx
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import RateForm from "@/components/RateForm";

function emailToHey(email?: string | null) {
  if (!email) return "GUEST";
  const name = email.split("@")[0] || "USER";
  return name.replaceAll(".", " ").toUpperCase();
}

export default async function RatePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const teacherId = params.id;

  // auth gate
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/teachers/${teacherId}/rate`)}`);
  }

  // load teacher
  const { data: teacher, error: tErr } = await supabase
    .from("teachers")
    .select("id, full_name, subject")
    .eq("id", teacherId)
    .maybeSingle();

  if (tErr || !teacher) notFound();

  const heyName = emailToHey(user.email);

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Top nav */}
      <header className="bg-black text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <a
            href={`/teachers/${teacherId}`}
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            ← Back
          </a>

          <a
            href="/teachers"
            className="rounded bg-white px-2 py-1 text-xs font-black tracking-widest text-black"
          >
            RMT
          </a>

          <div className="hidden items-center gap-3 md:flex">
            <div className="text-sm font-semibold">Teachers</div>
            <form action="/teachers" className="relative">
              <input
                name="q"
                placeholder="Teacher name"
                className="h-9 w-[380px] rounded-full bg-white/10 px-4 text-sm outline-none placeholder:text-white/60 focus:bg-white/15"
              />
            </form>
            <div className="text-sm text-white/70">at</div>
            <div className="text-sm font-semibold underline underline-offset-2 decoration-white/40">
              BIPH
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm font-extrabold tracking-wide">HEY, {heyName}</div>
            <a
              href="#guidelines"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
            >
              Help
            </a>
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="text-5xl font-extrabold tracking-tight">{teacher.full_name}</div>
          <div className="text-2xl font-medium text-neutral-800">Add Rating</div>
          <div className="mt-2 text-sm text-neutral-700">
            <span className="font-semibold">{teacher.subject ?? "—"}</span>
            <span className="mx-2 text-neutral-300">·</span>
            <span className="underline underline-offset-2 decoration-neutral-300">BIPH</span>
          </div>
        </div>

        {/* ✅ subject is passed in; courseSuggestions removed */}
        <RateForm teacherId={teacherId} teacherSubject={teacher.subject} />

        {/* Footer */}
        <footer className="mt-14 border-t py-8 text-xs text-neutral-600" id="guidelines">
          <div className="flex flex-wrap justify-center gap-6">
            <a className="hover:underline" href="#guidelines">Help</a>
            <a className="hover:underline" href="#guidelines">Site Guidelines</a>
            <a className="hover:underline" href="#guidelines">Terms &amp; Conditions</a>
            <a className="hover:underline" href="#guidelines">Privacy Policy</a>
          </div>
          <div className="mt-4 text-center text-neutral-500">© Rate My Teacher (BIPH internal)</div>
        </footer>
      </div>
    </main>
  );
}
