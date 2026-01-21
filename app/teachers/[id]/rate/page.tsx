import { createClient } from "@/lib/supabase";
import RateForm from "@/components/RateForm";
import Link from "next/link";

export default async function RateTeacherPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !teacher) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Teacher not found</h1>
        <p className="mt-2 text-sm text-neutral-600">
          We couldn&apos;t find that teacher.
        </p>
        <div className="mt-6">
          <Link
            href="/teachers"
            className="inline-flex items-center rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Back to teachers
          </Link>
        </div>
      </div>
    );
  }

  const subjectRaw = (teacher.subject ?? "") as string;

  // Support delimited subject strings like:
  // "Math, Physics" | "Math/Physics" | "Math | Physics" | "Math;Physics"
  const subjectOptions = subjectRaw
    .split(/[,;|/]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // If subject is a single string with no delimiter, keep it.
  if (subjectOptions.length === 0 && subjectRaw.trim().length > 0) {
    subjectOptions.push(subjectRaw.trim());
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Back button (not in header) */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/teachers/${teacher.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
        >
          <span aria-hidden>←</span>
          Back
        </Link>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">
        Rate {teacher.name}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Share your experience to help other students.
      </p>

      <div className="mt-8">
        <RateForm teacherId={teacher.id} subjectOptions={subjectOptions} />
      </div>
    </div>
  );
}
