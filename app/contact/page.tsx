// app/contact/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";

const CATEGORIES = [
  "Troubleshooting",
  "Business Partnership",
  "Technical Partnership",
  "Account & Login",
  "Report Content",
  "Bug Report",
  "Feature Request",
  "Data Correction",
  "Other",
] as const;

function cleanStr(v: unknown, maxLen: number) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string };
}) {
  async function createTicket(formData: FormData) {
    "use server";

    const supabase = createSupabaseServerClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      redirect(`/login?redirectTo=${encodeURIComponent("/contact")}`);
    }

    const category = cleanStr(formData.get("category"), 40);
    const categoryOther = cleanStr(formData.get("category_other"), 60);
    const title = cleanStr(formData.get("title"), 120);
    const description = cleanStr(formData.get("description"), 4000);

    // Basic validation
    if (!category) redirect("/contact?error=1");
    if (category === "Other" && !categoryOther) redirect("/contact?error=1");
    if (title.length < 3) redirect("/contact?error=1");
    if (description.length < 10) redirect("/contact?error=1");

    // Context (optional but useful)
    const h = headers();
    const pageUrl = h.get("referer") || null;
    const userAgent = h.get("user-agent") || null;

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      email: user.email ?? "",
      category,
      category_other: category === "Other" ? categoryOther : null,
      title,
      description,
      page_url: pageUrl,
      user_agent: userAgent,
      status: "open",
    });

    if (error) {
      redirect("/contact?error=1");
    }

    redirect("/contact?success=1");
  }

  const ok = searchParams?.success === "1";
  const err = searchParams?.error === "1";

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            <span aria-hidden>←</span>
            Back
          </Link>
          <div className="text-xs text-neutral-500">Rate My Teacher · BIPH</div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Submit a ticket for questions, partnerships, or suggestions.{" "}
          <span className="font-semibold">Do not use this form to report immediate danger</span>. If you or someone else
          is in danger, contact school leadership or student support services right away.
        </p>

        {ok && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Submitted ✅ We’ll review it as soon as possible.
          </div>
        )}

        {err && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Submission failed ❌ Please check the form and try again.
          </div>
        )}

        <form action={createTicket} className="mt-8 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="grid gap-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-900">Category</label>
                <select
                  name="category"
                  defaultValue="Troubleshooting"
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-neutral-500">
                  Common categories included: Account &amp; Login, Report Content, Bug Report, Feature Request, Data
                  Correction.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">
                  Other (only if you selected “Other”)
                </label>
                <input
                  name="category_other"
                  placeholder="e.g., Media inquiry / Club collaboration / Sponsorship / Data partnership..."
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Title</label>
                <input
                  name="title"
                  placeholder="A short summary of your request"
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Description</label>
                <textarea
                  name="description"
                  placeholder="Please include details: what happened, what you expected, and where (page link/teacher id)."
                  className="mt-2 min-h-[160px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white hover:opacity-90"
              >
                Submit
              </button>

              <p className="text-xs text-neutral-500">
                Your account email is saved with the ticket for follow-up (not displayed publicly).
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
