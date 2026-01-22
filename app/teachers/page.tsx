// app/teachers/page.tsx
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import TeacherCard from "@/components/TeacherCard";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import type { TeacherListItem } from "@/types";

type PageProps = {
  searchParams?: {
    q?: string;
    subject?: string;
    page?: string;
  };
};

function emailToHey(email?: string | null) {
  if (!email) return "GUEST";
  const name = email.split("@")[0] || "USER";
  return name.replaceAll(".", " ").toUpperCase();
}

export default async function TeachersPage({ searchParams }: PageProps) {
  const supabase = createSupabaseServerClient();

  const q = (searchParams?.q ?? "").trim();
  const subject = (searchParams?.subject ?? "").trim();

  const pageSize = 10;
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const from = (page - 1) * pageSize;

  // ✅ 并行：用户信息 + subjects + teacher list
  const userPromise = supabase.auth.getUser();

  const subjectsPromise = supabase
    .from("teachers")
    .select("subject")
    .order("subject", { ascending: true });

  let listQuery = supabase
    .from("teacher_list")
    .select("id, full_name, subject, avg_quality, review_count, pct_would_take_again, avg_difficulty")
    .order("review_count", { ascending: false })
    .order("full_name", { ascending: true })
    // ✅ 多取 1 条，用来判断下一页是否存在（替代 exact count）
    .range(from, from + pageSize);

  if (q) listQuery = listQuery.ilike("full_name", `%${q}%`);
  if (subject) listQuery = listQuery.eq("subject", subject);

  const [{ data: userData }, { data: subjectRows }, { data, error }] = await Promise.all([
    userPromise,
    subjectsPromise,
    listQuery,
  ]);

  const heyName = emailToHey(userData.user?.email);

  const subjects = Array.from(new Set((subjectRows ?? []).map((r) => r.subject).filter(Boolean) as string[]));

  const rows = (data ?? []) as TeacherListItem[];
  const hasNext = rows.length > pageSize;
  const teachers = hasNext ? rows.slice(0, pageSize) : rows;
  const hasPrev = page > 1;

  const qsBase = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(subject ? { subject } : {}),
  });

  const prevHref = `/teachers?${new URLSearchParams({
    ...Object.fromEntries(qsBase.entries()),
    page: String(page - 1),
  }).toString()}`;

  const nextHref = `/teachers?${new URLSearchParams({
    ...Object.fromEntries(qsBase.entries()),
    page: String(page + 1),
  }).toString()}`;

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header heyName={heyName} isAuthed={!!userData.user} active="teachers" showSearch searchDefaultValue={q} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <SearchBar subjects={subjects} />

        <div className="mt-8 text-2xl font-medium tracking-tight">
          Teachers at <span className="font-extrabold">BIPH</span>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Failed to load teachers: {error.message}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {teachers.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-sm text-neutral-700">No teachers found.</div>
          ) : (
            teachers.map((t) => <TeacherCard key={t.id} teacher={t} />)
          )}
        </div>

        {/* pagination */}
        {(hasPrev || hasNext) ? (
          <div className="mt-10 flex items-center justify-between text-sm">
            <Link
              className={`rounded-lg border px-4 py-2 ${!hasPrev ? "pointer-events-none opacity-40" : "hover:bg-white"}`}
              href={prevHref}
              prefetch
            >
              Previous
            </Link>

            <div className="text-neutral-600">Page {page}</div>

            <Link
              className={`rounded-lg border px-4 py-2 ${!hasNext ? "pointer-events-none opacity-40" : "hover:bg-white"}`}
              href={nextHref}
              prefetch
            >
              Next
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
