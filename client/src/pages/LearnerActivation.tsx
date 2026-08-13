import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type Step = "loading" | "profile" | "diagnostic" | "result";

const STEP_LABELS = ["Study setup", "Starting diagnostic", "Your plan"];

export default function LearnerActivation() {
  const [, params] = useRoute("/activate/:courseKey");
  const courseKey = decodeURIComponent(params?.courseKey ?? "");
  usePageMeta({
    title: "Set Up Your Study Plan — Echelon Institute",
    description: "Create your personalized Echelon study plan and starting baseline.",
    noindex: true,
  });

  const auth = trpc.dashboardAuth.me.useQuery(undefined, { retry: false });
  const oauth = useAuth();
  const status = trpc.activation.status.useQuery(
    { courseKey },
    { enabled: !!courseKey && (!!auth.data?.email || oauth.isAuthenticated), retry: false },
  );
  const [step, setStep] = useState<Step>("loading");
  const [examDate, setExamDate] = useState("");
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState<15 | 25 | 40 | 60>(25);
  const [confidence, setConfidence] = useState<"starting_out" | "somewhat" | "confident">("somewhat");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const questions = trpc.activation.diagnosticQuestions.useQuery(
    { courseKey },
    { enabled: step === "diagnostic" && !!courseKey, retry: false },
  );
  const saveProfile = trpc.activation.saveProfile.useMutation({
    onSuccess: () => {
      setStep("diagnostic");
      status.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const submitDiagnostic = trpc.activation.submitDiagnostic.useMutation({
    onSuccess: () => {
      setStep("result");
      status.refetch();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!auth.isLoading && !oauth.loading && !auth.data?.email && !oauth.isAuthenticated) {
      const next = `/activate/${encodeURIComponent(courseKey)}`;
      window.location.replace(`/account?next=${encodeURIComponent(next)}`);
    }
  }, [auth.isLoading, auth.data?.email, oauth.loading, oauth.isAuthenticated, courseKey]);

  useEffect(() => {
    if (!status.data) return;
    if (status.data.profile) {
      setStudyDaysPerWeek(status.data.profile.studyDaysPerWeek);
      setSessionMinutes(status.data.profile.sessionMinutes as 15 | 25 | 40 | 60);
      setConfidence(status.data.profile.confidence as typeof confidence);
      if (status.data.profile.examDate) setExamDate(new Date(status.data.profile.examDate).toISOString().slice(0, 10));
    }
    if (status.data.diagnostic || status.data.status === "completed") setStep("result");
    else if (status.data.status === "profile_completed" || status.data.status === "diagnostic_started") setStep("diagnostic");
    else setStep("profile");
  }, [status.data]);

  const result = submitDiagnostic.data ?? status.data?.diagnostic ?? null;
  const currentQuestion = questions.data?.questions[questionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const activeStep = step === "profile" ? 0 : step === "diagnostic" ? 1 : step === "result" ? 2 : 0;
  const todayPlanHref = useMemo(() => {
    const quizPath = status.data?.course.quizPath ?? "/dashboard";
    const weakTopic = result?.weakTopics?.[0];
    return weakTopic ? `${quizPath}?topic=${encodeURIComponent(weakTopic)}` : quizPath;
  }, [result, status.data]);

  const submitProfile = () => {
    saveProfile.mutate({
      courseKey,
      examDate: examDate || null,
      studyDaysPerWeek,
      sessionMinutes,
      confidence,
    });
  };

  const finishDiagnostic = () => {
    const diagnosticQuestions = questions.data?.questions ?? [];
    if (diagnosticQuestions.length !== 15 || diagnosticQuestions.some(question => answers[question.id] === undefined)) {
      toast.error("Answer all 15 questions to create your baseline.");
      return;
    }
    submitDiagnostic.mutate({
      courseKey,
      sessionId: crypto.randomUUID(),
      answers: diagnosticQuestions.map(question => ({ questionId: question.id, selectedIndex: answers[question.id] })),
    });
  };

  if (auth.isLoading || oauth.loading || step === "loading" || status.isLoading) {
    return <ActivationLoading />;
  }

  if (status.error) {
    return (
      <div className="min-h-screen bg-[var(--echelon-canvas)]">
        <SiteNav currentPath="/dashboard" />
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-extrabold text-slate-900">We could not open this study plan</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{status.error.message}</p>
            <Button asChild className="mt-6"><Link href="/account">View My Courses</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--echelon-canvas)] text-slate-900">
      <SiteNav currentPath="/dashboard" />
      <main className="mx-auto max-w-4xl px-5 py-8 pb-24 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-600 text-white shadow-lg shadow-blue-200">
            <Compass className="h-7 w-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Personalized onboarding</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {status.data?.course.displayName}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Set your study rhythm, establish a transparent starting baseline and leave with one clear next action.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2">
          {STEP_LABELS.map((label, index) => (
            <div key={label} className="text-center">
              <div className={`mx-auto mb-2 h-2 rounded-full transition-colors ${index <= activeStep ? "bg-gradient-to-r from-blue-700 to-teal-500" : "bg-slate-200"}`} />
              <span className={`text-[11px] font-bold sm:text-xs ${index <= activeStep ? "text-blue-800" : "text-slate-400"}`}>{label}</span>
            </div>
          ))}
        </div>

        {step === "profile" && (
          <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="bg-gradient-to-r from-slate-950 to-blue-950 px-6 py-6 text-white sm:px-8">
              <div className="flex items-center gap-3"><Target className="h-6 w-6 text-teal-300" /><h2 className="text-xl font-extrabold">Build your study rhythm</h2></div>
              <p className="mt-2 text-sm text-slate-300">These choices shape the weekly target on your dashboard. You can adjust them later.</p>
            </div>
            <CardContent className="space-y-7 p-6 sm:p-8">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarDays className="h-4 w-4 text-blue-700" /> When is your exam?</span>
                <input type="date" value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={event => setExamDate(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
                <span className="mt-2 block text-xs text-slate-500">Not scheduled yet? Leave this blank.</span>
              </label>

              <div>
                <span className="mb-3 block text-sm font-bold text-slate-800">How many days can you study each week?</span>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, index) => index + 1).map(day => (
                    <button key={day} type="button" onClick={() => setStudyDaysPerWeek(day)} className={`h-11 rounded-xl border text-sm font-extrabold transition ${studyDaysPerWeek === day ? "border-blue-700 bg-blue-700 text-white shadow-md shadow-blue-200" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{day}</button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800"><Clock3 className="h-4 w-4 text-blue-700" /> Preferred session length</span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([15, 25, 40, 60] as const).map(minutes => (
                    <button key={minutes} type="button" onClick={() => setSessionMinutes(minutes)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${sessionMinutes === minutes ? "border-teal-700 bg-teal-50 text-teal-800 ring-2 ring-teal-100" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"}`}>{minutes} min</button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-3 block text-sm font-bold text-slate-800">How prepared do you feel today?</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([
                    ["starting_out", "Starting out", "I need the fundamentals"],
                    ["somewhat", "Somewhat prepared", "I know parts of the material"],
                    ["confident", "Confident", "I want to find hidden gaps"],
                  ] as const).map(([value, label, description]) => (
                    <button key={value} type="button" onClick={() => setConfidence(value)} className={`rounded-xl border p-4 text-left transition ${confidence === value ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                      <span className="block text-sm font-extrabold text-slate-900">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={submitProfile} disabled={saveProfile.isPending} className="h-12 w-full bg-gradient-to-r from-blue-700 to-teal-600 text-base font-extrabold hover:from-blue-800 hover:to-teal-700">
                {saveProfile.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <>Start My 15-Question Diagnostic <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "diagnostic" && (
          <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Starting baseline</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">Question {questionIndex + 1} of 15</h2></div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">About 8 minutes</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-teal-500 transition-all" style={{ width: `${((questionIndex + 1) / 15) * 100}%` }} /></div>
            </div>
            <CardContent className="p-6 sm:p-8">
              {questions.isLoading ? (
                <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-700" /></div>
              ) : questions.error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{questions.error.message}</div>
              ) : currentQuestion ? (
                <div>
                  <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700"><GraduationCap className="h-4 w-4" /> {currentQuestion.module}</div>
                  <h3 className="text-lg font-extrabold leading-8 text-slate-950 sm:text-xl">{currentQuestion.question}</h3>
                  <div className="mt-6 space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button key={index} type="button" onClick={() => setAnswers(previous => ({ ...previous, [currentQuestion.id]: index }))} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${currentAnswer === index ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"}`}>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${currentAnswer === index ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65 + index)}</span>
                        <span className="pt-0.5 text-sm font-semibold leading-6 text-slate-800">{option}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="outline" disabled={questionIndex === 0} onClick={() => setQuestionIndex(index => Math.max(0, index - 1))}>Back</Button>
                    {questionIndex < 14 ? (
                      <Button disabled={currentAnswer === undefined} onClick={() => setQuestionIndex(index => Math.min(14, index + 1))} className="bg-blue-700 hover:bg-blue-800">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    ) : (
                      <Button disabled={currentAnswer === undefined || submitDiagnostic.isPending} onClick={finishDiagnostic} className="bg-gradient-to-r from-blue-700 to-teal-600 font-extrabold">
                        {submitDiagnostic.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building plan…</> : <>Build My Study Plan <Sparkles className="ml-2 h-4 w-4" /></>}
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {step === "result" && result && (
          <div className="space-y-5">
            <Card className="overflow-hidden border-0 shadow-2xl shadow-blue-200/60">
              <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-teal-800 px-6 py-8 text-white sm:px-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-200"><CheckCircle2 className="h-4 w-4" /> Your starting baseline</div>
                    <h2 className="text-3xl font-black">{result.label}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">This is where your plan begins. Echelon will update your priorities as you practise and complete mock exams.</p>
                  </div>
                  <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-8 border-white/20 bg-white/10 shadow-inner">
                    <span className="text-3xl font-black">{result.score}%</span><span className="text-[10px] font-bold uppercase tracking-widest text-teal-200">Baseline</span>
                  </div>
                </div>
              </div>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Start here</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.weakTopics.length ? result.weakTopics.map(topic => <span key={topic} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-900">{topic}</span>) : <span className="text-sm text-amber-900">Mixed-topic practice</span>}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Strongest signals</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.strongTopics.length ? result.strongTopics.map(topic => <span key={topic} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900">{topic}</span>) : <span className="text-sm text-emerald-900">More practice will reveal your strengths.</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-100/70">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Your first study session</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">Practise {result.weakTopics[0] ?? "mixed exam topics"}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Answer about {Math.max(5, Math.round((status.data?.profile?.sessionMinutes ?? 25) / 2))} targeted questions. Your dashboard will then reorder the plan using your newest evidence.</p>
                    <p className="mt-3 text-xs font-bold text-blue-800">Weekly target: {status.data?.profile?.weeklyQuestionGoal ?? 39} questions across {status.data?.profile?.studyDaysPerWeek ?? 3} study days.</p>
                  </div>
                  <Button asChild className="h-12 shrink-0 bg-gradient-to-r from-blue-700 to-teal-600 px-6 text-base font-extrabold"><a href={todayPlanHref}>Continue studying <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
              <p className="text-xs leading-5 text-slate-500">{result.calibrationNote}</p>
              <Button asChild variant="outline"><Link href={`/dashboard?course=${encodeURIComponent(courseKey)}`}>Open My Study Plan</Link></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ActivationLoading() {
  return (
    <div className="min-h-screen bg-[var(--echelon-canvas)]">
      <SiteNav currentPath="/dashboard" />
      <div className="flex min-h-[65vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-700" /><p className="mt-3 text-sm font-semibold text-slate-600">Preparing your study plan…</p></div></div>
    </div>
  );
}
