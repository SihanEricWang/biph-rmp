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
  return Number.isFinite(n) ? n : null;
}

function intInRange(v: string, min: number, max: number): number | null {
  const n = num(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  if (i < min || i > max) return null;
  return i;
}

function bool01(v: string): boolean {
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes" || v.toLowerCase() === "on";
}

function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN_SUFFIX);
}

function teacherPage(teacherId: string) {
  return `/teachers/${teacherId}`;
}

function teacherRatePage(teacherId: string) {
  return `/teachers/${teacherId}/rate`;
}

function myReviewEditPage(reviewId: string) {
  return `/me/ratings/${reviewId}/edit`;
}

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect(`/login?error=${encodeURIComponent("Please sign in.")}`);
  }

  if (!isAllowedEmail(user.email)) {
    redirect(`/login?error=${encodeURIComponent("Only internal emails are allowed.")}`);
  }

  return { supabase, user };
}

// --------------------
// Auth actions (used by app/login/page.tsx)
// --------------------
export async function signInWithPassword(formData: FormData) {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const redirectToRaw = str(formData.get("redirectTo"));

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  if (!isAllowedEmail(email)) {
    redirect(`/login?error=${encodeURIComponent("Only internal emails are allowed.")}`);
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const redirectTo = redirectToRaw || "/teachers";
  redirect(redirectTo);
}

export async function signUpWithEmailAndPassword(formData: FormData) {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const redirectToRaw = str(formData.get("redirectTo"));

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  if (!isAllowedEmail(email)) {
    redirect(`/login?error=${encodeURIComponent("Only internal emails are allowed.")}`);
  }

  const supabase = createSupabaseServerClient();

  const origin = headers().get("origin") ?? "";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const redirectTo = redirectToRaw || "/teachers";
  redirect(redirectTo);
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// --------------------
// Reviews (create/update/delete/vote)
// --------------------
export async function createReview(formData: FormData) {
  const teacherId = str(formData.get("teacherId"));

  // ratings
  const quality = intInRange(str(formData.get("quality")), 1, 5);
  const difficulty = intInRange(str(formData.get("difficulty")), 1, 5);

  // yes/no required by RateForm, optional in ReviewForm (defaults to "yes")
  const wouldTakeAgainRaw = str(formData.get("wouldTakeAgain")).toLowerCase();
  const would_take_again = wouldTakeAgainRaw === "yes" ? true : wouldTakeAgainRaw === "no" ? false : null;

  // optional metadata
  const course = str(formData.get("course"));
  const grade = str(formData.get("grade"));
  const isOnline = bool01(getLast(formData, "isOnline"));
  const comment = str(formData.get("comment"));

  // server-side constraints (set by forms)
  const requireCourse = bool01(str(formData.get("requireCourse")));
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
  if (difficulty === null) redirect(`${teacherRatePage(teacherId)}?error=${encodeURIComponent("Difficulty must be 1-5.")}`);

  if (requireCourse && !course) {
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
  const would_take_again_safe = would_take_again ?? true;

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("reviews").insert({
    teacher_id: teacherId,
    user_id: user.id,
    quality,
    difficulty,
    would_take_again: would_take_again_safe,
    tags,
    comment: comment || null,
    course: course || null,
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
  const course = str(formData.get("course"));
  const grade = str(formData.get("grade"));
  const isOnline = bool01(getLast(formData, "isOnline"));
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

  const editPath = myReviewEditPage(reviewId);

  if (quality === null) redirect(`${editPath}?error=${encodeURIComponent("Quality must be 1-5.")}`);
  if (difficulty === null) redirect(`${editPath}?error=${encodeURIComponent("Difficulty must be 1-5.")}`);
  if (wouldTakeAgain !== "yes" && wouldTakeAgain !== "no") {
    redirect(`${editPath}?error=${encodeURIComponent("Would take again is required.")}`);
  }
  if (!course) {
    redirect(`${editPath}?error=${encodeURIComponent("Subject is required.")}`);
  }
  if (comment.length > 1200) {
    redirect(`${editPath}?error=${encodeURIComponent("Review is too long (max 1200 characters).")}`);
  }

  const { supabase, user } = await requireUser();

  const { data: updated, error } = await supabase
    .from("reviews")
    .update({
      quality,
      difficulty,
      would_take_again: wouldTakeAgain === "yes",
      course,
      grade: grade || null,
      is_online: isOnline,
      tags,
      comment: comment || null,
    })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("teacher_id")
    .maybeSingle();

  if (error || !updated) {
    redirect(`${editPath}?error=${encodeURIComponent(error?.message ?? "Update failed.")}`);
  }

  revalidatePath("/me/ratings");
  revalidatePath(teacherPage(updated.teacher_id));
  redirect(`${teacherPage(updated.teacher_id)}#ratings`);
}

export async function deleteMyReview(formData: FormData) {
  const reviewId = str(formData.get("reviewId"));
  const teacherId = str(formData.get("teacherId"));

  if (!reviewId) redirect(`/me/ratings?error=${encodeURIComponent("Missing review id.")}`);
  if (!teacherId) redirect(`/me/ratings?error=${encodeURIComponent("Missing teacher id.")}`);

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);

  if (error) {
    redirect(`${teacherPage(teacherId)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/me/ratings");
  revalidatePath(teacherPage(teacherId));
  redirect(`${teacherPage(teacherId)}#ratings`);
}

export async function setReviewVote(formData: FormData) {
  const teacherId = str(formData.get("teacherId"));
  const reviewId = str(formData.get("reviewId"));
  const op = str(formData.get("op")); // up/down/remove

  if (!teacherId || !reviewId) {
    return { ok: false, error: "Missing ids." };
  }

  const { supabase, user } = await requireUser();

  if (op === "remove") {
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
