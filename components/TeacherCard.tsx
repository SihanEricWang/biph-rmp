// components/ProfessorCard.tsx
import Link from "next/link";
import type { TeacherListItem } from "@/types";

function ratingClass(avg: number | null) {
  if (avg === null) return "bg-neutral-200 text-neutral-800";
  if (avg < 2) return "bg-rose-200 text-neutral-900";
  if (avg < 3) return "bg-orange-200 text-neutral-900";
  if (avg < 4) return "bg-yellow-200 text-neutral-900";
  return "bg-emerald-200 text-neutral-900";
}

function fmt1(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function fmtPct(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return `${Math.round(n)}%`;
}

export default function ProfessorCard({ teacher }: { teacher: TeacherListItem }) {
  const avg = teacher.avg_quality;
  const count = teacher.review_count ?? 0;

  return (
    <Link
      href={`/professor/${teacher.id}`}
      className="block rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="flex gap-6 p-6">
        {/* LEFT: rating block */}
        <div className="w-28 shrink-0 text-center">
          <div className="text-xs font-semibold tracking-wide text-neutral-700">QUALITY</div>

          <div className={`mt-2 rounded-xl px-3 py-5 ${ratingClass(avg)}`}>
            <div className="text-4xl font-extrabold leading-none">{fmt1(avg)}</div>
          </div>

          <div className="mt-2 text-sm text-neutral-600">
            {count === 0 ? "No ratings" : `${count} ratings`}
          </div>
        </div>

        {/* MIDDLE: details */}
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-extrabold tracking-tight">{teacher.full_name}</div>
          <div className="mt-1 text-sm text-neutral-700">{teacher.subject ?? "—"}</div>
          <div className="mt-1 text-sm text-neutral-500">BIPH</div>

          <div className="mt-3 text-sm text-neutral-800">
            <span className="font-bold">{fmtPct(teacher.pct_would_take_again)}</span>{" "}
            <span className="text-neutral-600">would take again</span>
            <span className="mx-2 text-neutral-300">|</span>
            <span className="font-bold">{fmt1(teacher.avg_difficulty)}</span>{" "}
            <span className="text-neutral-600">level of difficulty</span>
          </div>
        </div>

        {/* RIGHT: bookmark */}
        <div className="flex w-10 shrink-0 items-start justify-end">
          <button
            type="button"
            aria-label="Bookmark"
            className="rounded-lg p-2 hover:bg-neutral-100"
            onClick={(e) => {
              // placeholder for future favorite feature
              e.preventDefault();
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-70">
              <path
                d="M6 3h12a1 1 0 011 1v18l-7-4-7 4V4a1 1 0 011-1z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
