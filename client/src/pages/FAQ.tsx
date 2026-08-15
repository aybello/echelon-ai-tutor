import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

const questions = [
  ["What does Echelon include?", "Courses include practice questions, mock exams, explanations, formula resources, progress tracking, and AI-assisted tutoring. Exact inclusions and access terms are shown before checkout."],
  ["Which certifications are supported?", "Echelon supports Ontario operator certification courses and WPI-aligned water treatment, wastewater treatment, water distribution, and wastewater collection courses. US state coverage varies and is labelled full, partial, or limited on each state page."],
  ["Are you affiliated with a certifying authority?", "No. Echelon Institute is an independent exam-preparation provider and is not affiliated with MOECP, OWWCO, WPI, EOCP, or a US state certifying authority."],
  ["How many practice questions are available?", "The platform contains more than 18,000 practice questions across its current course catalogue. Individual course totals are shown on the pricing page."],
  ["How long does access last?", "An Individual Exam Pass provides 12 months of access to one selected course. Team licences use the 3-, 6-, or 12-month term displayed at checkout, subject to the activation deadline."],
  ["Can I try Echelon before paying?", "Yes. The first 15 questions on every course are available without an account or credit card so you can evaluate the experience before purchasing."],
  ["Does Echelon guarantee that I will pass?", "No exam-preparation service can guarantee an outcome. Echelon helps you practise, identify weak areas, and prepare against the applicable exam blueprint."],
  ["How do refunds work?", "Refund eligibility depends on the product and timing. Review the Refund Policy before purchase or contact abello@echeloninstitute.ca."],
] as const;

export default function FAQ() {
  usePageMeta({ title: "Frequently Asked Questions | Echelon Institute", description: "Clear answers about Echelon courses, certification coverage, access terms, pricing, refunds, and institutional plans.", keywords: "Echelon Institute FAQ, operator certification exam prep" });
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <SiteNav currentPath="/faq" />
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Support</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mt-4 text-lg text-slate-600">Straight answers about coverage, access, and what Echelon can and cannot promise.</p>
      <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">
        {questions.map(([question, answer]) => <section key={question} className="py-6">
          <h2 className="text-lg font-semibold">{question}</h2>
          <p className="mt-2 leading-7 text-slate-600">{answer}</p>
        </section>)}
      </div>
      <p className="mt-8 text-slate-600">Still need help? <a className="font-semibold text-blue-700 underline" href="mailto:abello@echeloninstitute.ca">Email Echelon</a> or review our <Link className="font-semibold text-blue-700 underline" href="/terms">Terms</Link>.</p>
    </section>
  </main>;
}
