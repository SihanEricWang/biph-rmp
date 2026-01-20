// components/SearchBar.tsx
"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function buildQueryString(params: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(params.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") next.delete(k);
    else next.set(k, v);
  }
  // whenever search/filter changes, reset page
  next.delete("page");
  return next.toString();
}

export default function SearchBar({
  subjects,
}: {
  subjects: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initialQ = params.get("q") ?? "";
  const initialSubject = params.get("subject") ?? "Any";

  const [q, setQ] = useState(initialQ);
  const [subject, setSubject] = useState(initialSubject);

  const subjectOptions = useMemo(() => ["Any", ...subjects], [subjects]);

  function submit(nextQ: string, nextSubject: string) {
    const qs = buildQueryString(params, {
      q: nextQ.trim() ? nextQ.trim() : null,
      subject: nextSubject === "Any" ? null : nextSubject,
    });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form
        className="relative w-full md:max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q, subject);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a teacher"
          className="h-12 w-full rounded-full border bg-white pl-5 pr-12 text-sm outline-none focus:ring"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-neutral-100"
        >
          {/* magnifier icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-70">
            <path
              d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>

      <div className="w-full md:w-56">
        <select
          value={subject}
          onChange={(e) => {
            const v = e.target.value;
            setSubject(v);
            submit(q, v);
          }}
          className="h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none focus:ring"
        >
          {subjectOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
