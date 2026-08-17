import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trpc } from "@/lib/trpc";
import { ELECTRICIAN_309A_MODULES } from "../../../shared/electrician309aBlueprint";

type PracticeQuestion = {
  id: number;
  module: string;
  taskCode: string;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  steps?: { l: string; c: string }[];
  tip?: string | null;
  isCalc: boolean;
};

const MODULE_NAMES: Record<string, string> = {
  A: "Occupational Skills", B: "Distribution & Services", C: "Wiring Systems", D: "Motors & Controls", E: "Signalling & Communications",
};

function shuffle<T>(items: readonly T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

export default function Electrician309APractice() {
  const [location] = useLocation();
  usePageMeta({
    title: "Free 309A Electrician Practice Questions | Echelon Institute",
    description: "Practice original Ontario 309A electrician questions in Echelon Institute's free governed beta course.",
    noindex: true,
  });
  const query = trpc.electricianReview.get309ABetaPractice.useQuery();
  const [session, setSession] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [module, setModule] = useState<string | null>(null);

  const available = useMemo(() => (query.data?.questions ?? []) as PracticeQuestion[], [query.data]);
  const filtered = useMemo(() => module ? available.filter((question) => question.module === module) : available, [available, module]);
  const start = () => {
    setSession(shuffle(filtered).slice(0, 20));
    setIndex(0); setSelected(null); setConfirmed(false); setCorrect(0);
  };
  useEffect(() => { if (available.length && !session.length) start(); }, [available.length]);
  useEffect(() => { if (available.length) start(); }, [module]);

  const current = session[index];
  const complete = session.length > 0 && index >= session.length;
  const confirm = () => {
    if (selected === null || !current || confirmed) return;
    if (selected === current.correctIndex) setCorrect((value) => value + 1);
    setConfirmed(true);
  };
  const next = () => { if (!confirmed) return; setIndex((value) => value + 1); setSelected(null); setConfirmed(false); };

  return (
    <div className="min-h-screen bg-slate-50 text-[#1E3A5F]">
      <SiteNav currentPath={location} variant="marketing" />
      <main className="mx-auto max-w-5xl px-5 py-10 md:py-14">
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#1E3A5F] via-[#0047AB] to-[#087C99] p-7 text-white md:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-100">Ontario 309A · Free governed beta</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">309A Electrician practice quiz</h1>
          <p className="mt-3 max-w-3xl text-blue-50/90">Practice original, blueprint-weighted questions from the growing 500-question Echelon Institute bank. This free beta is not a mock exam or Canadian Electrical Code preparation product.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => setModule(null)} className={`rounded-full px-4 py-2 text-sm font-bold ${module === null ? "bg-white text-[#0047AB]" : "border border-white/30 text-white"}`}>All areas</button>
            {ELECTRICIAN_309A_MODULES.map((item) => <button key={item.code} onClick={() => setModule(item.code)} className={`rounded-full px-4 py-2 text-sm font-bold ${module === item.code ? "bg-white text-[#0047AB]" : "border border-white/30 text-white"}`}>{item.code}. {MODULE_NAMES[item.code]}</button>)}
          </div>
        </div>
        {query.isLoading ? <p className="py-16 text-center text-slate-500">Loading the 309A beta bank…</p> : !available.length ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h2 className="text-2xl font-black">The beta bank is being activated.</h2><p className="mt-3 text-slate-600">Please try again shortly.</p></section>
        ) : complete ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0047AB]">Practice session complete</p><h2 className="mt-3 text-4xl font-black">{correct} of {session.length} correct</h2><p className="mt-3 text-slate-600">Keep practising across the five Major Work Activities as the free 309A course grows.</p><button onClick={start} className="mt-7 rounded-xl bg-[#0047AB] px-5 py-3 font-extrabold text-white">Start another session</button></section>
        ) : current ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-500">Question {index + 1} of {session.length}</span><span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-[#0047AB]">{current.module}. {MODULE_NAMES[current.module]} · {current.taskCode}</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#00A8B5]" style={{ width: `${((index + (confirmed ? 1 : 0)) / session.length) * 100}%` }} /></div>
            <h2 className="mt-8 text-2xl font-extrabold leading-9 md:text-3xl">{current.question}</h2>
            <div className="mt-7 grid gap-3">{current.options.map((option, optionIndex) => { const right = confirmed && optionIndex === current.correctIndex; const wrong = confirmed && selected === optionIndex && optionIndex !== current.correctIndex; return <button key={`${optionIndex}-${option}`} disabled={confirmed} onClick={() => setSelected(optionIndex)} className={`rounded-xl border p-4 text-left font-semibold transition ${right ? "border-emerald-500 bg-emerald-50 text-emerald-900" : wrong ? "border-rose-400 bg-rose-50 text-rose-900" : selected === optionIndex ? "border-[#0047AB] bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}><span className="mr-3 text-slate-400">{String.fromCharCode(65 + optionIndex)}.</span>{option}</button>; })}</div>
            {confirmed && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="font-extrabold">{selected === current.correctIndex ? "Correct." : "Not quite."}</p><p className="mt-2 leading-7 text-slate-700">{current.explanation}</p>{current.tip && <p className="mt-3 text-sm font-semibold text-[#0047AB]">Exam tip: {current.tip}</p>}</div>}
            <div className="mt-7 flex justify-end"><button disabled={selected === null && !confirmed} onClick={confirmed ? next : confirm} className="rounded-xl bg-[#0047AB] px-5 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">{confirmed ? (index === session.length - 1 ? "See session result" : "Next question") : "Confirm answer"}</button></div>
          </section>
        ) : null}
        <p className="mt-8 text-center text-sm text-slate-500"><Link href="/electrician-309a-demo" className="font-bold text-[#0047AB]">Return to the 309A course overview</Link></p>
      </main>
    </div>
  );
}
