import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleHelp,
  Clock3,
  FileDown,
  Flag,
  FlagTriangleRight,
  LockKeyhole,
  Menu,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/SiteNav";
import { ceuModuleSlides } from "@shared/ceuSlides";
import { ceuFinalEntry } from "@shared/ceuFinalEntry";
import type { CeuLearningRecord, CeuQuestion } from "@shared/ceuLearning";
import "./ContinuingEducationCourse.css";

export function LessonMarkdown({ text }: { text: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(text, { async: false }) as string),
    [text]
  );
  return <div className="ceu-reading" dangerouslySetInnerHTML={{ __html: html }} />;
}

type CourseView = "overview" | "lesson" | "exam" | "results" | "certificate";

function moduleComplete(record: CeuLearningRecord | null | undefined, moduleId: string) {
  const module = record?.modules[moduleId];
  return Boolean(module?.completedAt || module?.exerciseAttempts.some(attempt => attempt.passed));
}

function displayMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes} min`;
  return remainder ? `${hours}h ${remainder}m` : `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function coursePresentationIntro(title: string) {
  return `${title} is a self-paced operator learning pilot built around focused lessons, worked scenarios and a protected final exam. Progress is saved securely when you sign in.`;
}

function ChoiceList({
  question,
  value,
  onChange,
  disabled,
}: {
  question: CeuQuestion;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="ceu-choice-list" aria-label={question.prompt}>
      <legend className="sr-only">{question.prompt}</legend>
      {question.choices.map((choice, index) => (
        <label
          className={`ceu-choice${value === index ? " is-selected" : ""}`}
          key={`${question.id}-${index}`}
        >
          <input
            type="radio"
            name={question.id}
            checked={value === index}
            disabled={disabled}
            onChange={() => onChange(index)}
          />
          <span className="ceu-radio" aria-hidden="true" />
          <span>{choice}</span>
        </label>
      ))}
    </fieldset>
  );
}

function PilotDisclosure() {
  return (
    <p className="ceu-pilot-disclosure">
      <ShieldCheck size={15} aria-hidden="true" />
      Non-credit pilot. This course does not award approved CEUs, operator qualification or regulatory recognition.
    </p>
  );
}

export default function ContinuingEducationCourse() {
  const [, params] = useRoute("/continuing-education/:courseKey");
  return <CourseWorkspace key={params?.courseKey} courseKey={params?.courseKey ?? ""} />;
}

function CourseWorkspace({ courseKey }: { courseKey: string }) {
  const identity = trpc.ceu.identity.useQuery(undefined, { retry: false, staleTime: 0 });
  const courseQuery = trpc.ceu.course.useQuery({ courseKey }, { retry: false });
  const recordQuery = trpc.ceu.myRecord.useQuery(
    { courseKey },
    { enabled: identity.data?.signedIn === true, retry: false, refetchOnWindowFocus: false }
  );
  const utils = trpc.useUtils();
  const [view, setView] = useState<CourseView>("overview");
  const [activeModuleId, setActiveModuleId] = useState("");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [learnerName, setLearnerName] = useState("");
  const [operatorNumber, setOperatorNumber] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [quickCheckChoice, setQuickCheckChoice] = useState<number | undefined>();
  const [quickCheckFeedback, setQuickCheckFeedback] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<number[]>([]);
  const [examDirty, setExamDirty] = useState(false);
  const [attemptId, setAttemptId] = useState<string>(() => crypto.randomUUID());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submittedAttemptId, setSubmittedAttemptId] = useState<string | undefined>();

  const course = courseQuery.data;
  const record = recordQuery.data;
  const activeModule = course?.modules.find(module => module.id === activeModuleId) ?? course?.modules[0];
  const slides = useMemo(
    () => (activeModule ? ceuModuleSlides(activeModule) : []),
    [activeModule]
  );
  const activeSlide = slides[activeSlideIndex] ?? slides[0];
  const completedModules = course?.modules.filter(module => moduleComplete(record, module.id)).length ?? 0;
  const allModulesComplete = !!course && completedModules === course.modules.length;
  const finalEntry = ceuFinalEntry(record);

  const assessment = trpc.ceu.assessment.useQuery(
    { courseKey },
    { enabled: view === "exam" && !!record && allModulesComplete && !record.completion, retry: false, refetchOnWindowFocus: false }
  );
  const results = trpc.ceu.results.useQuery(
    { courseKey, attemptId: submittedAttemptId },
    { enabled: view === "results" && !!record && !!submittedAttemptId, retry: false, refetchOnWindowFocus: false }
  );

  const cache = (next: CeuLearningRecord | null) => utils.ceu.myRecord.setData({ courseKey }, next);
  const start = trpc.ceu.start.useMutation({
    onSuccess: next => {
      cache(next);
      setStatus("Your course is ready. Progress saves as you learn.");
      setView("lesson");
    },
    onError: error => setStatus(error.message),
  });
  const save = trpc.ceu.save.useMutation({
    onSuccess: ({ record: next, feedback }, variables) => {
      cache(next);
      if (variables.action.type === "check" && typeof feedback === "string") {
        setQuickCheckFeedback(feedback);
        setStatus("Quick check saved. This does not affect your final exam.");
      } else if (variables.action.type === "slideProgress") {
        setActiveSlideIndex(variables.action.slideIndex);
        setStatus("Progress saved");
      } else if (variables.action.type === "completeModule") {
        const action = variables.action;
        const moduleIndex = course?.modules.findIndex(module => module.id === action.moduleId) ?? -1;
        const nextModule = course?.modules[moduleIndex + 1];
        setStatus("Module completed. Your progress is saved.");
        if (nextModule) {
          setActiveModuleId(nextModule.id);
          setActiveSlideIndex(next.modules[nextModule.id]?.slideIndex ?? 0);
          setQuickCheckChoice(undefined);
          setQuickCheckFeedback("");
        } else {
          setView("overview");
        }
      } else if (variables.action.type === "examDraft") {
        setExamDirty(false);
        setStatus("Answers saved");
      } else if (variables.action.type === "exam") {
        setSubmittedAttemptId(variables.action.attemptId);
        setStatus(next.completion ? "Final exam submitted. Your certificate is ready." : "Final exam submitted. Review your feedback.");
        setView("results");
        utils.ceu.results.invalidate({ courseKey, attemptId: variables.action.attemptId });
      }
    },
    onError: (error, variables) => {
      if (variables.action.type === "examDraft") {
        setStatus("Your latest final-exam change did not save. Retry before leaving this page.");
        return;
      }
      setStatus(error.message);
    },
  });

  const pending = start.isPending || save.isPending;
  usePageMeta({
    title: course ? `${course.shortTitle} | Echelon Institute` : "Continuing education | Echelon Institute",
    description: "Echelon Institute non-credit pilot course.",
    noindex: true,
  });

  useEffect(() => {
    if (!course) return;
    const nextModuleId = record?.currentModule ?? course.modules[0]?.id ?? "";
    const module = course.modules.find(item => item.id === nextModuleId) ?? course.modules[0];
    if (!activeModuleId && module) {
      setActiveModuleId(module.id);
      setActiveSlideIndex(record?.modules[module.id]?.slideIndex ?? 0);
    }
  }, [course, record, activeModuleId]);

  useEffect(() => {
    if (!assessment.data || !record?.assessmentDraft) return;
    setAnswers(
      Object.fromEntries(
        assessment.data.flatMap((question, index) => {
          const answer = record.assessmentDraft?.answers[index];
          return answer === null || answer === undefined ? [] : [[question.id, answer]];
        })
      )
    );
    setFlags(record.assessmentDraft.flaggedQuestionIndexes ?? []);
    setAttemptId(record.assessmentDraft.attemptId);
    setExamDirty(false);
  }, [assessment.data, record?.assessmentDraft]);

  useEffect(() => {
    if (!examDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [examDirty]);

  function chooseModule(moduleId: string) {
    if (!course) return;
    const module = course.modules.find(item => item.id === moduleId);
    if (!module) return;
    setActiveModuleId(moduleId);
    setActiveSlideIndex(record?.modules[moduleId]?.slideIndex ?? 0);
    setQuickCheckChoice(undefined);
    setQuickCheckFeedback("");
    setDrawerOpen(false);
    setView("lesson");
    if (record && !record.completion && !pending) {
      save.mutate({ courseKey, revision: record.revision, action: { type: "resume", moduleId } });
    }
  }

  function saveSlide(nextIndex: number) {
    if (pending) return;
    setActiveSlideIndex(nextIndex);
    if (!record || !activeModule) return;
    save.mutate({
      courseKey,
      revision: record.revision,
      action: { type: "slideProgress", moduleId: activeModule.id, slideIndex: nextIndex },
    });
  }

  function completeCurrentModule() {
    if (!record || !activeModule || pending) return;
    save.mutate({
      courseKey,
      revision: record.revision,
      action: { type: "completeModule", moduleId: activeModule.id, slideIndex: slides.length - 1 },
    });
  }

  function saveExam(nextAnswers: Record<string, number>, nextFlags: number[]) {
    if (!record || !assessment.data || pending) return;
    save.mutate({
      courseKey,
      revision: record.revision,
      action: {
        type: "examDraft",
        attemptId,
        answers: assessment.data.map(question => nextAnswers[question.id] ?? null),
        flaggedQuestionIndexes: nextFlags,
      },
    });
  }

  function answerExam(questionId: string, choice: number) {
    const nextAnswers = { ...answers, [questionId]: choice };
    setAnswers(nextAnswers);
    setExamDirty(true);
    saveExam(nextAnswers, flags);
  }

  function toggleFlag(questionIndex: number) {
    const nextFlags = flags.includes(questionIndex)
      ? flags.filter(index => index !== questionIndex)
      : [...flags, questionIndex].sort((a, b) => a - b);
    setFlags(nextFlags);
    setExamDirty(true);
    saveExam(answers, nextFlags);
  }

  function resetForRetake() {
    setAnswers({});
    setFlags([]);
    setAttemptId(crypto.randomUUID());
    setCurrentQuestionIndex(0);
    setSubmittedAttemptId(undefined);
    setExamDirty(false);
    setView("exam");
    setStatus("New final exam attempt ready.");
  }

  function openFinal() {
    const entry = ceuFinalEntry(record);
    if (entry.view === "results") {
      setSubmittedAttemptId(entry.attemptId);
      setView("results");
      return;
    }
    if (entry.view === "certificate") {
      setView("certificate");
      return;
    }
    setView("exam");
  }

  function confirmDiscardUnsavedExam() {
    return !examDirty || window.confirm("Your latest final-exam answer has not saved. Leave and discard it?");
  }

  function changeView(nextView: CourseView) {
    if (nextView === view || confirmDiscardUnsavedExam()) setView(nextView);
  }

  if (courseQuery.isLoading) return <main className="ceu-loading">Loading course…</main>;
  if (!course || !activeModule || !activeSlide) {
    return (
      <main className="ceu-loading">
        <h1>Course unavailable</h1>
        <p>{courseQuery.error?.message ?? "Choose a course from the catalogue."}</p>
        <Link href="/continuing-education">Course catalogue</Link>
      </main>
    );
  }

  const question = assessment.data?.[currentQuestionIndex];
  const assessmentQuestions = assessment.data ?? [];
  const signedIn = identity.data?.signedIn === true;
  const activeModuleIndex = course.modules.findIndex(module => module.id === activeModule.id);
  const activeModuleRecord = record?.modules[activeModule.id];

  return (
    <div className="ceu-screen">
      <SiteNav currentPath={`/continuing-education/${courseKey}`} variant="marketing" />
      <section className="ceu-course-context" aria-label="Continuing education course workspace">
        <div className="ceu-course-context-inner">
          <div className="ceu-course-context-identity">
            <Link href="/continuing-education" onClick={event => {
              if (!confirmDiscardUnsavedExam()) event.preventDefault();
            }}>
              <span>Continuing education</span>
              <strong>{course.shortTitle}</strong>
            </Link>
            <small>{course.stream === "drinking_water" ? "Ontario drinking water" : "Ontario wastewater"} · Pilot learning</small>
          </div>
          <nav className="ceu-course-context-tabs" aria-label="Course workspace navigation">
            <button type="button" className={view === "overview" ? "is-active" : ""} onClick={() => changeView("overview")}>Overview</button>
            <button type="button" className={view === "lesson" ? "is-active" : ""} onClick={() => changeView("lesson")}>Lessons</button>
            <button type="button" className={view === "exam" || view === "results" ? "is-active" : ""} disabled={!record || !allModulesComplete} onClick={() => {
              if (confirmDiscardUnsavedExam()) openFinal();
            }}>Assessment</button>
            <button type="button" className={view === "certificate" ? "is-active" : ""} disabled={!record?.completion} onClick={() => changeView("certificate")}>Certificate</button>
          </nav>
          <div className="ceu-course-context-actions">
            {status && <span className="ceu-save-status" role="status"><CheckCircle2 size={15} aria-hidden="true" /> {status}</span>}
            {view !== "overview" && <button type="button" className="ceu-exit-button" onClick={() => changeView("overview")}>Course overview</button>}
          </div>
        </div>
      </section>

      {view === "overview" && (
        <main className="ceu-overview-shell">
          <section className="ceu-overview-main">
            <p className="ceu-breadcrumb"><Link href="/continuing-education">My courses</Link> / {course.stream === "drinking_water" ? "Drinking water" : "Wastewater"}</p>
            <div className="ceu-pills"><span>Self-paced</span><span>Non-credit pilot</span></div>
            <h1>{course.title}</h1>
            <p className="ceu-course-intro">{coursePresentationIntro(course.title)}</p>
            <div className="ceu-course-facts">
              <span><Clock3 size={19} /> {displayMinutes(course.plannedMinutes)} planned duration</span>
              <span><FileDown size={19} /> {course.modules.length} modules</span>
              <span><Award size={19} /> Final exam, {course.finalQuestionCount} questions</span>
            </div>

            {!signedIn ? (
              <section className="ceu-enrol-card">
                <div>
                  <h2>Start learning</h2>
                  <p>Read the course freely. Sign in to save progress, take the final exam and receive a non-credit pilot certificate.</p>
                </div>
                <Link className="ceu-primary-button" href={`/account?next=${encodeURIComponent(`/continuing-education/${courseKey}`)}`}>Sign in to start <ChevronRight size={18} /></Link>
              </section>
            ) : recordQuery.isLoading ? (
              <section className="ceu-enrol-card"><p>Loading your saved course…</p></section>
            ) : recordQuery.isError ? (
              <section className="ceu-enrol-card" role="alert"><p>We could not load your saved course right now. Your learning record has not been changed.</p><button type="button" onClick={() => recordQuery.refetch()}>Retry</button></section>
            ) : !record ? (
              <section className="ceu-enrol-card ceu-enrol-form">
                <div>
                  <h2>Create your learning record</h2>
                  <p>Your name and operator ID appear on the non-credit pilot certificate after a passing final exam.</p>
                </div>
                <div className="ceu-form-grid">
                  <label>Your full name<input value={learnerName} maxLength={150} onChange={event => setLearnerName(event.target.value)} /></label>
                  <label>Operator ID<input value={operatorNumber} maxLength={32} onChange={event => setOperatorNumber(event.target.value)} /></label>
                </div>
                <button
                  type="button"
                  className="ceu-primary-button"
                  disabled={pending || learnerName.trim().length < 2 || operatorNumber.trim().length < 3}
                  onClick={() => start.mutate({ courseKey, learnerName, operatorNumber })}
                >
                  Start and save my learning <ChevronRight size={18} />
                </button>
              </section>
            ) : (
              <section className="ceu-progress-card">
                <div className="ceu-progress-copy">
                  <h2>Your progress</h2>
                  <strong>{Math.round((completedModules / course.modules.length) * 100)}% complete</strong>
                </div>
                <div className="ceu-progress-track" aria-label={`${completedModules} of ${course.modules.length} modules complete`}><span style={{ width: `${(completedModules / course.modules.length) * 100}%` }} /></div>
                <p>{record.completion ? "Course passed. Your pilot certificate is ready." : `Next: ${activeModule.title}, slide ${(activeModuleRecord?.slideIndex ?? 0) + 1} of ${slides.length}`}</p>
                <button type="button" className="ceu-primary-button" onClick={() => setView(record.completion ? "certificate" : "lesson")}>{record.completion ? "View certificate" : "Continue learning"} <ChevronRight size={18} /></button>
              </section>
            )}

            <section className="ceu-module-list" aria-labelledby="ceu-module-list-title">
              <div className="ceu-section-row"><h2 id="ceu-module-list-title">Course modules</h2><span>{completedModules} of {course.modules.length} modules done</span></div>
              {course.modules.map((module, index) => {
                const done = moduleComplete(record, module.id);
                const current = module.id === activeModule.id && !done;
                return (
                  <button className={`ceu-module-row${current ? " is-current" : ""}`} type="button" key={module.id} onClick={() => { setActiveModuleId(module.id); setActiveSlideIndex(record?.modules[module.id]?.slideIndex ?? 0); setView("lesson"); }}>
                    <span className={`ceu-module-marker${done ? " is-done" : ""}`}>{done ? <Check size={18} /> : index + 1}</span>
                    <span className="ceu-module-row-title"><small>Module {index + 1}</small><strong>{module.title}</strong></span>
                    <span className="ceu-module-duration">{displayMinutes(module.activities.reduce((sum, activity) => sum + activity.minutes, 0))}</span>
                    <span className={`ceu-module-status${done ? " is-done" : ""}`}>{done ? "Complete" : current ? "In progress" : "Not started"}</span>
                  </button>
                );
              })}
              <button className="ceu-module-row ceu-final-row" type="button" disabled={!record || !allModulesComplete} onClick={openFinal}>
                <span className="ceu-module-marker"><LockKeyhole size={17} /></span>
                <span className="ceu-module-row-title"><small>Final exam</small><strong>{finalEntry.view === "results" ? "View latest results" : `${course.finalQuestionCount} questions, 80% to pass`}</strong></span>
                <span className="ceu-module-duration">No timer</span>
                <span className="ceu-module-status">{allModulesComplete ? finalEntry.view === "results" ? "Results available" : "Available" : "After modules"}</span>
              </button>
            </section>
          </section>

          <aside className="ceu-overview-side">
            <section className="ceu-info-card"><h2>How this course works</h2><ol><li><b>1</b><span>Work through the lesson slides at your own pace.</span></li><li><b>2</b><span>Use optional quick checks to reinforce the ideas.</span></li><li><b>3</b><span>Pass the server-graded final exam with 80% or higher.</span></li><li><b>4</b><span>Download your non-credit pilot certificate after you pass.</span></li></ol></section>
            <section className="ceu-info-card"><h2>What you will be able to do</h2><ul>{course.modules.flatMap(module => module.objectives).slice(0, 5).map(objective => <li key={objective}><Check size={17} />{objective}</li>)}</ul></section>
            <section className="ceu-reminder-card"><CircleCheck size={20} /><span>Your place is saved after each completed lesson slide and exam answer.</span></section>
            <PilotDisclosure />
          </aside>
        </main>
      )}

      {view === "lesson" && (
        <main className="ceu-player-shell">
          <button className="ceu-module-drawer-trigger" type="button" onClick={() => setDrawerOpen(open => !open)} aria-expanded={drawerOpen}><Menu size={18} /> Course modules</button>
          <aside className={`ceu-player-sidebar${drawerOpen ? " is-open" : ""}`} aria-label="Course progress">
            <div className="ceu-sidebar-progress"><div><strong>Course progress</strong><span>{Math.round((completedModules / course.modules.length) * 100)}%</span></div><div className="ceu-progress-track"><span style={{ width: `${(completedModules / course.modules.length) * 100}%` }} /></div></div>
            <nav>
              {course.modules.map((module, index) => {
                const done = moduleComplete(record, module.id);
                const active = module.id === activeModule.id;
                return <div className="ceu-sidebar-module" key={module.id}>
                  <button type="button" className={`${active ? "is-active" : ""}${done ? " is-complete" : ""}`} onClick={() => chooseModule(module.id)} disabled={pending}>
                    <span>{done ? <Check size={17} /> : index + 1}</span><strong>{module.title}</strong>
                  </button>
                  {active && <ol>{slides.map((slide, index) => <li key={slide.id}><button type="button" className={index === activeSlideIndex ? "is-current" : ""} disabled={pending || index > (activeModuleRecord?.slideIndex ?? 0)} onClick={() => { setActiveSlideIndex(index); setDrawerOpen(false); }}><small>{index + 1}</small>{slide.kind === "quick_check" ? "Quick check" : slide.kind === "takeaways" ? "Key takeaways" : slide.title}</button></li>)}</ol>}
                </div>;
              })}
              <button className="ceu-sidebar-final" type="button" disabled={!record || !allModulesComplete} onClick={() => { openFinal(); setDrawerOpen(false); }}><LockKeyhole size={16} /> {finalEntry.view === "results" ? "View latest results" : "Final exam"}</button>
            </nav>
          </aside>
          <section className="ceu-lesson-stage">
            <div className="ceu-lesson-kicker"><span>MODULE {activeModuleIndex + 1} · {activeModule.title.toUpperCase()}</span><span>Slide {activeSlideIndex + 1} of {slides.length}</span></div>
            <article className="ceu-lesson-card">
              <p className="ceu-slide-eyebrow">{activeSlide.eyebrow}</p>
              <h1>{activeSlide.title}</h1>
              <LessonMarkdown text={activeSlide.body} />
              {activeSlide.kind === "quick_check" && activeModule.checks[0] && (
                <section className="ceu-quick-check">
                  <p>Optional and ungraded</p>
                  <h2>{activeModule.checks[0].prompt}</h2>
                  <ChoiceList question={activeModule.checks[0]} value={quickCheckChoice ?? activeModuleRecord?.checks[activeModule.checks[0].id]?.selectedIndex} disabled={!record || pending || !!record?.completion} onChange={choice => { setQuickCheckChoice(choice); setQuickCheckFeedback(""); }} />
                  <div className="ceu-inline-actions"><button type="button" className="ceu-secondary-button" disabled={!record || pending || (quickCheckChoice ?? activeModuleRecord?.checks[activeModule.checks[0].id]?.selectedIndex) === undefined} onClick={() => record && save.mutate({ courseKey, revision: record.revision, action: { type: "check", moduleId: activeModule.id, questionId: activeModule.checks[0].id, choice: quickCheckChoice ?? activeModuleRecord!.checks[activeModule.checks[0].id].selectedIndex } })}>Check answer</button>{quickCheckFeedback && <span className="ceu-feedback"><CheckCircle2 size={16} /> {quickCheckFeedback}</span>}</div>
                </section>
              )}
              {activeSlide.kind === "evidence" && <p className="ceu-fictional-note">All facility names, records, values and scenarios in this lesson are fictional training material.</p>}
            </article>
            <section className="ceu-source-strip"><strong>Sources for this module</strong>{course.sources.filter(source => activeModule.sourceIds.includes(source.id)).map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowRight size={14} /></a>)}</section>
            <footer className="ceu-lesson-footer">
              <button type="button" className="ceu-back-button" disabled={pending || activeSlideIndex === 0} onClick={() => setActiveSlideIndex(index => Math.max(0, index - 1))}><ArrowLeft size={18} /> Back</button>
              <div className="ceu-slide-dots" aria-label={`Slide ${activeSlideIndex + 1} of ${slides.length}`}>{slides.map((slide, index) => <span key={slide.id} className={index === activeSlideIndex ? "is-active" : ""} />)}</div>
              {activeSlideIndex === slides.length - 1 ? <button type="button" className="ceu-primary-button" disabled={!record || pending || moduleComplete(record, activeModule.id)} onClick={completeCurrentModule}>{moduleComplete(record, activeModule.id) ? "Module complete" : "Complete module"} <Check size={18} /></button> : <button type="button" className="ceu-primary-button" disabled={pending} onClick={() => saveSlide(activeSlideIndex + 1)}>Next <ArrowRight size={18} /></button>}
            </footer>
            {!record && <p className="ceu-signin-note">Sign in to save slide progress and complete this module.</p>}
          </section>
        </main>
      )}

      {view === "exam" && (
        <main className="ceu-exam-shell">
          <section className="ceu-exam-main">
            <div className="ceu-exam-status"><strong>Question {currentQuestionIndex + 1} of {assessment.data?.length ?? course.finalQuestionCount}</strong><span>{Object.keys(answers).length} answered</span></div>
            <div className="ceu-progress-track ceu-exam-track"><span style={{ width: `${assessment.data?.length ? ((currentQuestionIndex + 1) / assessment.data.length) * 100 : 0}%` }} /></div>
            {!record ? <section className="ceu-empty-state"><h1>Sign in to take the final exam</h1><Link href={`/account?next=${encodeURIComponent(`/continuing-education/${courseKey}`)}`}>Sign in</Link></section> : !allModulesComplete ? <section className="ceu-empty-state"><h1>Complete every module first</h1><p>The final exam unlocks after the final slide of each module.</p><button type="button" className="ceu-primary-button" onClick={() => setView("overview")}>Return to course</button></section> : assessment.isLoading ? <section className="ceu-empty-state"><h1>Loading final exam…</h1></section> : assessment.isError ? <section className="ceu-empty-state"><h1>Final exam unavailable</h1><p>{assessment.error.message}</p><button type="button" onClick={() => assessment.refetch()}>Retry</button></section> : question ? <>
              <article className="ceu-exam-question-card">
                <div className="ceu-question-top"><span>Choose one answer.</span><button type="button" className={`ceu-flag-button${flags.includes(currentQuestionIndex) ? " is-flagged" : ""}`} disabled={pending} onClick={() => toggleFlag(currentQuestionIndex)}><Flag size={17} /> {flags.includes(currentQuestionIndex) ? "Flagged for review" : "Flag for review"}</button></div>
                <h1>{question.prompt}</h1>
                <ChoiceList question={question} value={answers[question.id]} disabled={pending} onChange={choice => answerExam(question.id, choice)} />
              </article>
              {examDirty && <p className="ceu-exam-save-warning" role="alert">Your latest change has not saved. <button type="button" onClick={() => saveExam(answers, flags)} disabled={pending}>Retry save</button></p>}
              <footer className="ceu-exam-footer"><button type="button" className="ceu-back-button" disabled={pending || currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(index => index - 1)}><ArrowLeft size={18} /> Previous</button>{currentQuestionIndex === assessmentQuestions.length - 1 ? <button type="button" className="ceu-primary-button" disabled={pending || examDirty || !assessmentQuestions.every(item => answers[item.id] !== undefined)} onClick={() => { if (window.confirm("Submit your final exam? You can review your results after submission.")) save.mutate({ courseKey, revision: record.revision, action: { type: "exam", attemptId, answers: assessmentQuestions.map(item => answers[item.id]), } }); }}>Submit exam</button> : <button type="button" className="ceu-primary-button" disabled={pending} onClick={() => setCurrentQuestionIndex(index => index + 1)}>Next question <ArrowRight size={18} /></button>}</footer>
            </> : null}
          </section>
          <aside className="ceu-exam-sidebar">
            <h2>Questions</h2>
            <div className="ceu-question-grid">{assessment.data?.map((item, index) => <button type="button" key={item.id} onClick={() => setCurrentQuestionIndex(index)} className={`${answers[item.id] !== undefined ? "is-answered" : ""}${index === currentQuestionIndex ? " is-current" : ""}${flags.includes(index) ? " is-flagged" : ""}`} aria-label={`Question ${index + 1}${answers[item.id] !== undefined ? ", answered" : ""}${flags.includes(index) ? ", flagged" : ""}`}>{index + 1}</button>)}</div>
            <div className="ceu-exam-legend"><span><i className="is-answered" /> Answered</span><span><i className="is-current" /> Current question</span><span><i className="is-flagged" /> Flagged for review</span></div>
            <section className="ceu-exam-note"><h3>Before you submit</h3><p>You need {Math.ceil((assessment.data?.length ?? course.finalQuestionCount) * 0.8)} of {assessment.data?.length ?? course.finalQuestionCount} to pass.</p><p>There is no timer. Your answers save as you go.</p><p>If you do not pass, review the course and try again.</p><PilotDisclosure /></section>
          </aside>
        </main>
      )}

      {view === "results" && (
        <main className="ceu-results-shell">
          {results.isLoading ? <section className="ceu-empty-state"><h1>Loading your results…</h1></section> : results.isError ? <section className="ceu-empty-state"><h1>Results unavailable</h1><p>{results.error.message}</p></section> : results.data ? <>
            <section className="ceu-result-hero">
              <div className={`ceu-score-orb${results.data.passed ? " is-passed" : ""}`}><strong>{Math.round((results.data.score / results.data.total) * 100)}%</strong><span>{results.data.score} of {results.data.total}</span></div>
              <div><p className={results.data.passed ? "ceu-pass-label" : "ceu-review-label"}>{results.data.passed ? "Passed · pass mark 80%" : "Review needed · pass mark 80%"}</p><h1>{results.data.passed ? "You have completed the course." : "You are close. Review and try again."}</h1><p>{results.data.passed ? "Your non-credit pilot certificate is ready now." : "Review the missed answers, revisit the related lessons and retake the final when you are ready."}</p><div className="ceu-inline-actions">{results.data.passed ? <button type="button" className="ceu-primary-button" onClick={() => setView("certificate")}><FileDown size={18} /> View certificate</button> : <button type="button" className="ceu-primary-button" onClick={resetForRetake}><RotateCcw size={18} /> Retake final exam</button>}<button type="button" className="ceu-secondary-button" onClick={() => setView("overview")}>Back to my course</button></div></div>
            </section>
            <section className="ceu-results-review"><div className="ceu-section-row"><h2>Review your answers</h2><span>{results.data.review.length ? `${results.data.review.length} to review` : "All answers correct"}</span></div>{results.data.review.length ? results.data.review.map((item, index) => <article key={item.id} className="ceu-missed-answer"><p className="ceu-missed-eyebrow">Question {index + 1} · review</p><h3>{item.prompt}</h3><div className="ceu-answer-compare"><div><small>Your answer</small><strong>{item.choices[item.selectedIndex] ?? "No answer"}</strong></div><div><small>Correct answer</small><strong>{item.choices[item.correctIndex]}</strong></div></div><p>{item.explanation}</p><button type="button" className="ceu-text-link" onClick={() => { const module = course.modules.find(module => module.id === item.objective); if (module) { setActiveModuleId(module.id); setActiveSlideIndex(0); setView("lesson"); } }}>Revisit this lesson <ArrowRight size={15} /></button></article>) : <p className="ceu-all-correct"><CheckCircle2 size={20} /> Excellent work. Every final-exam answer was correct.</p>}</section>
          </> : null}
        </main>
      )}

      {view === "certificate" && (
        <main className="ceu-certificate-page">
          {record?.completion ? <article className="ceu-certificate" id="ceu-certificate">
            <div className="ceu-certificate-top"><span className="ceu-brand-mark">E</span><strong>Echelon Institute</strong></div>
            <p className="ceu-certificate-eyebrow">Certificate of completion</p>
            <p>This certifies that</p>
            <h1>{record.completion.name}</h1>
            <p className="ceu-certificate-operator">Operator ID: {record.completion.operatorNumber}</p>
            <p>has successfully completed the self-paced online pilot course</p>
            <h2>{course.title}</h2>
            <div className="ceu-certificate-stats"><div><small>Planned duration</small><strong>{displayMinutes(course.plannedMinutes)}</strong></div><div><small>Final exam score</small><strong>{Math.round((record.completion.finalScore / record.completion.finalTotal) * 100)}%</strong></div><div><small>Date completed</small><strong>{new Date(record.completion.at).toLocaleDateString("en-CA")}</strong></div><div><small>Certificate ID</small><strong>{record.completion.id.slice(0, 8).toUpperCase()}</strong></div></div>
            <div className="ceu-certificate-footer"><div><span>Ayoola Bello</span><strong>Ayoola Bello</strong><small>Founder and CEO, Echelon Institute</small></div><p>{record.completion.statement}</p></div>
          </article> : <section className="ceu-empty-state"><h1>Your certificate will be ready after a passing final exam.</h1><button type="button" className="ceu-primary-button" onClick={() => setView("overview")}>Back to course</button></section>}
          {record?.completion && <div className="ceu-certificate-actions"><button type="button" className="ceu-primary-button" onClick={() => window.print()}><FileDown size={18} /> Print certificate</button><button type="button" className="ceu-secondary-button" onClick={() => setView("overview")}>Back to my courses</button></div>}
        </main>
      )}
    </div>
  );
}
