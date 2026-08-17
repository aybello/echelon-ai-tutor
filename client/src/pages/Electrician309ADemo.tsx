import { useMemo, useState } from "react";
import { Link } from "wouter";
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

export default function Electrician309ADemo() {
  usePageMeta({
    title: "309A Electrician Red Seal Diagnostic | Echelon Institute",
    description:
      "Preview Echelon's Ontario 309A Electrician — Construction & Maintenance Red Seal diagnostic, aligned to the current official exam blueprint.",
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
    return <main className="min-h-screen bg-slate-950" aria-label="Loading 309A draft preview" />;
  }

  if (reviewQuery.error || diagnostic.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <p className="max-w-md text-sm leading-6 text-slate-300">
          The 309A draft preview is temporarily unavailable. Please try again shortly.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-lg font-black tracking-tight text-white">
            ECHELON <span className="text-teal-400">INSTITUTE</span>
          </Link>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
            SKILLED TRADES LAB · PUBLIC DRAFT PREVIEW
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        {!started ? (
          <>
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <section>
                <div className="mb-5 inline-flex rounded-full bg-teal-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-teal-300">
                  Echelon for Electricians
                </div>
                <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
                  Know exactly where you stand before the 309A Red Seal exam.
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                  A blueprint-aligned diagnostic for Ontario Electrician — Construction & Maintenance candidates. Echelon measures performance across the five official Red Seal Major Work Activities, identifies weak areas, and builds a focused study path.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="rounded-xl bg-teal-400 px-6 py-3.5 font-extrabold text-slate-950 transition hover:bg-teal-300"
                  >
                    Start 10-question diagnostic
                  </button>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
                    100 questions · 4 hours · 70% pass mark
                  </div>
                </div>

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  This public preview uses original Echelon Institute draft items mapped to the current Red Seal blueprint. It is not a full course, mock exam, or Canadian Electrical Code preparation product; technical SME review is ongoing.
                </p>
              </section>

              <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-teal-950/30">
                <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Current exam blueprint
                    </p>
                    <p className="mt-1 text-xl font-extrabold">Construction Electrician</p>
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
                    <div className="text-2xl font-black text-teal-300">309A</div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Ontario</div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {ELECTRICIAN_309A_MODULES.map((module) => (
                    <div key={module.code}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <span className="font-semibold text-slate-200">
                          {module.code}. {MODULE_SHORT_NAMES[module.code]}
                        </span>
                        <span className="font-black text-white">{module.weightPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-teal-400"
                          style={{ width: `${module.weightPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <section className="mt-16 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl">🎯</div>
                <h2 className="mt-4 text-lg font-extrabold">Blueprint aligned</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Practice follows the current Red Seal exam weighting instead of treating every topic equally.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl">🧠</div>
                <h2 className="mt-4 text-lg font-extrabold">Gap detection</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Echelon turns answers into an immediate view of strengths and weak trade areas.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl">⚡</div>
                <h2 className="mt-4 text-lg font-extrabold">Built for the next trade</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  This is the first proof that the same Echelon readiness engine can expand beyond water operations.
                </p>
              </div>
            </section>
          </>
        ) : complete ? (
          <section className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-300">
                Diagnostic complete
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <h1 className="text-4xl font-black md:text-5xl">Your readiness snapshot</h1>
                  <p className="mt-3 text-slate-400">
                    {totalCorrect} of {diagnostic.length} correct
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black text-teal-300">{score}%</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Diagnostic score</div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {moduleResults.map((result) => (
                  <div key={result.code} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold">
                        {result.code}. {result.label}
                      </span>
                      <span className="text-sm font-black">{result.total ? `${result.percent}%` : "—"}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${result.total ? result.percent : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {weakest && (
                <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-200">Focus next</p>
                  <p className="mt-2 text-lg font-extrabold">
                    {weakest.code}. {weakest.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/70">
                    The full Echelon course will turn this gap into targeted practice, explanations, mock exams, and a personalized readiness plan.
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl bg-teal-400 px-5 py-3 font-extrabold text-slate-950 hover:bg-teal-300"
                >
                  Run demo again
                </button>
                <div className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-400">
                  Next build: full bank · mock exam · AI Tutor · readiness engine
                </div>
              </div>
            </div>
          </section>
        ) : current ? (
          <section className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between text-sm text-slate-400">
              <span>
                Question {index + 1} of {diagnostic.length}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 font-bold text-slate-300">
                {current.module}. {MODULE_SHORT_NAMES[current.module]}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-teal-400 transition-all"
                style={{ width: `${((index + (confirmed ? 1 : 0)) / diagnostic.length) * 100}%` }}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  {current.task} · {current.difficulty}
                </span>
                {current.isCalc && (
                  <span className="rounded-md bg-blue-400/10 px-2 py-1 text-[10px] font-black uppercase text-blue-300">
                    Calculation
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-2xl font-extrabold leading-9 md:text-3xl">
                {current.question}
              </h1>

              <div className="mt-7 grid gap-3">
                {current.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrect = confirmed && optionIndex === current.correctIndex;
                  const isWrong = confirmed && isSelected && optionIndex !== current.correctIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={confirmed}
                      onClick={() => setSelected(optionIndex)}
                      className={`rounded-xl border p-4 text-left text-sm font-semibold leading-6 transition md:text-base ${
                        isCorrect
                          ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-100"
                          : isWrong
                            ? "border-rose-400/70 bg-rose-400/10 text-rose-100"
                            : isSelected
                              ? "border-teal-400 bg-teal-400/10 text-white"
                              : "border-white/10 bg-slate-950/30 text-slate-200 hover:border-white/25 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="mr-3 text-slate-500">{String.fromCharCode(65 + optionIndex)}.</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {confirmed && (
                <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-5">
                  <p className="font-extrabold text-white">
                    {selected === current.correctIndex ? "Correct." : "Not quite."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{current.explanation}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Blueprint: {current.blueprintObjective} · Review status: SME draft
                  </p>
                </div>
              )}

              <div className="mt-7 flex justify-end">
                {!confirmed ? (
                  <button
                    type="button"
                    disabled={selected === null}
                    onClick={confirm}
                    className="rounded-xl bg-teal-400 px-5 py-3 font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Confirm answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-xl bg-white px-5 py-3 font-extrabold text-slate-950"
                  >
                    {index === diagnostic.length - 1 ? "See readiness" : "Next question"}
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-10 text-xs leading-5 text-slate-600">
        Official exam parameters used in this prototype: {ELECTRICIAN_309A.examQuestions} questions, {ELECTRICIAN_309A.examDurationMinutes / 60} hours, {ELECTRICIAN_309A.passMarkPercent}% pass mark. Echelon Institute is not affiliated with or endorsed by the Red Seal Program or Skilled Trades Ontario.
      </footer>
    </div>
  );
}
