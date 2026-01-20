// app/me/ratings/[reviewId]/edit/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import StarRating from "@/components/ui/StarRating";
import { updateMyReview, deleteMyReview } from "@/lib/actions";
import ConfirmDeleteButton from "@/components/ui/ConfirmDeleteButton";

function emailToHey(email?: string | null) {
  if (!email) return "GUEST";
  const name = email.split("@")[0] || "USER";
  return name.replaceAll(".", " ").toUpperCase();
}

const GRADE_OPTIONS = ["", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "P", "NP"];

export default async function EditMyRatingPage({
  params,
  searchParams,
}: {
  params: { reviewId: string };
  searchParams?: { error?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/me/ratings/${params.reviewId}/edit`)}`);

  const heyName = emailToHey(user.email);

  const { data: review, error } = await supabase
    .from("reviews")
    .select(
      "id, teacher_id, quality, difficulty, would_take_again, comment, tags, course, grade, is_online, created_at, teacher:teachers(full_name, subject)"
    )
    .eq("id", params.reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !review) {
    redirect(`/me/ratings?error=${encodeURIComponent("Review not found (or you don't own it).")}`);
  }

  const tagsText = Array.isArray(review.tags) ? review.tags.join(", ") : "";

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="bg-black text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <a
            href="/teachers"
            className="rounded bg-white px-2 py-1 text-xs font-black tracking-widest text-black"
          >
            RMT
          </a>
          <a href="/me/ratings" className="text-sm font-semibold underline underline-offset-2 decoration-white/40">
            My Ratings
          </a>
          <div className="ml-auto text-sm font-extrabold tracking-wide">HEY, {heyName}</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {searchParams?.error ? (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {searchParams.error}
          </div>
        ) : null}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-2xl font-extrabold tracking-tight">Edit Rating</div>
          <div className="mt-2 text-sm text-neutral-600">
            <span className="font-semibold">{review.teacher?.full_name ?? "Teacher"}</span>
            <span className="mx-2 text-neutral-300">·</span>
            {review.teacher?.subject ?? "—"}
            <span className="mx-2 text-neutral-300">·</span>
            <a className="underline underline-offset-2" href={`/professor/${review.teacher_id}`}>
              View teacher page
            </a>
          </div>

          <form action={updateMyReview} className="mt-6 space-y-5">
            <input type="hidden" name="reviewId" value={review.id} />
            <input type="hidden" name="teacherId" value={review.teacher_id} />

            <div className="grid gap-5 md:grid-cols-2">
              <StarRating name="quality" label="Overall quality" defaultValue={Number(review.quality)} required />
              <StarRating name="difficulty" label="Level of difficulty" defaultValue={Number(review.difficulty)} required />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <div className="text-sm font-medium">Would take again</div>
                <select
                  name="wouldTakeAgain"
                  defaultValue={review.would_take_again ? "yes" : "no"}
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring"
                  required
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="block">
                <div className="text-sm font-medium">Course code <span className="text-red-600">*</span></div>
                <input
                  name="course"
                  defaultValue={review.course ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring"
                  placeholder="e.g. MATH, ENG, CHEM"
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <div className="text-sm font-medium">Grade received</div>
                <select
                  name="grade"
                  defaultValue={review.grade ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g === "" ? "Select grade" : g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 pt-7 text-sm text-neutral-700">
                <input type="hidden" name="isOnline" value="0" />
                <input
                  type="checkbox"
                  defaultChecked={!!review.is_online}
                  onChange={() => {}}
                  // 注意：这里用 checkbox + hidden 的方式提交 1/0
                  // Next 会提交 "on"，所以我们用下面这个小技巧：
                  name="isOnlineCheckbox"
                  className="h-4 w-4"
                />
                This is an online course
              </label>

              {/* hidden field that server action reads */}
              <input
                type="hidden"
                name="isOnline"
                value={review.is_online ? "1" : "0"}
              />
            </div>

            {/* ✅ 解决 checkbox 提交：用一个小脚本? 这里不写 JS，改成最稳的方式：两个 radio */}
            <div className="rounded-xl border bg-neutral-50 p-4">
              <div className="text-sm font-medium">Online course?</div>
              <div className="mt-3 flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="isOnline" value="1" defaultChecked={!!review.is_online} />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="isOnline" value="0" defaultChecked={!review.is_online} />
                  No
                </label>
              </div>
            </div>

            <label className="block">
              <div className="text-sm font-medium">Tags (comma-separated, up to 10)</div>
              <input
                name="tags"
                defaultValue={tagsText}
                className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring"
                placeholder="e.g. TOUGH GRADER, LOTS OF HOMEWORK"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium">Comment (optional)</div>
              <textarea
                name="comment"
                defaultValue={review.comment ?? ""}
                rows={6}
                className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring"
                placeholder="Update your review..."
              />
              <div className="mt-2 text-xs text-neutral-500">Max 1200 characters.</div>
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Save changes
              </button>
              <a
                href="/me/ratings"
                className="rounded-xl border bg-white px-5 py-2.5 text-sm hover:bg-neutral-50"
              >
                Cancel
              </a>

              <form action={deleteMyReview} className="ml-auto">
                <input type="hidden" name="reviewId" value={review.id} />
                <ConfirmDeleteButton className="rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm text-rose-800 hover:bg-rose-100">
                  Delete
                </ConfirmDeleteButton>
              </form>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
