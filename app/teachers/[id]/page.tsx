// app/teachers/[id]/page.tsx
import Header from "@/components/Header";
import ReviewVoteButtons from "@/components/ReviewVoteButtons";
import SiteFooter from "@/components/SiteFooter";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";

function emailToHey(email?: string | null) {
  if (!email) return "GUEST";
  const name = email.split("@")[0] || "USER";
  return name.replaceAll(".", " ").toUpperCase();
}

function fmt1(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(1);
}

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${Math.round(Number(v) * 100)}%`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function distPercent(count: number, total: number) {
  if (!total) return 0;
  return clamp01(count / total);
}

export default async function TeacherPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { sort?: string; course?: string };
}) {
  const supabase = createSupabaseServerClient();

  const teacherId = params.id;

  // Who is the user? (for HEY menu + auth gating)
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const isAuthed = !!user;

  const heyName = emailToHey(user?.email);

  // teacher (aggregated view)
  const { data: teacher, error: teacherError } = await supabase
    .from("teacher_list")
    .select("id, full_name, subject, avg_quality, review_count, pct_would_take_again, avg_difficulty")
    .eq("id", teacherId)
    .maybeSingle();

  if (teacherError || !teacher) {
    redirect("/teachers");
  }

  // Distribution (q1..q5)
  const { data: distRows } = await supabase
    .from("teacher_quality_distribution")
    .select("q1, q2, q3, q4, q5, total")
    .eq("teacher_id", teacherId)
    .maybeSingle();

  const totalReviews = safeNum(distRows?.total, safeNum(teacher.review_count, 0));
  const q1 = safeNum(distRows?.q1, 0);
  const q2 = safeNum(distRows?.q2, 0);
  const q3 = safeNum(distRows?.q3, 0);
  const q4 = safeNum(distRows?.q4, 0);
  const q5 = safeNum(distRows?.q5, 0);

  // Top tags
  const { data: tagRows } = await supabase
    .from("teacher_top_tags")
    .select("tag")
    .eq("teacher_id", teacherId)
    .order("cnt", { ascending: false })
    .limit(12);

  const topTags = (tagRows ?? []).map((r: any) => String(r.tag)).filter(Boolean);

  // Reviews
  const sort = (searchParams?.sort ?? "top").trim();
  const course = (searchParams?.course ?? "").trim();

  let reviewsQuery = supabase
    .from("reviews")
    .select("id, user_id, teacher_id, quality, difficulty, would_take_again, comment, tags, course, grade, is_online, created_at")
    .eq("teacher_id", teacherId);

  if (course) {
    reviewsQuery = reviewsQuery.eq("course", course);
  }

  // Pull vote counts (RPC) + my votes if authed
  // NOTE: this is your existing behavior; improving detail-page query shape is the “next step”.
  const { data: reviews } = await reviewsQuery.order("created_at", { ascending: false });

  const reviewIds = (reviews ?? []).map((r: any) => r.id);

  const { data: voteCountsRows } = reviewIds.length
    ? await supabase.rpc("get_review_vote_counts", { review_ids: reviewIds })
    : { data: [] as any[] };

  const voteCountsMap = new Map<string, { up: number; down: number }>();
  (voteCountsRows ?? []).forEach((row: any) => {
    voteCountsMap.set(String(row.review_id), { up: safeNum(row.upvotes, 0), down: safeNum(row.downvotes, 0) });
  });

  let myVotesMap = new Map<string, 1 | -1 | 0>();
  if (isAuthed && reviewIds.length) {
    const { data: myVotes } = await supabase
      .from("review_votes")
      .select("review_id, vote")
      .eq("user_id", user!.id)
      .in("review_id", reviewIds);

    (myVotes ?? []).forEach((v: any) => {
      const rid = String(v.review_id);
      const vv = Number(v.vote);
      myVotesMap.set(rid, vv === 1 ? 1 : vv === -1 ? -1 : 0);
    });
  }

  // Sort reviews client-side according to vote counts (top) or newest
  let sortedReviews = [...(reviews ?? [])];
  if (sort === "new") {
    sortedReviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    // top: upvotes - downvotes, tie-breaker newest
    sortedReviews.sort((a: any, b: any) => {
      const av = voteCountsMap.get(String(a.id)) ?? { up: 0, down: 0 };
      const bv = voteCountsMap.get(String(b.id)) ?? { up: 0, down: 0 };
      const as = av.up - av.down;
      const bs = bv.up - bv.down;
      if (bs !== as) return bs - as;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  const rateHref = isAuthed ? `/teachers/${teacherId}/rate` : `/login?redirectTo=${encodeURIComponent(`/teachers/${teacherId}/rate`)}`;

  return (
    <main className="min-h-screen bg-white">
      <Header heyName={heyName} isAuthed={isAuthed} active="teachers" showSearch />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT PANEL */}
          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-4xl font-extrabold tracking-tight">{teacher.full_name}</div>
                <div className="mt-2 text-sm font-semibold text-neutral-600">{teacher.subject}</div>
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-5xl font-black">{fmt1(teacher.avg_quality)}</div>
                  <div className="text-sm text-neutral-600">
                    <div className="font-semibold">Overall Quality</div>
                    <div className="mt-1">{safeNum(teacher.review_count, 0)} ratings</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-6">
              <div className="border-r pr-6">
                <div className="text-4xl font-black">{fmtPct(teacher.pct_would_take_again)}</div>
                <div className="mt-1 text-sm text-neutral-700">Would take again</div>
              </div>
              <div className="pl-6">
                <div className="text-4xl font-black">{fmt1(teacher.avg_difficulty)}</div>
                <div className="mt-1 text-sm text-neutral-700">Level of Difficulty</div>
              </div>
            </div>

            {/* Rate button (primary entry to rating page) */}
            <div className="mt-8 flex gap-4">
              <Link
                href={rateHref}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-10 py-3 text-sm font-semibold text-white hover:opacity-90"
                prefetch
              >
                Rate <span className="ml-2">→</span>
              </Link>
            </div>

            {/* Top tags */}
            <div className="mt-10">
              <div className="text-lg font-semibold">{teacher.full_name}&apos;s Top Tags</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {topTags.length === 0 ? (
                  <div className="text-sm text-neutral-600">No tags yet.</div>
                ) : (
                  topTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-extrabold tracking-wide text-neutral-900"
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* RIGHT PANEL */}
          <section className="rounded-2xl bg-neutral-50 p-6">
            <div className="text-lg font-semibold">Rating Distribution</div>

            <div className="mt-6 space-y-5">
              {[
                { label: "5 stars", n: q5 },
                { label: "4 stars", n: q4 },
                { label: "3 stars", n: q3 },
                { label: "2 stars", n: q2 },
                { label: "1 star", n: q1 },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[70px_1fr_50px] items-center gap-3 text-sm">
                  <div className="text-neutral-700">{row.label}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full bg-neutral-900" style={{ width: `${distPercent(row.n, totalReviews) * 100}%` }} />
                  </div>
                  <div className="text-right font-semibold text-neutral-900">{row.n}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RATINGS */}
        <section id="ratings" className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-2xl font-extrabold tracking-tight">Ratings</div>

            <div className="flex items-center gap-3 text-sm">
              <Link
                href={`/teachers/${teacherId}?sort=top${course ? `&course=${encodeURIComponent(course)}` : ""}#ratings`}
                className={`rounded-full border px-4 py-2 ${sort !== "new" ? "bg-black text-white" : "bg-white"}`}
                prefetch
              >
                Top
              </Link>
              <Link
                href={`/teachers/${teacherId}?sort=new${course ? `&course=${encodeURIComponent(course)}` : ""}#ratings`}
                className={`rounded-full border px-4 py-2 ${sort === "new" ? "bg-black text-white" : "bg-white"}`}
                prefetch
              >
                New
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {sortedReviews.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-sm text-neutral-700">
                No ratings yet. Be the first to rate.
              </div>
            ) : (
              sortedReviews.map((r: any) => {
                const key = String(r.id);
                const voteCounts = voteCountsMap.get(key) ?? { up: 0, down: 0 };
                const myVote = myVotesMap.get(key) ?? 0;

                return (
                  <div key={key} className="rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900">
                          Quality {r.quality}/5 <span className="mx-2 text-neutral-300">·</span> Difficulty {r.difficulty}/5{" "}
                          <span className="mx-2 text-neutral-300">·</span>{" "}
                          {r.would_take_again ? "Would take again" : "Would NOT take again"}
                        </div>

                        <div className="mt-2 text-xs text-neutral-500">
                          {r.course ? String(r.course).toUpperCase() : ""} {r.is_online ? "· Online" : ""}{" "}
                          {r.grade ? `· Grade: ${r.grade}` : ""} ·{" "}
                          {new Date(r.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>

                        {Array.isArray(r.tags) && r.tags.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.tags.map((t: string) => (
                              <span
                                key={t}
                                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-800"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {r.comment ? <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-800">{r.comment}</p> : null}

                        <ReviewVoteButtons
                          teacherId={teacherId}
                          reviewId={key}
                          upvotes={voteCounts.up}
                          downvotes={voteCounts.down}
                          myVote={myVote}
                          isAuthed={isAuthed}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={rateHref}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-10 py-3 text-sm font-semibold text-white hover:opacity-90"
              prefetch
            >
              Rate this teacher <span className="ml-2">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
