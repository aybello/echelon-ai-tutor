import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import SiteNav from "@/components/SiteNav";
import { ElectricianDiagramLibrary } from "@/components/ElectricianDiagrams";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trpc } from "@/lib/trpc";
import {
  ELECTRICIAN_309A,
  ELECTRICIAN_309A_MODULES,
  type Electrician309AModuleCode,
} from "../../../shared/electrician309aBlueprint";

const DEMO_TARGETS: Record<Electrician309AModuleCode, number> = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
};

const MODULE_SHORT_NAMES: Record<Electrician309AModuleCode, string> = {
  A: "Occupational Skills",
  B: "Distribution & Services",
  C: "Wiring Systems",
  D: "Motors & Controls",
  E: "Signalling & Communications",
};

type ReviewQuestion = {
  module: Electrician309AModuleCode;
  correctIndex: number;
  task: string;
  difficulty: string;
  isCalc: boolean;
  question: string;
  options: readonly string[];
  explanation: string;
  blueprintObjective: string;
};

function buildDiagnostic(reviewQuestions: readonly ReviewQuestion[]) {
  return ELECTRICIAN_309A_MODULES.flatMap((module) =>
    reviewQuestions
      .filter((question) => question.module === module.code)
      .slice(0, DEMO_TARGETS[module.code]),
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="min-h-screen bg-slate-50 text-[#1E3A5F]">
      <SiteNav currentPath={location} variant="marketing" />
      {children}
    </div>
  );
}

export default function Electrician309ADemo() {
  const [location] = useLocation();
  usePageMeta({
    title: "309A Electrician Red Seal Diagnostic | Echelon Institute",
    description:
      "Preview Echelon Institute's Ontario 309A Electrician — Construction & Maintenance Red Seal diagnostic, aligned to the current official exam blueprint.",
    noindex: true,
  });

  const reviewQuery = trpc.electricianReview.get309APublicPreview.useQuery();
  const diagnostic = useMemo(
    () => buildDiagnostic((reviewQuery.data ?? []) as ReviewQuestion[]),
    [reviewQuery.data],
  );
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<
    { module: Electrician309AModuleCode; correct: boolean }[]
  >([]);
  const [confirmed, setConfirmed] = useState(false);

  const current = diagnostic[index];
  const complete = started && index >= diagnostic.length;

  const moduleResults = useMemo(() => {
    return ELECTRICIAN_309A_MODULES.map((module) => {
      const moduleAnswers = answers.filter((answer) => answer.module === module.code);
      const correct = moduleAnswers.filter((answer) => answer.correct).length;
      return {
        code: module.code,
        label: MODULE_SHORT_NAMES[module.code],
        correct,
        total: moduleAnswers.length,
        percent: moduleAnswers.length ? Math.round((correct / moduleAnswers.length) * 100) : 0,
      };
    });
  }, [answers]);

  const totalCorrect = answers.filter((answer) => answer.correct).length;
  const score = answers.length ? Math.round((totalCorrect / answers.length) * 100) : 0;
  const weakest = moduleResults
    .filter((result) => result.total > 0)
    .sort((a, b) => a.percent - b.percent)[0];

  const reset = () => {
    setStarted(false);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setConfirmed(false);
  };

  const confirm = () => {
    if (selected === null || confirmed || !current) return;
    setAnswers((previous) => [
      ...previous,
      { module: current.module, correct: selected === current.correctIndex },
    ]);
    setConfirmed(true);
  };

  const next = () => {
    if (!confirmed) return;
    setIndex((value) => value + 1);
    setSelected(null);
    setConfirmed(false);
  };

  if (reviewQuery.isLoading) {
    return <PageShell><main className="min-h-[65vh]" aria-label="Loading 309A draft preview" /></PageShell>;
  }

  if (reviewQuery.error || diagnostic.length === 0) {
    return (
      <PageShell>
        <main className="mx-auto flex min-h-[65vh] max-w-xl items-center px-5 text-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm leading-6 text-slate-600">The 309A draft preview is temporarily unavailable. Please try again shortly.</p>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#1E3A5F]">
      <SiteNav currentPath={location} variant="marketing" />

      {!started ? (
        <>
          <section className="overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#0047AB] to-[#087C99] text-white">
            <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100">
                  Electrician 309A · Public Draft Preview
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                  Start your 309A readiness check with Echelon Institute.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
                  Try a blueprint-aligned diagnostic for Ontario Electrician — Construction & Maintenance candidates. See how the five Red Seal Major Work Activities shape your study plan.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="rounded-xl bg-white px-6 py-3.5 font-extrabold text-[#0047AB] shadow-lg shadow-slate-950/15 transition hover:bg-cyan-50"
                  >
                    Start 10-question diagnostic
                  </button>
                  <div className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-blue-50">
                    100 questions · 4 hours · 70% pass mark
                  </div>
                </div>
                <p className="mt-5 max-w-2xl text-xs leading-5 text-blue-100/80">
                  This is an original Echelon Institute draft preview—not a full course, mock exam, or Canadian Electrical Code preparation product. Echelon's research review is ongoing.
                </p>
              </div>

              <aside className="rounded-3xl border border-blue-100/30 bg-white p-6 text-[#1E3A5F] shadow-2xl shadow-slate-950/20">
                <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current exam blueprint</p>
                    <p className="mt-1 text-xl font-extrabold">Construction Electrician</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                    <div className="text-2xl font-black text-[#0047AB]">309A</div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Ontario</div>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {ELECTRICIAN_309A_MODULES.map((module) => (
                    <div key={module.code}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <span className="font-semibold text-slate-700">{module.code}. {MODULE_SHORT_NAMES[module.code]}</span>
                        <span className="font-black text-[#1E3A5F]">{module.weightPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#00A8B5]" style={{ width: `${module.weightPercent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#0047AB]">A new Echelon Institute certification path</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1E3A5F]">The same focused learning approach, built for electrician candidates.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Blueprint aligned", "This preview follows the current Red Seal Major Work Activity weighting instead of treating every topic equally."],
                ["Readiness snapshot", "Your result identifies which trade areas deserve the most attention as the full course is built."],
                ["Built in the Echelon system", "The diagnostic is the first step toward a course workspace with study notes, practice, mock exams, and progress tools."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-1.5 w-12 rounded-full bg-[#00A8B5]" />
                  <h3 className="mt-5 text-lg font-extrabold text-[#1E3A5F]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-y border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
              <div className="mb-8 max-w-3xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#0047AB]">Visual learning library</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1E3A5F]">Build the mental models before you meet the questions.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">These original Echelon Institute concept diagrams are being built alongside the 309A question bank. They teach relationships and troubleshooting logic—not code tables or installation prescriptions.</p>
              </div>
              <ElectricianDiagramLibrary />
            </div>
          </section>
        </>
      ) : complete ? (
        <main className="mx-auto max-w-4xl px-5 py-12 md:py-16">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0047AB]">Diagnostic complete</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-[#1E3A5F] md:text-5xl">Your readiness snapshot</h1>
                <p className="mt-3 text-slate-600">{totalCorrect} of {diagnostic.length} correct</p>
              </div>
              <div className="text-right"><div className="text-6xl font-black text-[#0047AB]">{score}%</div><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Diagnostic score</div></div>
            </div>
            <div className="mt-8 space-y-4">
              {moduleResults.map((result) => (
                <div key={result.code} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4"><span className="font-bold text-[#1E3A5F]">{result.code}. {result.label}</span><span className="text-sm font-black text-[#1E3A5F]">{result.total ? `${result.percent}%` : "—"}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#00A8B5]" style={{ width: `${result.total ? result.percent : 0}%` }} /></div>
                </div>
              ))}
            </div>
            {weakest && <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0047AB]">Focus next</p><p className="mt-2 text-lg font-extrabold text-[#1E3A5F]">{weakest.code}. {weakest.label}</p><p className="mt-1 text-sm leading-6 text-slate-600">The future Echelon Institute course will turn this gap into targeted practice, explanations, mock exams, and a personalized readiness plan.</p></div>}
            <div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={reset} className="rounded-xl bg-[#0047AB] px-5 py-3 font-extrabold text-white transition hover:bg-[#003985]">Run preview again</button><div className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600">Next build: full bank · mock exam · study notes · AI Tutor</div></div>
          </section>
        </main>
      ) : current ? (
        <main className="mx-auto max-w-4xl px-5 py-12 md:py-16">
          <div className="mb-6 flex items-center justify-between text-sm text-slate-600"><span>Question {index + 1} of {diagnostic.length}</span><span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-[#0047AB]">{current.module}. {MODULE_SHORT_NAMES[current.module]}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#00A8B5] transition-all" style={{ width: `${((index + (confirmed ? 1 : 0)) / diagnostic.length) * 100}%` }} /></div>
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{current.task} · {current.difficulty}</span>{current.isCalc && <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-[#0047AB]">Calculation</span>}</div>
            <h1 className="mt-5 text-2xl font-extrabold leading-9 text-[#1E3A5F] md:text-3xl">{current.question}</h1>
            <div className="mt-7 grid gap-3">
              {current.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                const isCorrect = confirmed && optionIndex === current.correctIndex;
                const isWrong = confirmed && isSelected && optionIndex !== current.correctIndex;
                return <button key={option} type="button" disabled={confirmed} onClick={() => setSelected(optionIndex)} className={`rounded-xl border p-4 text-left text-sm font-semibold leading-6 transition md:text-base ${isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" : isWrong ? "border-rose-400 bg-rose-50 text-rose-900" : isSelected ? "border-[#0047AB] bg-blue-50 text-[#1E3A5F]" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"}`}><span className="mr-3 text-slate-400">{String.fromCharCode(65 + optionIndex)}.</span>{option}</button>;
              })}
            </div>
            {confirmed && <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5"><p className="font-extrabold text-[#1E3A5F]">{selected === current.correctIndex ? "Correct." : "Not quite."}</p><p className="mt-2 text-sm leading-6 text-slate-700">{current.explanation}</p><p className="mt-3 text-xs text-slate-500">Blueprint: {current.blueprintObjective} · Review status: Echelon draft</p></div>}
            <div className="mt-7 flex justify-end">{!confirmed ? <button type="button" disabled={selected === null} onClick={confirm} className="rounded-xl bg-[#0047AB] px-5 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">Confirm answer</button> : <button type="button" onClick={next} className="rounded-xl bg-[#0047AB] px-5 py-3 font-extrabold text-white">{index === diagnostic.length - 1 ? "See readiness" : "Next question"}</button>}</div>
          </section>
        </main>
      ) : null}

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-8 text-xs leading-5 text-slate-500">Official exam parameters used in this prototype: {ELECTRICIAN_309A.examQuestions} questions, {ELECTRICIAN_309A.examDurationMinutes / 60} hours, {ELECTRICIAN_309A.passMarkPercent}% pass mark. Echelon Institute is not affiliated with or endorsed by the Red Seal Program or Skilled Trades Ontario.</div></footer>
    </div>
  );
}
