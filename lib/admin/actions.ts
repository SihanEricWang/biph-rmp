// lib/admin/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { clearAdminSession, requireAdmin, safeNextPath, setAdminSession } from "./session";

function str(v: FormDataEntryValue | null | undefined) {
  return String(v ?? "").trim();
}

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// --------------------
// Auth
// --------------------
export async function adminLogin(formData: FormData) {
  const username = str(formData.get("username"));
  const password = str(formData.get("password"));
  const nextRaw = str(formData.get("next"));

  const okUser = safeEq(username, mustGetEnv("ADMIN_USERNAME"));
  const okPass = safeEq(password, mustGetEnv("ADMIN_PASSWORD"));

  if (!okUser || !okPass) {
    redirect(`/admin/login?error=${encodeURIComponent("Invalid admin credentials.")}`);
  }

  setAdminSession(username);
  redirect(safeNextPath(nextRaw, "/admin/teachers"));
}

export async function adminLogout() {
  requireAdmin("/admin/teachers");
  clearAdminSession();
  redirect("/admin/login?message=" + encodeURIComponent("Logged out."));
}

// --------------------
// Teachers
// --------------------
export async function adminCreateTeacher(formData: FormData) {
  requireAdmin("/admin/teachers");
  const full_name = str(formData.get("full_name"));
  const subject = str(formData.get("subject")) || null;

  if (!full_name) redirect(`/admin/teachers?error=${encodeURIComponent("Name is required.")}`);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teachers").insert({ full_name, subject });

  if (error) redirect(`/admin/teachers?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/teachers");
  revalidatePath("/admin/teachers");
  redirect(`/admin/teachers?message=${encodeURIComponent("Teacher created.")}`);
}

export async function adminUpdateTeacher(formData: FormData) {
  requireAdmin("/admin/teachers");
  const id = str(formData.get("id"));
  const full_name = str(formData.get("full_name"));
  const subject = str(formData.get("subject")) || null;

  if (!id) redirect(`/admin/teachers?error=${encodeURIComponent("Missing teacher id.")}`);
  if (!full_name) redirect(`/admin/teachers/${encodeURIComponent(id)}/edit?error=${encodeURIComponent("Name is required.")}`);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teachers").update({ full_name, subject }).eq("id", id);

  if (error) redirect(`/admin/teachers/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
  revalidatePath("/admin/teachers");
  redirect(`/admin/teachers/${encodeURIComponent(id)}/edit?message=${encodeURIComponent("Saved.")}`);
}

export async function adminDeleteTeacher(formData: FormData) {
  requireAdmin("/admin/teachers");
  const id = str(formData.get("id"));
  if (!id) redirect(`/admin/teachers?error=${encodeURIComponent("Missing teacher id.")}`);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);

  if (error) {
    // 常见原因：reviews.teacher_id 有外键限制
    redirect(`/admin/teachers?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teachers");
  revalidatePath("/admin/teachers");
  redirect(`/admin/teachers?message=${encodeURIComponent("Teacher deleted.")}`);
}

// --------------------
// Reviews (moderation/edit/delete)
// --------------------
export async function adminUpdateReview(formData: FormData) {
  requireAdmin("/admin/reviews");
  const id = str(formData.get("id"));
  const teacher_id = str(formData.get("teacher_id"));

  const quality = Number(str(formData.get("quality")));
  const difficulty = Number(str(formData.get("difficulty")));
  const would_take_again = str(formData.get("would_take_again")) === "yes";
  const course = str(formData.get("course")) || null;
  const grade = str(formData.get("grade")) || null;
  const is_online = str(formData.get("is_online")) === "1";
  const comment = str(formData.get("comment")) || null;

  const tagsRaw = str(formData.get("tags"));
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((t) => t.toUpperCase())
    : [];

  if (!id) redirect(`/admin/reviews?error=${encodeURIComponent("Missing review id.")}`);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update({ quality, difficulty, would_take_again, course, grade, is_online, comment, tags })
    .eq("id", id);

  if (error) redirect(`/admin/reviews/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(error.message)}`);

  if (teacher_id) {
    revalidatePath(`/teachers/${teacher_id}`);
  }
  revalidatePath("/admin/reviews");
  redirect(`/admin/reviews/${encodeURIComponent(id)}/edit?message=${encodeURIComponent("Saved.")}`);
}

export async function adminDeleteReview(formData: FormData) {
  requireAdmin("/admin/reviews");
  const id = str(formData.get("id"));
  const teacher_id = str(formData.get("teacher_id"));
  if (!id) redirect(`/admin/reviews?error=${encodeURIComponent("Missing review id.")}`);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) redirect(`/admin/reviews?error=${encodeURIComponent(error.message)}`);

  if (teacher_id) revalidatePath(`/teachers/${teacher_id}`);
  revalidatePath("/admin/reviews");
  redirect(`/admin/reviews?message=${encodeURIComponent("Review deleted.")}`);
}

// --------------------
// Tickets (status + reply(admin_note))
// --------------------
export async function adminUpdateTicket(formData: FormData) {
  requireAdmin("/admin/tickets");
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  const admin_note = str(formData.get("admin_note")) || null;

  if (!id) redirect(`/admin/tickets?error=${encodeURIComponent("Missing ticket id.")}`);
  if (!status) redirect(`/admin/tickets/${encodeURIComponent(id)}?error=${encodeURIComponent("Status is required.")}`);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("support_tickets").update({ status, admin_note }).eq("id", id);

  if (error) redirect(`/admin/tickets/${encodeURIComponent(id)}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${id}`);
  redirect(`/admin/tickets/${encodeURIComponent(id)}?message=${encodeURIComponent("Updated.")}`);
}
