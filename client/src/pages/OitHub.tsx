import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "wouter";

const streams = [
  {
    name: "Water OIT",
    description: "Water Treatment and Distribution fundamentals",
    practiceHref: "/quiz",
    mockHref: "/oit-mock",
    flashcardsHref: "/oit-water-flashcards",
  },
  {
    name: "Wastewater OIT",
    description: "Wastewater Treatment and Collection fundamentals",
    practiceHref: "/oit-ww",
    mockHref: "/oit-ww-mock",
    flashcardsHref: "/oit-ww-flashcards",
  },
] as const;

export default function OitHub() {
  usePageMeta({
    title: "Ontario OIT Exam Prep — Free Practice | Echelon Institute",
    description:
      "Ontario Operator-in-Training exam preparation for water and wastewater. Try practice questions, flashcards, mock exams, formulas, and process guides.",
    path: "/oit",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav currentPath="/oit" />

      <section className="mx-auto max-w-5xl px-5 pb-8 pt-12 text-center sm:px-8 sm:pt-16">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
          Ontario Operator-in-Training
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          OIT exam preparation in one clear workspace
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Choose Water or Wastewater and start with 15 practice questions. No
          account or credit card is required for the free preview. A 12-month
          pass for one selected OIT course is CA$49.
        </p>
      </section>

      <section
        aria-label="Choose an OIT study stream"
        className="mx-auto grid max-w-5xl gap-5 px-5 pb-12 sm:grid-cols-2 sm:px-8"
      >
        {streams.map(stream => (
          <article
            key={stream.name}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-extrabold">{stream.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
              {stream.description}
            </p>
            <Link
              href={stream.practiceHref}
              className="mt-5 block rounded-xl bg-teal-700 px-4 py-3 text-center font-bold text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Try 15 free questions
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href={stream.flashcardsHref}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                Flashcards
              </Link>
              <Link
                href={stream.mockHref}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                Mock exam
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-10 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">
            Included with a paid OIT Exam Pass
          </h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2 sm:text-base">
            <li>400+ practice questions organized by exam topic</li>
            <li>400+ concept flashcards with progress tracking</li>
            <li>Timed 100-question mock exam with module results</li>
            <li>AI Tutor explanations for concepts and calculations</li>
            <li>Process guides, formula sheets, and math practice</li>
            <li>12 months of access for one named learner</li>
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="rounded-xl bg-slate-900 px-5 py-3 text-center font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
            >
              View all pricing
            </Link>
            <Link
              href="/canada/ontario"
              className="rounded-xl border border-slate-300 px-5 py-3 text-center font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Browse Ontario courses
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-14 sm:px-8">
        <p className="text-sm leading-6 text-slate-500">
          OWWCO sets eligibility, registration, permitted references, and exam
          requirements. Confirm the current rules on the{" "}
          <a
            className="font-semibold text-teal-700 underline underline-offset-2"
            href="https://owwco.ca"
            rel="noopener noreferrer"
            target="_blank"
          >
            OWWCO website
          </a>
          . Echelon Institute is an independent exam-preparation provider and is
          not affiliated with or endorsed by OWWCO or the Ontario Ministry of
          the Environment, Conservation and Parks.
        </p>
      </section>
    </div>
  );
}
