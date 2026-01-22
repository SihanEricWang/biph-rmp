// app/site-guidelines/page.tsx
import Link from "next/link";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Site Guidelines · Rate My Teacher",
};

export default function SiteGuidelinesPage() {
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

        <h1 className="text-3xl font-extrabold tracking-tight">Site Guidelines</h1>

        <div className="mt-6 space-y-6 text-sm leading-7 text-neutral-800">
          <p>
            These are the official posting guidelines (“Site Guidelines”) for the Rate My Teacher-BIPH website,
            application or other interactive service ("Site”). This site is owned, operated and/or provided by the
            Molarity team(“Rate My Teacher-BIPH," "we," "us," or "our"), and these Site Guidelines are a part of, and an
            Additional Terms under, ourTerms of Use Agreement.
          </p>

          <p>
            Rate My Teacher-BIPH is an online destination for students at Basis International School Park Lane Harbour
            to research and rate their teachers and courses. Our mission is to provide a safe, student-focused forum to
            share classroom experiences, helping our fellow peers make informed choices about their education and
            elective options.
          </p>

          <h2 className="pt-2 text-lg font-extrabold tracking-tight">THE SITE</h2>
          <p>Rate My Teacher-BIPH provides user-generated feedback on teaching methods and courses at our school.</p>

          <p>
            <span className="font-semibold">Eligibility:</span> Teacher ratings should only be posted by students who
            are currently enrolled in or have previously completed a class with that teacher.
          </p>

          <p>
            <span className="font-semibold">Limits:</span> Users are limited to comment per teacher, per course to
            prohibit abuse.
          </p>

          <p>
            <span className="font-semibold">Safety First:</span> This site is not the place to report dangerous or
            illegal behavior. If you or another student are in danger, please report the situation immediately to
            school leadership or student support services.
          </p>

          <h2 className="pt-2 text-lg font-extrabold tracking-tight">HOW WE WORK</h2>
          <p>
            Our moderation team reviews submissions to ensure they align with our mission. We aim for consistency,
            regardless of which teacher or student is involved.
          </p>

          <p>
            <span className="font-semibold">No Edits:</span> We do not edit reviews to make them comply. If a review
            violates guidelines, it is removed entirely.
          </p>

          <p>
            <span className="font-semibold">Re-review:</span> Our moderators will determine if harmful posts should be
            permanently removed or restored.
          </p>

          <h2 className="pt-2 text-lg font-extrabold tracking-tight">STUDENT GUIDELINES</h2>
          <p>
            <span className="font-semibold">Be Honest:</span> Provide truthful accounts of your experience so your peers
            can rely on your feedback.
          </p>
          <p>
            <span className="font-semibold">Be Balanced:</span> Highlighting both pros and cons makes your review more
            credible and helpful.
          </p>
          <p>
            <span className="font-semibold">Stay Relevant:</span> Focus on the course and the learning experience. Do
            not comment on a teacher’s appearance, dress, age, gender, or race.
          </p>
          <p>
            <span className="font-semibold">Individual Experience:</span> Speak only for yourself. Avoid hearsay or
            speaking on behalf of other students.
          </p>
          <p>
            <span className="font-semibold">Not a Debate Forum:</span> Do not reference other reviews. If you disagree
            with someone else’s experience, simply post your own.
          </p>
          <p>
            <span className="font-semibold">Constructive Criticism:</span> If a teaching style didn't work for you,
            explain why in a way that helps others understand if it might work for them.
          </p>
          <p>
            <span className="font-semibold">Cool Down:</span> Reviews fueled by anger often contain violations that lead
            to removal. Take a moment to ensure your feedback is genuinely helpful.
          </p>

          <h2 className="pt-2 text-lg font-extrabold tracking-tight">PROHIBITED CONTENT</h2>
          <p>Comments containing the following will be removed:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-semibold">Profanity or Vulgarity:</span> Including name-calling or derogatory
              remarks regarding religion, ethnicity, race, gender, physical appearance, age, or disability.
            </li>
            <li>
              <span className="font-semibold">Private Information:</span> Any identifiable info that would allow someone
              to contact a teacher or student outside of school.
            </li>
            <li>
              <span className="font-semibold">Personal Life:</span> References to a teacher’s family, personal life, or
              sexual innuendos.
            </li>
            <li>
              <span className="font-semibold">Bias Claims:</span> Claims that a teacher shows bias for or against
              specific students or groups.
            </li>
            <li>
              <span className="font-semibold">Employment Status:</span> Claims regarding a teacher’s previous jobs or
              contract status.
            </li>
            <li>
              <span className="font-semibold">Illegal Activities:</span> Accusations of illegal behavior.
            </li>
            <li>
              <span className="font-semibold">Meta-commentary:</span> References to other comments or deleted reviews.
            </li>
            <li>
              <span className="font-semibold">Language:</span> All comments must be written in English.
            </li>
          </ul>

          <h2 className="pt-2 text-lg font-extrabold tracking-tight">TEACHER GUIDELINES</h2>
          <p>
            <span className="font-semibold">Anonymity:</span> We do not provide personal data regarding the authors of
            reviews.
          </p>
          <p>
            <span className="font-semibold">Negative Reviews:</span> We will not remove a comment simply because it is
            negative; it must violate a specific site guideline to be taken down.
          </p>
          <p>
            <span className="font-semibold">Engagement:</span> Teachers are encouraged to view feedback as a resource
            for understanding student perspectives.
          </p>
          <p>
            <span className="font-semibold">Self-Rating:</span> Teachers are prohibited from rating themselves or their
            colleagues. However, you are welcome to encourage your students to provide honest ratings at the end of a
            semester.
          </p>

          <h2 className="pt-2 text-lg font-extrabold tracking-tight">LEGAL &amp; RESERVATION OF RIGHTS</h2>
          <p>
            Rate My Teacher-BIPH provides this platform for informational purposes. We are not responsible for the
            opinions expressed by third-party users.
          </p>
          <p>
            The Site reserves the right to remove any comments deemed inappropriate, libelous, defamatory, indecent, or
            hateful. Furthermore, we reserve the right to take appropriate action—including notifying school
            authorities—regarding comments that threaten violence or bodily harm.
          </p>
        </div>
      </div>
    </main>
  );
}
