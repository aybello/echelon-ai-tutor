import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import NextStepCard from "@/components/NextStepCard";
import QuizGate from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import StepSolution from "@/components/StepSolution";
import "@/components/StudyWorkspace.css";
import "@/components/PracticeWorkspace.css";
import "@/components/QuizPage.css";
import "./Quick10.css";
import { useVerifiedPracticeSaveScope } from "@/components/PracticeSaveStatus";
import { useAssessmentActivity } from "@/hooks/useAssessmentActivity";
import type { AssessmentActivityCapability } from "@shared/assessmentActivity";
import { usePageMeta } from "@/hooks/usePageMeta";
import { quick10Href } from "@/lib/nextStepHref";
import { readAccessToken } from "@/lib/readAccessToken";
import { trpc } from "@/lib/trpc";
import { getCourseByKey } from "@shared/courseRegistry";

type Phase = "loading" | "asking" | "checking" | "revealed" | "done" | "empty" | "error";
type SessionQuestion = { id: number; module: string; topic?: string; isCalc: boolean; question: string; options: string[] };
type Session = { courseKey: string; courseName: string; locked: boolean; attemptToken: string; questions: SessionQuestion[]; activityTracking?: AssessmentActivityCapability | { tracking: false } };
type Reveal = { correct: boolean; correctIndex: number; picked: number; explanation: string; steps?: { l: string; c: string }[]; tip?: string };
export type PendingQuick10Answer = {
  courseKey: string; questionId: number; selectedIndex: number; sessionId: string;
  operationId: string; attemptToken: string; accessToken?: string;
};
/** A transport retry cannot rewrite an ambiguous original answer, receipt or operation. */
export function retainQuick10Answer(pending: PendingQuick10Answer | null, original: PendingQuick10Answer): PendingQuick10Answer {
  return pending ?? Object.freeze({ ...original });
}

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
  const sessionLength = params.get("questions") === "1" ? 1 : 10;
  const courses = trpc.quick10.courses.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const actorScope = useVerifiedPracticeSaveScope(requestedCourse ?? courses.data?.currentCourseKey ?? "");
  const actorKey = actorScope ? JSON.stringify(actorScope) : "unverified";
  const activeActor = useRef(actorKey);
  activeActor.current = actorKey;
  const start = trpc.quick10.start.useMutation({ retry: false });
  const answer = trpc.quick10.answer.useMutation({ retry: false });
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [message, setMessage] = useState("");
  const [round, setRound] = useState(0);
  const [pendingAnswer, setPendingAnswer] = useState<PendingQuick10Answer | null>(null);
  const pendingRef = useRef<PendingQuick10Answer | null>(null);
  const sessionId = useRef<string>(crypto.randomUUID());
  const generation = useRef(0);
  const busy = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const startedKey = useRef("");
  const { observe, retry, saveError } = useAssessmentActivity(session?.activityTracking?.tracking ? session.activityTracking : null, actorKey);
  const course = session ? getCourseByKey(session.courseKey) : undefined;
  usePageMeta({ title: "Quick 10", description: "Ten practice questions for your course, started with one tap.", noindex: true });

  const begin = useCallback(async () => {
    const requestGeneration = ++generation.current;
    const requestActor = actorKey;
    setSession(null); setPhase("loading"); setMessage(""); setReveal(null); setIndex(0); setResults([]);
    setPendingAnswer(null); pendingRef.current = null; busy.current = false;
    sessionId.current = crypto.randomUUID();
    try {
      const result = await start.mutateAsync({ courseKey: requestedCourse, questionCount: sessionLength, accessToken: readAccessToken() });
      if (generation.current !== requestGeneration || activeActor.current !== requestActor) return;
      if (!result.questions.length) { setPhase("empty"); return; }
      setSession(result);
      setPhase("asking");
    } catch (error) {
      if (generation.current !== requestGeneration || activeActor.current !== requestActor) return;
      setMessage(errorText((error as { data?: { code?: string } })?.data?.code));
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedCourse, sessionLength, actorKey]);

  useEffect(() => {
    const key = `${requestedCourse ?? ""}|${sessionLength}|${round}|${actorKey}`;
    if (startedKey.current === key) return;
    startedKey.current = key;
    void begin();
    return () => { generation.current++; startedKey.current = ""; };
  }, [begin, requestedCourse, sessionLength, round, actorKey]);
  useEffect(() => { if (phase === "revealed") nextButton.current?.focus(); }, [phase]);

  const current = session?.questions[index];
  const presentation = useRef("");
  const activityStarted = useRef("");
  useEffect(() => {
    if (!session || !current || !["asking", "checking", "revealed"].includes(phase)) return;
    if (activityStarted.current !== sessionId.current) {
      activityStarted.current = sessionId.current;
      observe({ action: "started" });
    }
    const key = `${sessionId.current}:${current.id}`;
    if (presentation.current === key) return;
    presentation.current = key;
    observe({ action: "item_presented", itemId: String(current.id) });
  }, [session, current, phase, observe]);
  const explanation = useRef("");
  useEffect(() => {
    if (!current || !reveal || phase !== "revealed") return;
    const key = `${sessionId.current}:${current.id}`;
    if (explanation.current === key) return;
    explanation.current = key;
    // Automatically displayed explanation/solution/tip: shown, not a hint request or step attempt.
    observe({ action: "explanation_opened", itemId: String(current.id) });
  }, [current, reveal, phase, observe]);

  async function choose(picked: number) {
    if (!session || !current || phase !== "asking" || busy.current) return;
    const requestGeneration = generation.current;
    const requestActor = actorKey;
    const isRetry = pendingRef.current !== null;
    const pending = retainQuick10Answer(pendingRef.current, {
      courseKey: session.courseKey, questionId: current.id, selectedIndex: picked, sessionId: sessionId.current,
      operationId: crypto.randomUUID(), attemptToken: session.attemptToken, accessToken: readAccessToken(),
    });
    pendingRef.current = pending; setPendingAnswer(pending);
    if (!isRetry) observe({ action: "answer_submitted", itemId: String(current.id), chosenAnswer: String(pending.selectedIndex) });
    busy.current = true; setPhase("checking"); setMessage("");
    try {
      const result = await answer.mutateAsync(pending);
      if (generation.current !== requestGeneration || activeActor.current !== requestActor) return;
      if (!result.saved) {
        setMessage("Save not confirmed. Your original answer is retained. Retry that answer below.");
        setPhase("asking"); return;
      }
      setReveal({ correct: result.correct, correctIndex: result.correctIndex, picked: pending.selectedIndex, explanation: result.explanation, steps: result.steps, tip: result.tip });
      setResults(previous => [...previous, result.correct]);
      pendingRef.current = null; setPendingAnswer(null);
      setPhase("revealed");
    } catch {
      if (generation.current !== requestGeneration || activeActor.current !== requestActor) return;
      setMessage("We couldn't reach the server. Your original answer is retained; keep this page open and retry below.");
      setPhase("asking");
    } finally {
      if (generation.current === requestGeneration) busy.current = false;
    }
  }

  function next() {
    if (!session || phase !== "revealed" || !reveal || pendingRef.current) return;
    setReveal(null);
    if (index + 1 >= session.questions.length) {
      // Explicit finish after every canonical answer acknowledgement, never cleanup.
      if (results.length === session.questions.length) observe({ action: "completed" });
      setPhase("done"); return;
    }
    setIndex(index + 1); setPhase("asking");
  }

  const total = session?.questions.length ?? sessionLength;
  const score = results.filter(Boolean).length;
  const courseList = courses.data?.courses ?? [];
  // SiteNav resolves course tabs from registered study paths, not /quick-10.
  const navigationCourse = course ?? getCourseByKey(requestedCourse ?? courses.data?.currentCourseKey ?? "");
  return (
    <div className="practice-page practice-screen learning-redesign quick10-page">
      <SiteNav currentPath={navigationCourse?.quizPath ?? "/quick-10"} variant="learning" />
      <main className="practice-screen-main">
        <header className="practice-header" aria-label="Practice session">
          <div className="practice-header-inner">
            <div className="practice-title-row">
              <div>
                <span className="workspace-eyebrow">Course practice</span>
                <h1>Quick 10</h1>
                {session && <p>{session.courseName}</p>}
              </div>
              <div className="quick10-header-actions">
                <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">← Dashboard</Link>
                {courseList.length > 1 && (
                  <label className="quick10-course-select">
                    <span className="text-muted-foreground">Course</span>
                    <select className="quick10-course-input"
                      value={session?.courseKey ?? requestedCourse ?? courses.data?.currentCourseKey ?? ""}
                      onChange={event => navigate(quick10Href(event.target.value, search, sessionLength === 1 ? 1 : undefined))}>
                      {courseList.map(c => <option key={c.courseKey} value={c.courseKey}>{c.shortName}</option>)}
                    </select>
                  </label>
                )}
              </div>
            </div>
            {session && <>
              <div className="practice-session-stats"><span><strong>{Math.min(index + 1, total)} / {total}</strong> questions</span><span><strong>{score}</strong> correct</span></div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={results.length} aria-label="Progress" className="practice-progress">
                <span style={{ width: `${(results.length / total) * 100}%` }} />
              </div>
            </>}
            {session?.locked && phase !== "done" && <div className="practice-preview-banner"><p>You're trying the free preview questions.</p></div>}
          </div>
        </header>
        <div className="practice-content" tabIndex={0} role="region" aria-label="Practice question and explanation">
        {saveError && <p role="status" className="mt-2 text-sm">Activity observations not saved; your answer score is separate. <button type="button" onClick={() => void retry()} className="underline">Retry activity save</button></p>}
        {phase === "loading" && <p role="status" className="mt-8 text-muted-foreground">Getting your questions…</p>}
        {(phase === "error" || phase === "empty") && (
          <div role="alert" className="quick10-state-card">
            <p className="font-semibold">{phase === "empty" ? "There are no questions to practise yet." : message}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {phase === "error" && <button type="button" onClick={() => setRound(r => r + 1)} className="quick10-primary min-h-11 rounded-lg px-4 text-sm font-semibold">Try again</button>}
              <Link href="/account" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold">My courses</Link>
            </div>
          </div>
        )}
        {session && current && (phase === "asking" || phase === "checking" || phase === "revealed") && (
          <section aria-label={`Question ${index + 1} of ${total}`} className="quick10-question">
            <div className="qs-question-card">
            <div className="qs-badges-row quick10-badges"><span>Question {index + 1} of {total}</span><span>{current.module}</span></div>
            <h2 data-testid="practice-question" data-question-id={current.id}>{current.question}</h2>
            <div className="mt-4 grid gap-3" role="group" aria-label="Answer choices">
              {current.options.map((option, i) => {
                const isPicked = reveal ? reveal.picked === i : pendingAnswer?.selectedIndex === i;
                const isRight = reveal ? reveal.correctIndex === i : false;
                const state = !reveal ? isPicked ? "is-selected" : ""
                  : isRight ? "is-correct" : isPicked ? "is-incorrect" : "is-muted";
                return <button key={i} type="button" disabled={phase !== "asking" || pendingAnswer !== null} onClick={() => void choose(i)}
                  aria-pressed={isPicked}
                  className={`qs-option ${state}`}>
                  <span className="qs-option-letter" aria-hidden="true">{LETTERS[i]}</span>
                  <span className="flex-1">{option}</span>
                  {reveal && isRight && <CheckCircle2 size={20} className="mt-0.5 shrink-0" aria-label="Correct answer" />}
                  {reveal && isPicked && !isRight && <XCircle size={20} className="mt-0.5 shrink-0 text-destructive" aria-label="Your answer" />}
                </button>;
              })}
            </div>
            {phase === "checking" && <p role="status" className="mt-4 text-sm text-muted-foreground">Checking your answer…</p>}
            {message && phase === "asking" && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}
            {pendingAnswer && phase === "asking" && <button type="button" onClick={() => void choose(pendingAnswer.selectedIndex)} className="mt-3 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold">Retry original answer {LETTERS[pendingAnswer.selectedIndex]}</button>}
            </div>
            {phase === "revealed" && reveal && <div className="practice-explanation" role="status" aria-live="polite">
              <p className="practice-result-label font-bold">{reveal.correct ? "Correct." : `Not quite. The answer is ${LETTERS[reveal.correctIndex]}.`}</p>
              <p className="practice-explanation-content">{reveal.explanation}</p>
              {reveal.steps && reveal.steps.length > 0 && <StepSolution steps={reveal.steps} tip={reveal.tip} />}
              {reveal.tip && !reveal.steps?.length && <p className="mt-3 text-sm text-muted-foreground">Tip: {reveal.tip}</p>}
              <button ref={nextButton} type="button" onClick={next} className="quick10-primary mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold sm:w-auto">{index + 1 >= total ? "See my result" : "Next question"} <ArrowRight size={18} aria-hidden="true" /></button>
            </div>}
          </section>
        )}
        {phase === "done" && session && <section aria-label="Your result" className="quick10-state-card">
          <p className="text-sm text-muted-foreground">Your result</p><p className="mt-1 text-4xl font-extrabold">{score} of {total}</p>
          <p className="mt-2 text-base">{score === total ? "Every answer correct." : score >= Math.ceil(total * 0.7) ? "A solid session." : "Each miss is a chance to learn. Your missed questions will come back."}</p>
          {session.locked ? course && <QuizGate questionsAnswered={results.length} onUnlocked={() => window.location.reload()} productKey={course.productKey} examType={course.courseKey} diagnosticAvailable={false} previewName="Quick 10 questions" backPath="/dashboard" />
            : <><NextStepCard courseKey={session.courseKey} className="mt-6" /><div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => { startedKey.current = ""; setRound(r => r + 1); }} className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold">Another Quick 10</button>
              <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold">Back to dashboard</Link>
            </div></>}
        </section>}
        </div>
      </main>
    </div>
  );
}
