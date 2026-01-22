// app/admin/(protected)/reviews/page.tsx
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type ReviewRow = {
  id: string;
  created_at: string;
  teacher_id: string;
  user_id: string;
  quality: number;
  difficulty: number;
  would_take_again: boolean;
  comment: string | null;
  course: string | null;
  teacher?: { full_name: string | null; subject: string | null } | null;
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams?: { q?: string; teacher?: string; message?: string; error?: string };
}) {
  const supabase = createSupabaseAdminClient();
  const q = (searchParams?.q ?? "").trim();
  const teacherId = (searchParams?.teacher ?? "").trim();

  const { data: teacherOptions } = await supabase.from("teachers").select("id, full_name").order("full_name");

  let qb = supabase
    .from("reviews")
    .select(
      "id, created_at, teacher_id, user_id, quality, difficulty, would_take_again, comment, course, teacher:teachers(full_name, subject)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (teacherId) qb = qb.eq("teacher_id", teacherId);
  if (q) qb = qb.ilike("comment", `%${q}%`);

  const { data: rows, error } = await qb;
  const reviews = (rows ?? []) as ReviewRow[];

  // 拉取用户邮箱（用 auth.admin.getUserById，避免你改数据库）
  const uniqueUserIds = Array.from(new Set(reviews.map((r) => r.user_id).filter(Boolean)));
  const emailMap = new Map<string, string>();

  await Promise.all(
    uniqueUserIds.map(async (uid) => {
      const res = await supabase.auth.admin.getUserById(uid);
      emailMap.set(uid, res.data.user?.email ?? "—");
    })
  );

  return (
    <div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold text-neutral-500">Admin</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Reviews</h1>
        <div className="mt-1 text-sm text-neutral-600">Moderate / edit / delete reviews. Shows user email.</div>

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
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Failed: {error.message}
          </div>
        ) : null}

        <form className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-neutral-600">Search (comment contains)</div>
            <input
              name="q"
              defaultValue={q}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              placeholder="keyword..."
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-600">Teacher</div>
            <select
              name="teacher"
              defaultValue={teacherId}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All</option>
              {(teacherOptions ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Apply
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4 text-sm font-semibold">Latest reviews (max 50)</div>

        <div className="divide-y">
          {reviews.map((r) => (
            <div key={r.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">
                    {r.teacher?.full_name || "Unknown Teacher"}
                    <span className="mx-2 text-neutral-300">·</span>
                    <span className="text-xs font-semibold text-neutral-600">
                      {r.teacher?.subject || "—"}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-neutral-600">
                    User: <span className="font-mono">{emailMap.get(r.user_id) ?? "—"}</span>
                    <span className="mx-2 text-neutral-300">·</span>
                    Q{r.quality} / D{r.difficulty}
                    <span className="mx-2 text-neutral-300">·</span>
                    Course/Subject: {r.course || "—"}
                  </div>

                  <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">
                    {r.comment || <span className="text-neutral-400">No comment.</span>}
                  </div>
                </div>

                <Link
                  href={`/admin/reviews/${encodeURIComponent(r.id)}/edit`}
                  className="shrink-0 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}

          {reviews.length === 0 ? <div className="px-6 py-10 text-sm text-neutral-600">No reviews.</div> : null}
        </div>
      </div>
    </div>
  );
}
