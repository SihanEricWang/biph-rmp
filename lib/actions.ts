// lib/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase";

const ALLOWED_DOMAIN = "@basischina.com";

function normalizeEmail(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim().toLowerCase();
}

function readString(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim();
}

function ensureAllowedEmail(email: string) {
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    throw new Error(`Only internal email addresses (${ALLOWED_DOMAIN}) are allowed.`);
  }
}

export async function signInWithPassword(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = readString(formData.get("password"));
  const redirectTo = readString(formData.get("redirectTo")) || "/teachers";

  try {
    if (!email || !password) throw new Error("Please enter your email and password.");
    ensureAllowedEmail(email);

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new Error(error.message);

    redirect(redirectTo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign in failed.";
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }
}

export async function signUpWithEmailAndPassword(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = readString(formData.get("password"));
  const confirmPassword = readString(formData.get("confirmPassword"));

  try {
    if (!email || !password) throw new Error("Please enter your email and password.");
    ensureAllowedEmail(email);

    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (password !== confirmPassword) throw new Error("Passwords do not match.");

    const supabase = createSupabaseServerClient();

    const origin = headers().get("origin") ?? "";
    const emailRedirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (error) throw new Error(error.message);

    redirect(
      `/login?message=${encodeURIComponent(
        "Account created. Please check your email to verify your address, then sign in."
      )}`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign up failed.";
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("You have been signed out."));
}


// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase";

const ALLOWED_DOMAIN = "@basischina.com";

function clean(s: FormDataEntryValue | null) {
  return String(s ?? "").trim();
}

function parseIntSafe(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export async function createReview(formData: FormData) {
  const teacherId = clean(formData.get("teacherId"));
  const quality = parseIntSafe(clean(formData.get("quality")));
  const difficulty = parseIntSafe(clean(formData.get("difficulty")));
  const wouldTakeAgainRaw = clean(formData.get("wouldTakeAgain")).toLowerCase();
  const comment = clean(formData.get("comment"));
  const course = clean(formData.get("course"));

  const tagsRaw = clean(formData.get("tags"));
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((t) => t.toUpperCase())
    : [];

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  const user = userData.user;
  if (!user) {
    redirect(`/login?error=${encodeURIComponent("Please sign in to post a review.")}`);
  }
  if (user.email && !user.email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    redirect(`/login?error=${encodeURIComponent("Only internal emails are allowed.")}`);
  }

  if (!teacherId) redirect(`/teachers?error=${encodeURIComponent("Missing teacher id.")}`);
  if (!quality || quality < 1 || quality > 5) redirect(`/professor/${teacherId}?error=${encodeURIComponent("Invalid quality.")}`);
  if (!difficulty || difficulty < 1 || difficulty > 5) redirect(`/professor/${teacherId}?error=${encodeURIComponent("Invalid difficulty.")}`);

  const would_take_again = wouldTakeAgainRaw === "yes";

  if (comment.length > 1200) {
    redirect(`/professor/${teacherId}?error=${encodeURIComponent("Comment is too long (max 1200).")}`);
  }

  const { error } = await supabase.from("reviews").insert({
    teacher_id: teacherId,
    user_id: user.id,
    quality,
    difficulty,
    would_take_again,
    comment: comment || null,
    tags,
    course: course || null,
  });

  if (error) {
    redirect(`/professor/${teacherId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/professor/${teacherId}`);
  redirect(`/professor/${teacherId}#ratings`);
}
