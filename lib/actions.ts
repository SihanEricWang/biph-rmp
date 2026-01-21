"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase";

const ALLOWED_DOMAIN_SUFFIX = "@basischina.com";

// --------------------
// Small utilities
// --------------------
function str(v: FormDataEntryValue | null | undefined): string {
  return String(v ?? "").trim();
}

/** Prefer the last value if there are duplicate keys in the form. */
function getLast(formData: FormData, key: string): string {
  const all = formData.getAll(key);
  if (!all.length) return "";
  return str(all[all.length - 1]);
}

function num(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function intInRange(v: string, min: number, max: number): number | null {
  const n = num(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  if (i < min || i > max) return null;
  return i;
}

function bool01(v: string): boolean {
  return v === "1" || v.toLowerCase() === "true";
}

function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN_SUFFIX);
}

/** Prevent open-redirects: only allow same-site relative paths. */
function safeRedirectPath(p: string, fallback = "/teachers"): string {
  const s = (p || "").trim();
  if (!s.startsWith("/")) return fallback;
  if (s.startsWith("//")) return fallback;
  if (s.includes("\\") || s.includes("\n") || s.includes("\r")) return fallback;
  return s;
}

function teacherPage(teacherId: string) {
  return `/teachers/${encodeURIComponent(teacherId)}`;
}
function teacherRatePage(teacherId: string) {
  return `/teachers/${encodeURIComponent(teacherId)}/rate`;
}

/**
 * Best-effort Site URL builder for Supabase emailRedirectTo
 * Priority:
 * 1) NEXT_PUBLIC_SITE_URL (recommended, full https://domain)
 * 2) NEXT_PUBLIC_VERCEL_URL (usually domain only, add https://)
 * 3) request headers (x-forwarded-proto/host)
 * 4) localhost (dev)
 */
function getSiteURL(): string {
  const envSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envSite) return envSite.replace(/\/+$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercel) {
    const withProto = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return withProto.replace(/\/+$/, "");
  }

  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  return "http://localhost:3000";
}

async function requireInternalUserOrRedirect(redirectTo?: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    const dest = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
    redirect(dest);
  }

  if (!isAllowedEmail(user.email)) {
    redirect(`/login?error=${encodeURIComponent("Only internal emails are allowed.")}`);
  }

  return { supabase, user };
}

/**
 * For rate page: you changed "course" to "subject".
 * This keeps backward compatibility:
 * - prefer subject
 * - fallback to course
 */
function getSubjectOrCourse(formData: FormData): { value: string; source: "subject" | "course" | "none" } {
  const subject = str(formData.get("subject"));
  if (subject) return { value: subject, source: "subject" };

  const course = str(formData.get("course"));
  if (course) return { value: course, source: "course" };

  return { value: "", source: "none" };
}

// --------------------
// Auth actions (used by app/login/page.tsx)
// --------------------
export async function signInWithPassword(formData: FormData) {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const redirectToRaw = str(formData.get("redirectTo"));

  const redirectTo = safeRedirectPath(redirectToRaw, "/teachers");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Email and password are required.")}&redirectTo=${encodeURIComponent(
        redirectTo
      )}`
    );
  }
  if (!email.endsWith(ALLOWED_DOMAIN_SUFFIX)) {
    redirect(
      `/login?error=${encodeURIComponent("Only internal emails are allowed.")}&redirectTo=${encodeURIComponent(
        redirectTo
      )}`
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  redirect(redirectTo);
}

export async function signUpWithEmailAndPassword(formData: FormData) {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const confirmPassword = str(formData.get("confirmPassword"));

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }
  if (!email.endsWith(ALLOWED_DOMAIN_SUFFIX)) {
    redirect(`/login?error=${encodeURIComponent("Only internal emails are allowed.")}`);
  }
  if (password.length < 8) {
    redirect(`/login?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/login?error=${encodeURIComponent("Passwords do not match.")}`);
  }

  const origin = getSiteURL();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/login?message=${encodeURIComponent("Account created. Please check your email to verify, then sign in.")}`);
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/teachers");
}

// --------------------
// Reviews
// --------------------
export async function createReview(formData: FormData) {
  const teacherId = str(formData.get("teacherId"));

  // ratings
  const quality = intInRange(str(formData.get("quality")), 1, 5);
  const difficulty = intInRange(str(formData.get("difficulty")), 1, 5);

  // yes/no required by RateForm, optional in ReviewForm (defaults to "yes")
  const wouldTakeAgainRaw = str(formData.get("wouldTakeAgain")).toLowerCase();
  const would_take_again = wouldTakeAgainRaw === "yes" ? true : wouldTakeAgainRaw === "no" ? false : null;

  // subject/course (new: subject; old: course)
  const subjectOrCourse = getSubjectOrCourse(formData);
  const courseValue = subjectOrCourse.value;

  // optional metadata
  const grade = str(formData.get("grade"));

  // online flag is now removed from rate page; keep backward compatibility
  const hasIsOnline = formData.has("isOnline");
  const isOnline = hasIsOnline ? bool01(getLast(formData, "isOnline")) : false;

  const comment = str(formData.get("comment"));

  // server-enforced knobs (sent by RateForm)
  const requireCourse = bool01(str(formData.get("requireCourse"))) || bool01(str(formData.get("requireSubject")));
  const requireComment = bool01(str(formData.get("requireComment")));
  const maxTags = Math.min(10, Math.max(0, Math.trunc(num(str(formData.get("maxTags"))) ?? 10)));
  const commentLimit = Math.min(1200, Math.max(50, Math.trunc(num(str(formData.get("commentLimit"))) ?? 1200)));

  const tagsRaw = str(formData.get("tags"));
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, maxTags)
        .map((t) => t.toUpperCase())
    : [];

  if (!teacherId) redirect(`/teachers?error=${encodeURIComponent("Missing teacher id.")}`);
  if (quality === null) redirect(`${teacherRatePage(teacherId)}?error=${encodeURIComponent("Quality must be 1-5.")}`);
  if (difficulty === null)
    redirect(`${teacherRatePage(teacherId)}?error=${encodeURIComponent("Difficulty must be 1-5.")}`);

  if (requireCourse && !courseValue) {
    // New UI is "select subject", so message should match that.
    redirect(`${teacherRatePage(teacherId)}?error=${encodeURIComponent("Subject is required.")}`);
  }
  if (requireComment && !comment) {
    redirect(`${teacherRatePage(teacherId)}?error=${encodeURIComponent("Review text is required.")}`);
  }
  if (comment.length > commentLimit) {
    redirect(
      `${teacherRatePage(teacherId)}?error=${encodeURIComponent(`Review is too long (max ${commentLimit} characters).`)}`
    );
  }

  // If not provided (older form), default to true to avoid blocking.
  const wta = would_take_again ?? true;

  const { supabase, user } = await requireInternalUserOrRedirect(teacherRatePage(teacherId));

  const { error } = await supabase.from("reviews").insert({
    teacher_id: teacherId,
    user_id: user.id,
    quality,
    difficulty,
    would_take_again: wta,
    comment: comment || null,
    tags,
    // stored in `course` column for backward compatibility even if UI label is "subject"
    course: courseValue || null,
    grade: grade || null,
    is_online: isOnline,
  });

  if (error) {
    redirect(`${teacherRatePage(teacherId)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(teacherPage(teacherId));
  revalidatePath("/me/ratings");
  redirect(`${teacherPage(teacherId)}#ratings`);
}

export async function updateMyReview(formData: FormData) {
  const reviewId = str(formData.get("reviewId"));
  if (!reviewId) redirect(`/me/ratings?error=${encodeURIComponent("Missing review id.")}`);

  const quality = intInRange(str(formData.get("quality")), 1, 5);
  const difficulty = intInRange(str(formData.get("difficulty")), 1, 5);

  const wouldTakeAgain = str(formData.get("wouldTakeAgain")).toLowerCase();

  // edit page currently uses "course"; allow "subject" too (future-proof)
  const { value: courseValue } = getSubjectOrCourse(formData);

  const grade = str(formData.get("grade"));

  // IMPORTANT: do not accidentally clear is_online if the field is removed from the edit form later
  const hasIsOnline = formData.has("isOnline");
  const isOnline = hasIsOnline ? bool01(getLast(formData, "isOnline")) : undefined;

  const comment = str(formData.get("comment"));

  const tagsRaw = str(formData.get("tags"));
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((t) => t.toUpperCase())
    : [];

  const editPath = `/me/ratings/${encodeURIComponent(reviewId)}/edit`;

  if (quality === null) redirect(`${editPath}?error=${encodeURIComponent("Quality must be 1-5.")}`);
  if (difficulty === null) redirect(`${editPath}?error=${encodeURIComponent("Difficulty must be 1-5.")}`);
  if (wouldTakeAgain !== "yes" && wouldTakeAgain !== "no") {
    redirect(`${editPath}?error=${encodeURIComponent("Would take again is required.")}`);
  }
  if (!courseValue) {
    // edit page still says Course code (unless你也改了它)
    redirect(`${editPath}?error=${encodeURIComponent("Course code is required.")}`);
  }
  if (comment.length > 1200) {
    redirect(`${editPath}?error=${encodeURIComponent("Comment is too long (max 1200).")}`);
  }

  const { supabase, user } = await requireInternalUserOrRedirect(editPath);

  const updatePayload: Record<string, unknown> = {
    quality,
    difficulty,
    would_take_again: wouldTakeAgain === "yes",
    course: courseValue || null,
    grade: grade || null,
    tags,
    comment: comment || null,
  };

  if (hasIsOnline) updatePayload.is_online = isOnline;

  const { data: updated, error } = await supabase
    .from("reviews")
    .update(updatePayload)
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("teacher_id")
    .maybeSingle();

  if (error || !updated) {
    redirect(`${editPath}?error=${encodeURIComponent(error?.message ?? "Update failed.")}`);
  }

  revalidatePath("/me/ratings");
  revalidatePath(teacherPage(updated.teacher_id));
  redirect(`/me/ratings?message=${encodeURIComponent("Rating updated.")}`);
}

export async function deleteMyReview(formData: FormData) {
  const reviewId = str(formData.get("reviewId"));
  if (!reviewId) redirect(`/me/ratings?error=${encodeURIComponent("Missing review id.")}`);

  const { supabase, user } = await requireInternalUserOrRedirect("/me/ratings");

  const { data: deleted, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("teacher_id")
    .maybeSingle();

  if (error || !deleted) {
    redirect(`/me/ratings?error=${encodeURIComponent(error?.message ?? "Delete failed.")}`);
  }

  revalidatePath("/me/ratings");
  revalidatePath(teacherPage(deleted.teacher_id));
  redirect(`/me/ratings?message=${encodeURIComponent("Rating deleted.")}`);
}

// --------------------
// Votes
// --------------------
export async function setReviewVote(formData: FormData) {
  const teacherId = str(formData.get("teacherId"));
  const reviewId = str(formData.get("reviewId"));
  const op = str(formData.get("op")) as "up" | "down" | "clear";

  if (!teacherId || !reviewId) throw new Error("Missing teacherId or reviewId.");
  if (op !== "up" && op !== "down" && op !== "clear") throw new Error("Invalid vote operation.");

  const { supabase, user } = await requireInternalUserOrRedirect(teacherPage(teacherId));

  if (op === "clear") {
    const { error } = await supabase.from("review_votes").delete().eq("review_id", reviewId).eq("user_id", user.id);
    if (error) throw new Error(error.message);

    revalidatePath(teacherPage(teacherId));
    return { ok: true };
  }

  const vote = op === "up" ? 1 : -1;

  const { error } = await supabase
    .from("review_votes")
    .upsert({ review_id: reviewId, user_id: user.id, vote }, { onConflict: "review_id,user_id" });

  if (error) throw new Error(error.message);

  revalidatePath(teacherPage(teacherId));
  return { ok: true };
}
