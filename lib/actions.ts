"use server";

import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

const ALLOWED_DOMAIN_SUFFIX = "@basischina.com";

function ensureAllowedEmailDomain(email: string) {
  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN_SUFFIX)) {
    return {
      error: `Please use a school email ending with ${ALLOWED_DOMAIN_SUFFIX}.`,
    };
  }
  return null;
}

export async function signInWithOtp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const domainCheck = ensureAllowedEmailDomain(email);
  if (domainCheck) return domainCheck;

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createReview(input: {
  teacherId: string;
  course: string;
  rating: number;
  difficulty: number;
  attendance: number;
  recommend: number;
  content: string;
  isOnline: number;
}) {
  const supabase = createClient();

  const {
    teacherId,
    course,
    rating,
    difficulty,
    attendance,
    recommend,
    content,
    isOnline,
  } = input;

  if (!teacherId) {
    return { error: "Teacher id is required." };
  }

  if (!course) {
    return { error: "Subject is required." };
  }

  if (!rating || rating < 1) {
    return { error: "Rating is required." };
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { error: "You must be logged in to submit a rating." };
  }

  const { error } = await supabase.from("reviews").insert({
    teacher_id: teacherId,
    user_id: user.id,
    course,
    rating,
    difficulty,
    attendance,
    recommend,
    content,
    is_online: isOnline,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateReview(input: {
  reviewId: string;
  course: string;
  rating: number;
  difficulty: number;
  attendance: number;
  recommend: number;
  content: string;
  isOnline: number;
}) {
  const supabase = createClient();

  const {
    reviewId,
    course,
    rating,
    difficulty,
    attendance,
    recommend,
    content,
    isOnline,
  } = input;

  if (!reviewId) {
    return { error: "Review id is required." };
  }

  if (!course) {
    return { error: "Subject is required." };
  }

  if (!rating || rating < 1) {
    return { error: "Rating is required." };
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { error: "You must be logged in to update a rating." };
  }

  // Ensure the user owns the review
  const { data: existing, error: existingErr } = await supabase
    .from("reviews")
    .select("id, user_id")
    .eq("id", reviewId)
    .single();

  if (existingErr || !existing) {
    return { error: "Review not found." };
  }

  if (existing.user_id !== user.id) {
    return { error: "You can only edit your own reviews." };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      course,
      rating,
      difficulty,
      attendance,
      recommend,
      content,
      is_online: isOnline,
    })
    .eq("id", reviewId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteReview(reviewId: string) {
  const supabase = createClient();

  if (!reviewId) {
    return { error: "Review id is required." };
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { error: "You must be logged in to delete a rating." };
  }

  // Ensure the user owns the review
  const { data: existing, error: existingErr } = await supabase
    .from("reviews")
    .select("id, user_id")
    .eq("id", reviewId)
    .single();

  if (existingErr || !existing) {
    return { error: "Review not found." };
  }

  if (existing.user_id !== user.id) {
    return { error: "You can only delete your own reviews." };
  }

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function voteReview(input: { reviewId: string; value: number }) {
  const supabase = createClient();
  const { reviewId, value } = input;

  if (!reviewId) return { error: "Review id is required." };
  if (![1, -1].includes(value)) return { error: "Invalid vote value." };

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { error: "You must be logged in to vote." };
  }

  const { data: existing, error: existingErr } = await supabase
    .from("review_votes")
    .select("id, value")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingErr) return { error: existingErr.message };

  if (existing) {
    // Toggle off if same vote, else update
    if (existing.value === value) {
      const { error } = await supabase
        .from("review_votes")
        .delete()
        .eq("id", existing.id);

      if (error) return { error: error.message };
      return { success: true, toggledOff: true };
    }

    const { error } = await supabase
      .from("review_votes")
      .update({ value })
      .eq("id", existing.id);

    if (error) return { error: error.message };
    return { success: true, updated: true };
  }

  const { error } = await supabase.from("review_votes").insert({
    review_id: reviewId,
    user_id: user.id,
    value,
  });

  if (error) return { error: error.message };
  return { success: true, created: true };
}
