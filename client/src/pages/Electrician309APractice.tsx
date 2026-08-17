import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import QuizSkeleton from "@/components/QuizSkeleton";
import { Electrician309ADiagram, ELECTRICIAN_309A_DIAGRAMS, type Electrician309ADiagramId } from "@/components/electrician309a/Electrician309ADiagrams";
import { Electrician309AStudySupplement } from "@/components/electrician309a/Electrician309AStudySupplement";
import { useElectrician309ABank, ELECTRICIAN_309A_MODULE_LABELS } from "@/hooks/useElectrician309ABank";
import { useQuizSession } from "@/hooks/useQuizSession";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ELECTRICIAN_309A_MODULES, type Electrician309AModuleCode } from "@shared/electrician309aBlueprint";

const MODULE_STYLES = [
  { icon: "🦺", bg: "#DBEAFE", color: "#1D4ED8" },
  { icon: "⚡", bg: "#FEF3C7", color: "#B45309" },
  { icon: "🔌", bg: "#DCFCE7", color: "#15803D" },
  { icon: "⚙️", bg: "#EDE9FE", color: "#6D28D9" },
  { icon: "📡", bg: "#CCFBF1", color: "#0F766E" },
];

const MODULE_CONFIG: ModuleConfig[] = ELECTRICIAN_309A_MODULES.map((module, index) => ({
  name: ELECTRICIAN_309A_MODULE_LABELS[module.code],
  ...MODULE_STYLES[index],
}));

function isDiagramId(value: unknown): value is Electrician309ADiagramId {
  return typeof value === "string" && value in ELECTRICIAN_309A_DIAGRAMS;
}

function moduleCodeFromLabel(label: string): Electrician309AModuleCode | null {
  const code = label.charAt(0);
  return ["A", "B", "C", "D", "E"].includes(code) ? code as Electrician309AModuleCode : null;
}

export default function Electrician309APractice() {
  usePageMeta({
    title: "Ontario 309A Electrician Practice | Echelon Institute",
    description: "Free Ontario 309A Construction Electrician practice, mock exams, flashcards, study notes, and progress tools from Echelon Institute.",
    path: "/electrician-309a",
  });
  const bank = useElectrician309ABank();
  const session = useQuizSession({ examType: "electrician-309a", allQuestions: bank.questions, freeCourse: true });

  if (!bank.isLoading && bank.questions.length > 0 && !session.initialized) session.initialize();
  if (bank.isLoading) return <QuizSkeleton />;
  if (bank.dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return <QuizShell
    examType="electrician-309a"
    currentPath="/electrician-309a"
    courseLabel="Ontario 309A · Construction Electrician"
    courseTitle="309A Electrician Practice"
    courseSubtitle={`${bank.totalQuestions} original questions · 16 concept diagrams · Free course`}
    headerGradient="linear-gradient(135deg, #1E3A5F 0%, #0047AB 52%, #087C99 100%)"
    headerIcon="⚡"
    headerActions={[{ label: "📝 Mock Exam", href: "/electrician-309a-mock" }, { label: "🃏 Flashcards", href: "/electrician-309a-flashcards" }]}
    history={session.history}
    correctCount={session.correctCount}
    wrongCount={session.wrongCount}
    sessionSize={session.sessionSize}
    modules={MODULE_CONFIG}
    selectedModule={session.selectedModule}
    onModuleChange={session.handleModuleChange}
    hasCalcOnly
    calcOnly={session.calcOnly}
    noCalcQuestions={session.noCalcQuestions}
    onCalcOnlyToggle={session.handleCalcOnlyToggle}
    current={session.current}
    selected={session.selected}
    confidence={session.confidence}
    confirmed={session.confirmed}
    showSteps={session.showSteps}
    tutorOpen={session.tutorOpen}
    onSelect={session.setSelected}
    onConfirm={session.handleConfirm}
    onNext={session.handleNext}
    onGoBack={session.goBack}
    onConfidenceChange={session.setConfidence}
    onToggleSteps={() => session.setShowSteps((show) => !show)}
    onTutorOpen={() => session.setTutorOpen(true)}
    onTutorClose={() => session.setTutorOpen(false)}
    onResetSession={session.resetSession}
    timedSeconds={session.quizSettings.timedMode ? session.quizSettings.timedSeconds : 0}
    onTimeUp={session.handleTimeUp}
    mockExamHref="/electrician-309a-mock"
    moduleOverviews={bank.overviews}
    renderQuestionSupplement={(question) => isDiagramId(question.diagramId)
      ? <Electrician309ADiagram id={question.diagramId} caption={typeof question.diagramAlt === "string" ? question.diagramAlt : undefined} />
      : null}
    renderModuleSupplement={(moduleName) => {
      const moduleCode = moduleCodeFromLabel(moduleName);
      return moduleCode ? <Electrician309AStudySupplement moduleCode={moduleCode} /> : null;
    }}
    headerExtra={<><QuizModeBar examType="electrician-309a" currentMode={session.quizMode} onModeChange={session.handleModeChange} missedCount={session.missedCount} onSettingsOpen={() => session.setSettingsOpen(true)} />{session.settingsOpen && <QuizSettingsDrawer settings={session.quizSettings} onApply={session.handleSettingsApply} onClose={() => session.setSettingsOpen(false)} totalQuestions={bank.totalQuestions} trialUnlocked />}</>}
    renderAITutor={() => <AITutor question={session.current as never} userAnswer={session.selected} history={session.history as never} patternMode={false} onClose={() => session.setTutorOpen(false)} examType="electrician-309a" />}
    isFreePreview={false}
    freeLimit={session.sessionSize}
  />;
}
