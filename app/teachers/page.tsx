// app/teachers/page.tsx
import SearchBar from "@/components/SearchBar";
import ProfessorCard from "@/components/ProfessorCard";
import type { TeacherListItem } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase";
import Header from "@/components/Header";

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

  // who is the user? (for "HEY, USER")
  const { data: userData } = await supabase.auth.getUser();
  const heyName = emailToHey(userData.user?.email);

  const q = (searchParams?.q ?? "").trim();
  const subject = (searchParams?.subject ?? "").trim();

  // pagination
  const pageSize = 10;
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // fetch subjects (for "Any" dropdown)
  const { data: subjectRows } = await supabase
    .from("teachers")
    .select("subject")
    .order("subject", { ascending: true });

  const subjects = Array.from(
    new Set((subjectRows ?? []).map((r) => r.subject).filter(Boolean) as string[])
  );

  // fetch teacher list (aggregated view)
  let queryBuilder = supabase
    .from("teacher_list")
    .select(
      "id, full_name, subject, avg_quality, review_count, pct_would_take_again, avg_difficulty",
      { count: "exact" }
    )
    .order("full_name", { ascending: true })
    .range(from, to);

  if (q) queryBuilder = queryBuilder.ilike("full_name", `%${q}%`);
  if (subject) queryBuilder = queryBuilder.eq("subject", subject);

  const { data, error, count } = await queryBuilder;
  const teachers = (data ?? []) as TeacherListItem[];

  const qsBase = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(subject ? { subject } : {}),
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* TOP NAV (match your screenshot style) */}
      <Header
  heyName={heyName}
  isAuthed={!!userData.user}
  active="teachers"
  showSearch
  searchDefaultValue={q}
/>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* big search + Any dropdown (as in screenshot body) */}
        <SearchBar subjects={subjects} />

        <div className="mt-8 text-2xl font-medium tracking-tight">
          {(count ?? 0).toLocaleString()} teachers at{" "}
          <span className="font-extrabold">BIPH</span>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Failed to load teachers: {error.message}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {teachers.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-sm text-neutral-700">
              No teachers found.
            </div>
          ) : (
            teachers.map((t) => <ProfessorCard key={t.id} teacher={t} />)
          )}
        </div>

        {/* pagination */}
        {count !== null && count > pageSize ? (
          <div className="mt-10 flex items-center justify-between text-sm">
            <a
              className={`rounded-lg border px-4 py-2 ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-white"
              }`}
              href={`/teachers?${new URLSearchParams({
                ...Object.fromEntries(qsBase.entries()),
                page: String(page - 1),
              }).toString()}`}
            >
              Previous
            </a>

            <div className="text-neutral-600">
              Page {page} of {Math.ceil(count / pageSize)}
            </div>

            <a
              className={`rounded-lg border px-4 py-2 ${
                page >= Math.ceil(count / pageSize)
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-white"
              }`}
              href={`/teachers?${new URLSearchParams({
                ...Object.fromEntries(qsBase.entries()),
                page: String(page + 1),
              }).toString()}`}
            >
              Next
            </a>
          </div>
        ) : null}
      </div>
    </main>
  );
}
