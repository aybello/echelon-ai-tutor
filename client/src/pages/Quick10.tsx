import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import NextStepCard from "@/components/NextStepCard";
import QuizGate from "@/components/QuizGate";
import { usePageMeta } from "@/hooks/usePageMeta";
import { quick10Href } from "@/lib/nextStepHref";
import { readAccessToken } from "@/lib/readAccessToken";
import { trpc } from "@/lib/trpc";
import { getCourseByKey } from "@shared/courseRegistry";

type Phase = "loading" | "asking" | "checking" | "revealed" | "done" | "empty" | "error";
type SessionQuestion = { id: number; module: string; topic?: string; isCalc: boolean; question: string; options: string[] };
type Session = { courseKey: string; courseName: string; locked: boolean; attemptToken: string; questions: SessionQuestion[] };
type Reveal = { correct: boolean; correctIndex: number; picked: number; explanation: string; steps?: { l: string; c: string }[]; tip?: string };

const LETTERS = ["A", "B", "C", "D"];

function errorText(code: string | undefined): string {
  if (code === "FORBIDDEN") return "Quick 10 isn't available for this course.";
  if (code === "BAD_REQUEST") return "Choose a course first, then start your Quick 10.";
  return "We couldn't start your Quick 10. Please try again.";
}

export default function Quick10() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const requestedCourse = params.get("course") ?? undefined;
  // One question keeps a streak going. Anything else is the usual ten.
  const sessionLength = params.get("questions") === "1" ? 1 : 10;

  const courses = trpc.quick10.courses.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const start = trpc.quick10.start.useMutation();
  const answer = trpc.quick10.answer.useMutation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [message, setMessage] = useState("");
  const [round, setRound] = useState(0);
  const sessionId = useRef<string>(crypto.randomUUID());
  // One id per question, kept across a retry, so a retried answer is never counted twice.
  const operationIds = useRef(new Map<number, string>());
  const nextButton = useRef<HTMLButtonElement>(null);
  const startedKey = useRef("");

  const course = session ? getCourseByKey(session.courseKey) : undefined;
  usePageMeta({
    title: "Quick 10",
    description: "Ten practice questions for your course, started with one tap.",
    noindex: true,
  });

  const begin = useCallback(async () => {
    setPhase("loading"); setMessage(""); setReveal(null); setIndex(0); setResults([]);
    sessionId.current = crypto.randomUUID();
    operationIds.current = new Map();
    try {
      const result = await start.mutateAsync({ courseKey: requestedCourse, accessToken: readAccessToken() });
      const questions = result.questions.slice(0, sessionLength);
      if (!questions.length) { setSession(null); setPhase("empty"); return; }
      setSession({ courseKey: result.courseKey, courseName: result.courseName, locked: result.locked, attemptToken: result.attemptToken, questions });
      setPhase("asking");
    } catch (error) {
      setSession(null);
      setMessage(errorText((error as { data?: { code?: string } })?.data?.code));
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedCourse, sessionLength]);

  // Start on arrival, when the course changes, and when the learner asks for another round.
  useEffect(() => {
    const key = `${requestedCourse ?? ""}|${sessionLength}|${round}`;
    if (startedKey.current === key) return;
    startedKey.current = key;
    void begin();
  }, [begin, requestedCourse, sessionLength, round]);

  useEffect(() => { if (phase === "revealed") nextButton.current?.focus(); }, [phase]);

  const current = session?.questions[index];

  async function choose(picked: number) {
    if (!session || !current || phase !== "asking") return;
    setPhase("checking"); setMessage("");
    let operationId = operationIds.current.get(current.id);
    if (!operationId) { operationId = crypto.randomUUID(); operationIds.current.set(current.id, operationId); }
    try {
      const result = await answer.mutateAsync({
        courseKey: session.courseKey, questionId: current.id, selectedIndex: picked, sessionId: sessionId.current,
        operationId, attemptToken: session.attemptToken, accessToken: readAccessToken(),
      });
      if (!result.saved) {
        setMessage("We couldn't save that answer. Please choose it again.");
        setPhase("asking");
        return;
      }
      setReveal({ correct: result.correct, correctIndex: result.correctIndex, picked, explanation: result.explanation, steps: result.steps, tip: result.tip });
      setResults(previous => [...previous, result.correct]);
      setPhase("revealed");
    } catch {
      setMessage("We couldn't reach the server. Check your connection and choose your answer again.");
      setPhase("asking");
    }
  }

  function next() {
    if (!session) return;
    setReveal(null);
    if (index + 1 >= session.questions.length) { setPhase("done"); return; }
    setIndex(index + 1);
    setPhase("asking");
  }

  const total = session?.questions.length ?? sessionLength;
  const score = results.filter(Boolean).length;
  const courseList = courses.data?.courses ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-4 sm:pt-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">← Dashboard</Link>
          {courseList.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Course</span>
              <select
                className="min-h-10 max-w-[12rem] rounded-md border border-border bg-card px-2 text-sm"
                value={session?.courseKey ?? requestedCourse ?? courses.data?.currentCourseKey ?? ""}
                onChange={event => navigate(quick10Href(event.target.value, search, sessionLength === 1 ? 1 : undefined))}
              >
                {courseList.map(c => <option key={c.courseKey} value={c.courseKey}>{c.shortName}</option>)}
              </select>
            </label>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Quick 10</h1>
        {session && <p className="mt-1 text-sm text-muted-foreground">{session.courseName}</p>}
        {session?.locked && phase !== "done" && (
          <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-sm">You're trying the free preview questions.</p>
        )}

        {phase === "loading" && <p role="status" className="mt-8 text-muted-foreground">Getting your questions…</p>}

        {(phase === "error" || phase === "empty") && (
          <div role="alert" className="mt-8 rounded-xl border border-border bg-card p-5">
            <p className="font-semibold">{phase === "empty" ? "There are no questions to practise yet." : message}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {phase === "error" && <button type="button" onClick={() => setRound(r => r + 1)} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Try again</button>}
              <Link href="/account" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold">My courses</Link>
            </div>
          </div>
        )}

        {session && current && (phase === "asking" || phase === "checking" || phase === "revealed") && (
          <section aria-label={`Question ${index + 1} of ${total}`} className="mt-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {index + 1} of {total}</span>
              <span>{current.module}</span>
            </div>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (phase === "revealed" ? 1 : 0)} aria-label="Progress" className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${((index + (phase === "revealed" ? 1 : 0)) / total) * 100}%` }} />
            </div>

            <h2 className="mt-5 text-lg font-semibold leading-snug">{current.question}</h2>

            <div className="mt-4 grid gap-3" role="group" aria-label="Answer choices">
              {current.options.map((option, i) => {
                const isPicked = reveal ? reveal.picked === i : false;
                const isRight = reveal ? reveal.correctIndex === i : false;
                const state = !reveal ? "border-border bg-card hover:border-primary"
                  : isRight ? "border-[var(--echelon-teal)] bg-secondary"
                  : isPicked ? "border-destructive bg-secondary" : "border-border bg-card opacity-70";
                return (
                  <button
                    key={i} type="button" disabled={phase !== "asking"} onClick={() => void choose(i)}
                    className={`flex min-h-12 w-full items-start gap-3 rounded-lg border-2 px-4 py-3 text-left text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default ${state}`}
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold" aria-hidden="true">{LETTERS[i]}</span>
                    <span className="flex-1">{option}</span>
                    {reveal && isRight && <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[var(--echelon-teal)]" aria-label="Correct answer" />}
                    {reveal && isPicked && !isRight && <XCircle size={20} className="mt-0.5 shrink-0 text-destructive" aria-label="Your answer" />}
                  </button>
                );
              })}
            </div>

            {phase === "checking" && <p role="status" className="mt-4 text-sm text-muted-foreground">Checking your answer…</p>}
            {message && phase === "asking" && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}

            {phase === "revealed" && reveal && (
              <div className="mt-5" role="status" aria-live="polite">
                <p className="text-base font-bold">{reveal.correct ? "Correct." : `Not quite. The answer is ${LETTERS[reveal.correctIndex]}.`}</p>
                <p className="mt-2 text-base leading-relaxed">{reveal.explanation}</p>
                {reveal.steps && reveal.steps.length > 0 && (
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                    {reveal.steps.map((step, i) => <li key={i}><span className="font-semibold">{step.l}:</span> {step.c}</li>)}
                  </ol>
                )}
                {reveal.tip && <p className="mt-3 text-sm text-muted-foreground">Tip: {reveal.tip}</p>}
                <button
                  ref={nextButton} type="button" onClick={next}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-primary-foreground sm:w-auto"
                >
                  {index + 1 >= total ? "See my result" : "Next question"} <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        )}

        {phase === "done" && session && (
          <section aria-label="Your result" className="mt-8">
            <p className="text-sm text-muted-foreground">Your result</p>
            <p className="mt-1 text-4xl font-extrabold">{score} of {total}</p>
            <p className="mt-2 text-base">
              {score === total ? "Every answer correct." : score >= Math.ceil(total * 0.7) ? "A solid session." : "Each miss is a chance to learn. Your missed questions will come back."}
            </p>
            {session.locked
              ? course && (
                <QuizGate
                  questionsAnswered={results.length}
                  onUnlocked={() => window.location.reload()}
                  productKey={course.productKey}
                  examType={course.courseKey}
                  diagnosticAvailable={false}
                  previewName="Quick 10 questions"
                  backPath="/dashboard"
                />
              )
              : (
                <>
                  <NextStepCard courseKey={session.courseKey} className="mt-6" />
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={() => { startedKey.current = ""; setRound(r => r + 1); }} className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold">Another Quick 10</button>
                    <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold">Back to dashboard</Link>
                  </div>
                </>
              )}
          </section>
        )}
      </main>
    </div>
  );
}
