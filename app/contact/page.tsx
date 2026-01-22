// app/contact/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import BackButton from "@/components/BackButton";

const CATEGORIES = [
  "Troubleshooting",
  "Business Partnership",
  "Technical Partnership",
  "Account & Login",
  "Content Report",
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

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: { success?: string; error?: string; ticket?: string };
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

    if (!category) redirect("/contact?error=1");
    if (category === "Other" && !categoryOther) redirect("/contact?error=1");
    if (title.length < 3) redirect("/contact?error=1");
    if (description.length < 10) redirect("/contact?error=1");

    const h = headers();
    const pageUrl = h.get("referer") || null;
    const userAgent = h.get("user-agent") || null;

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        email: user.email ?? "",
        category,
        category_other: category === "Other" ? categoryOther : null,
        title,
        description,
        page_url: pageUrl,
        user_agent: userAgent,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !data?.id) redirect("/contact?error=1");

    redirect(`/contact?success=1&ticket=${encodeURIComponent(data.id)}`);
  }

  const ok = searchParams?.success === "1";
  const err = searchParams?.error === "1";
  const ticketId = (searchParams?.ticket ?? "").trim();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <BackButton
            fallbackHref="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            <span aria-hidden>←</span>
            Back
          </BackButton>
          
          <div className="text-xs text-neutral-500">Rate My Teacher · BIPH</div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Submit a ticket for help, partnerships, or suggestions.{" "}
        </p>

        {ok ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div className="font-semibold">Submitted successfully ✅</div>
            {ticketId ? (
              <div className="mt-1">
                Ticket ID: <span className="font-mono font-semibold">{shortId(ticketId)}</span>
                <span className="mx-2 text-emerald-300">·</span>
                <a className="underline underline-offset-2" href="/me/tickets">
                  View My Tickets
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {err ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Submission failed ❌ Please check your input and try again.
          </div>
        ) : null}

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
                
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">
                  Other (only if you selected “Other”)
                </label>
                <input
                  name="category_other"
                  placeholder="e.g., Media inquiry / Club partnership / Sponsorship / Data collaboration..."
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Title</label>
                <input
                  name="title"
                  placeholder="Summarize your request in one sentence"
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Description</label>
                <textarea
                  name="description"
                  placeholder="Describe what happened, what you expected, and where it occurred (page link, teacher id, steps, etc.)"
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
                Your signed-in email will be recorded for follow-up (not displayed publicly).
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
