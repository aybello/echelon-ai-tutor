import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileQuestion,
  GraduationCap,
  ListChecks,
  LockKeyhole,
  PlayCircle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getCeuCourseByKey } from "@shared/ceuCourses";
import { getCeuPreviewCourse } from "@shared/ceuCoursePreviewCurriculum";
import { calculateCeuPreviewScore } from "@shared/ceuCoursePreviewContent";
import "./ContinuingEducationCourse.css";

type PreviewView = "module" | "assessment";

function ChoiceList({
  choices,
  selectedIndex,
  onSelect,
  correctIndex,
  explanation,
  reveal,
  disabled = false,
}: {
  choices: readonly string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  correctIndex: number;
  explanation: string;
  reveal: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="ceu-preview-choice-group">
      <div className="ceu-preview-choice-list" role="radiogroup">
        {choices.map((choice, index) => {
          const selected = selectedIndex === index;
          const state = reveal
            ? index === correctIndex
              ? "is-correct"
              : selected
                ? "is-incorrect"
                : ""
            : selected
              ? "is-selected"
              : "";
          return (
            <button
              key={choice}
              type="button"
              className={`ceu-preview-choice ${state}`}
              onClick={() => onSelect(index)}
              aria-pressed={selected}
              disabled={disabled}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{choice}</strong>
              {reveal && index === correctIndex && <CheckCircle2 size={19} aria-label="Correct answer" />}
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className="ceu-preview-explanation" role="status">
          <strong>Why this is the best answer</strong>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

function CourseNotFound() {
  return (
    <div className="ceu-preview-page">
      <SiteNav currentPath="/continuing-education" variant="marketing" />
      <main className="ceu-preview-not-found">
        <CircleAlert size={34} aria-hidden="true" />
        <p className="ceu-preview-eyebrow">Course preview</p>
        <h1>This course preview is not available.</h1>
        <p>Choose a learning path from the continuing-education catalogue.</p>
        <Link href="/continuing-education" className="ceu-preview-primary-link">Return to course catalogue</Link>
      </main>
    </div>
  );
}

export default function ContinuingEducationCourse() {
  const [, params] = useRoute("/continuing-education/:courseKey");
  const courseKey = params?.courseKey ?? "";
  const course = getCeuCourseByKey(courseKey);
  const previewCourse = getCeuPreviewCourse(courseKey);
  const [view, setView] = useState<PreviewView>("module");
  const [activeModuleNumber, setActiveModuleNumber] = useState(1);
  const [moduleAnswers, setModuleAnswers] = useState<Record<number, number>>({});
  const [moduleReveals, setModuleReveals] = useState<Record<number, boolean>>({});
  const [examAnswers, setExamAnswers] = useState<number[]>(() => previewCourse ? Array(previewCourse.finalAssessment.questions.length).fill(-1) : []);
  const [examSubmitted, setExamSubmitted] = useState(false);

  const activeModule = previewCourse?.modules.find((module) => module.number === activeModuleNumber);
  const completedModuleCount = useMemo(
    () => previewCourse?.modules.filter((module) => moduleReveals[module.number]).length ?? 0,
    [moduleReveals, previewCourse],
  );
  const answeredExamCount = examAnswers.filter((answer) => answer >= 0).length;
  const examScore = previewCourse && examSubmitted
    ? calculateCeuPreviewScore(previewCourse.finalAssessment.questions, examAnswers)
    : null;

  usePageMeta({
    title: course ? `${course.shortTitle} Course Preview | Echelon Institute` : "CEU Course Preview | Echelon Institute",
    description: course ? `Explore Echelon Institute's internal learning preview for ${course.title}.` : "Explore Echelon Institute course previews.",
    noindex: true,
  });

  if (!course || !previewCourse || !activeModule) return <CourseNotFound />;

  function selectModule(moduleNumber: number) {
    setView("module");
    setActiveModuleNumber(moduleNumber);
  }

  function resetAssessment() {
    if (!previewCourse) return;
    setExamAnswers(Array(previewCourse.finalAssessment.questions.length).fill(-1));
    setExamSubmitted(false);
  }

  return (
    <div className="ceu-preview-page">
      <SiteNav currentPath="/continuing-education" variant="marketing" />
      <main className="ceu-preview-shell">
        <header className="ceu-preview-header">
          <Link href="/continuing-education" className="ceu-preview-back"><ArrowLeft size={16} aria-hidden="true" /> Continuing education catalogue</Link>
          <div className="ceu-preview-header-grid">
            <div>
              <p className="ceu-preview-eyebrow">Internal learning preview</p>
              <h1>{course.title}</h1>
              <p>{course.audience}</p>
            </div>
            <aside>
              <ShieldAlert size={19} aria-hidden="true" />
              <strong>Preview only</strong>
              <span>Not an approved CEU course, credential, completion record, or operating instruction.</span>
            </aside>
          </div>
        </header>

        <div className="ceu-preview-layout">
          <aside className="ceu-preview-sidebar" aria-label="Course navigation">
            <div className="ceu-preview-progress">
              <span>Learning progress</span>
              <strong>{completedModuleCount} of {previewCourse.modules.length} knowledge checks reviewed</strong>
              <div aria-hidden="true"><i style={{ width: `${(completedModuleCount / previewCourse.modules.length) * 100}%` }} /></div>
            </div>
            <nav className="ceu-preview-nav">
              <p>Modules</p>
              {previewCourse.modules.map((module) => (
                <button
                  key={module.number}
                  type="button"
                  className={view === "module" && activeModule.number === module.number ? "is-active" : ""}
                  onClick={() => selectModule(module.number)}
                >
                  <span>{moduleReveals[module.number] ? <CheckCircle2 size={16} aria-hidden="true" /> : module.number}</span>
                  <strong>{module.title}</strong>
                </button>
              ))}
            </nav>
            <button type="button" className={`ceu-preview-assessment-link ${view === "assessment" ? "is-active" : ""}`} onClick={() => setView("assessment")}>
              <FileQuestion size={17} aria-hidden="true" />
              <span><strong>Final knowledge check</strong><small>{answeredExamCount} of {previewCourse.finalAssessment.questions.length} answered</small></span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </aside>

          <section className="ceu-preview-workspace">
            {view === "module" ? (
              <article className="ceu-preview-module" key={activeModule.number}>
                <div className="ceu-preview-module-topline">
                  <span>Module {activeModule.number} of {previewCourse.modules.length}</span>
                  <span><BookOpenCheck size={16} aria-hidden="true" /> Applied learning</span>
                </div>
                <h2>{activeModule.title}</h2>
                <p className="ceu-preview-lead">{activeModule.overview}</p>

                <section className="ceu-preview-learning-points" aria-labelledby="learning-points-title">
                  <div>
                    <p className="ceu-preview-panel-label" id="learning-points-title">What this module develops</p>
                    <ul>
                      {activeModule.learningPoints.map((point) => <li key={point}><Check size={16} aria-hidden="true" />{point}</li>)}
                    </ul>
                  </div>
                  <div className="ceu-preview-disclaimer"><LockKeyhole size={18} aria-hidden="true" />{previewCourse.learningDisclaimer}</div>
                </section>

                <section className="ceu-preview-scenario" aria-labelledby="scenario-title">
                  <div className="ceu-preview-scenario-title">
                    <span><PlayCircle size={19} aria-hidden="true" /> Fictional operator scenario</span>
                    <h3 id="scenario-title">{activeModule.scenario.title}</h3>
                  </div>
                  <p>{activeModule.scenario.brief}</p>
                  <div className="ceu-preview-scenario-prompt"><strong>Discussion prompt</strong><p>{activeModule.scenario.prompt}</p></div>
                  <details>
                    <summary>Review a model reasoning sequence</summary>
                    <p>{activeModule.scenario.modelAnswer}</p>
                  </details>
                </section>

                <section className="ceu-preview-knowledge-check" aria-labelledby="check-title">
                  <div className="ceu-preview-check-heading">
                    <div><p className="ceu-preview-panel-label">Knowledge check</p><h3 id="check-title">{activeModule.knowledgeCheck.question}</h3></div>
                    <ClipboardCheck size={24} aria-hidden="true" />
                  </div>
                  <ChoiceList
                    choices={activeModule.knowledgeCheck.choices}
                    selectedIndex={moduleAnswers[activeModule.number] ?? null}
                    onSelect={(index) => setModuleAnswers((current) => ({ ...current, [activeModule.number]: index }))}
                    correctIndex={activeModule.knowledgeCheck.correctIndex}
                    explanation={activeModule.knowledgeCheck.explanation}
                    reveal={Boolean(moduleReveals[activeModule.number])}
                  />
                  {!moduleReveals[activeModule.number] && (
                    <button
                      type="button"
                      className="ceu-preview-check-button"
                      disabled={moduleAnswers[activeModule.number] === undefined}
                      onClick={() => setModuleReveals((current) => ({ ...current, [activeModule.number]: true }))}
                    >
                      Review answer <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </section>

                <footer className="ceu-preview-module-footer">
                  <button type="button" disabled={activeModule.number === 1} onClick={() => selectModule(activeModule.number - 1)}><ArrowLeft size={16} aria-hidden="true" /> Previous module</button>
                  {activeModule.number < previewCourse.modules.length ? (
                    <button type="button" onClick={() => selectModule(activeModule.number + 1)}>Next module <ArrowRight size={16} aria-hidden="true" /></button>
                  ) : (
                    <button type="button" onClick={() => setView("assessment")}>Open final knowledge check <ArrowRight size={16} aria-hidden="true" /></button>
                  )}
                </footer>
              </article>
            ) : (
              <article className="ceu-preview-assessment">
                <div className="ceu-preview-module-topline"><span>Assessment preview</span><span><GraduationCap size={16} aria-hidden="true" /> No credential issued</span></div>
                <h2>{previewCourse.finalAssessment.title}</h2>
                <p className="ceu-preview-lead">{previewCourse.finalAssessment.instructions}</p>
                <div className="ceu-preview-assessment-facts">
                  <span><ListChecks size={17} aria-hidden="true" /> {previewCourse.finalAssessment.questions.length} questions</span>
                  <span><CheckCircle2 size={17} aria-hidden="true" /> Preview benchmark: {previewCourse.finalAssessment.passingScore}%</span>
                  <span><LockKeyhole size={17} aria-hidden="true" /> No course record created</span>
                </div>

                {examSubmitted && examScore !== null && (
                  <div className={`ceu-preview-score ${examScore.percentage >= previewCourse.finalAssessment.passingScore ? "is-passing" : ""}`} role="status">
                    <div><span>Preview score</span><strong>{examScore.correct} / {previewCourse.finalAssessment.questions.length}</strong></div>
                    <p>{examScore.percentage}% correct. {examScore.percentage >= previewCourse.finalAssessment.passingScore ? "You met the preview benchmark." : "Review the explanations and try the assessment again."}</p>
                    <small>This result is private to this browser session. It does not issue a CEU, credential, certificate, attendance record, or course completion.</small>
                  </div>
                )}

                <div className="ceu-preview-final-questions">
                  {previewCourse.finalAssessment.questions.map((question, questionIndex) => (
                    <section className="ceu-preview-final-question" key={question.question}>
                      <p>Question {questionIndex + 1} of {previewCourse.finalAssessment.questions.length}</p>
                      <h3>{question.question}</h3>
                      <ChoiceList
                        choices={question.choices}
                        selectedIndex={examAnswers[questionIndex] >= 0 ? examAnswers[questionIndex] : null}
                        onSelect={(choiceIndex) => setExamAnswers((current) => current.map((answer, index) => index === questionIndex ? choiceIndex : answer))}
                        correctIndex={question.correctIndex}
                        explanation={question.explanation}
                        reveal={examSubmitted}
                        disabled={examSubmitted}
                      />
                    </section>
                  ))}
                </div>

                <footer className="ceu-preview-assessment-footer">
                  {examSubmitted ? (
                    <button type="button" className="ceu-preview-reset-button" onClick={resetAssessment}><RotateCcw size={16} aria-hidden="true" /> Try again</button>
                  ) : (
                    <button type="button" className="ceu-preview-submit-button" disabled={answeredExamCount !== previewCourse.finalAssessment.questions.length} onClick={() => setExamSubmitted(true)}>
                      Submit preview assessment <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                  {answeredExamCount !== previewCourse.finalAssessment.questions.length && !examSubmitted && <p>Answer every question to review your result.</p>}
                </footer>
              </article>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
