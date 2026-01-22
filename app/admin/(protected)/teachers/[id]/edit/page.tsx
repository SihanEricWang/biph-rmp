// app/admin/(protected)/teachers/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { adminDeleteTeacher, adminUpdateTeacher } from "@/lib/admin/actions";

export default async function AdminTeacherEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { message?: string; error?: string };
}) {
  const supabase = createSupabaseAdminClient();
  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, full_name, subject")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !teacher) notFound();

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-neutral-500">Teachers</div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Edit</h1>
        </div>
        <Link href="/admin/teachers" className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-50">
          ← Back
        </Link>
      </div>

      {searchParams?.error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams?.message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {searchParams.message}
        </div>
      ) : null}

      <form action={adminUpdateTeacher} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={teacher.id} />

        <div>
          <div className="text-xs font-semibold text-neutral-600">Full name</div>
          <input
            name="full_name"
            defaultValue={teacher.full_name ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-neutral-600">Subject</div>
          <input
            name="subject"
            defaultValue={teacher.subject ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Save
          </button>

          <form action={adminDeleteTeacher}>
            <input type="hidden" name="id" value={teacher.id} />
            <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100">
              Delete
            </button>
          </form>
        </div>
      </form>
    </div>
  );
}
