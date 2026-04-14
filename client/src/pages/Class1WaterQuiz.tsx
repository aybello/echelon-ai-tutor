// Class 1 Water Practice Quiz — Unified via useQuizSession hook
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_CONFIG: ModuleConfig[] = [
  { name: "Water Sources & Quality", icon: "💧", bg: "#DBEAFE", color: "#1D4ED8" },
  { name: "Coagulation & Flocculation", icon: "🧪", bg: "#FEF9C3", color: "#A16207" },
  { name: "Sedimentation", icon: "🏞️", bg: "#DCFCE7", color: "#15803D" },
  { name: "Filtration", icon: "🔍", bg: "#FFEDD5", color: "#C2410C" },
  { name: "Disinfection", icon: "☣️", bg: "#EDE9FE", color: "#6D28D9" },
  { name: "Chemical Feed & Dosing", icon: "⚗️", bg: "#CCFBF1", color: "#0F766E" },
  { name: "Iron & Manganese Removal", icon: "🔩", bg: "#FEE2E2", color: "#B91C1C" },
  { name: "Water Quality & Regulations", icon: "📋", bg: "#DBEAFE", color: "#0369A1" },
  { name: "Water Distribution", icon: "🚰", bg: "#E0F2FE", color: "#0284C7" },
];

export default function Class1WaterQuiz() {
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("class1-water", "lazy");
  const allQuestions = dbQuestions;

  const MODULES = MODULE_CONFIG;

  const session = useQuizSession({ examType: "class1-water", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
    <QuizShell
      currentPath="/class1-water"
      courseLabel="Ontario Class 1 · Water Treatment"
      courseTitle="Class 1 Water Practice Quiz"
      courseSubtitle="500 questions · Ontario Class 1 Water Treatment"
      headerGradient="linear-gradient(135deg, #0369A1 0%, #0E7490 100%)"
      headerIcon="💧"
      headerActions={[
        { label: "📝 Mock Exam", href: "/class1-water-mock" },
        { label: "🃏 Flashcards", href: "/class1-water-flashcards" },
      ]}
      history={session.history}
      correctCount={session.correctCount}
      wrongCount={session.wrongCount}
      sessionSize={session.sessionSize}
      modules={MODULES}
      selectedModule={session.selectedModule}
      onModuleChange={session.handleModuleChange}
      hasCalcOnly
      calcOnly={session.calcOnly}
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
      onToggleSteps={() => session.setShowSteps(s => !s)}
      onTutorOpen={() => session.setTutorOpen(true)}
      onTutorClose={() => session.setTutorOpen(false)}
      onResetSession={session.resetSession}
      timedSeconds={session.quizSettings.timedMode ? session.quizSettings.timedSeconds : 0}
      onTimeUp={session.handleTimeUp}
      mockExamHref="/class1-water-mock"
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="class1-water"
            currentMode={session.quizMode}
            onModeChange={session.handleModeChange}
            missedCount={session.missedCount}
            onSettingsOpen={() => session.setSettingsOpen(true)}
          />
          {session.settingsOpen && (
            <QuizSettingsDrawer
              settings={session.quizSettings}
              onApply={session.handleSettingsApply}
              onClose={() => session.setSettingsOpen(false)}
              totalQuestions={allQuestions.length}
            />
          )}
        </>
      }
      renderAITutor={() => (
        <AITutor
          question={session.current as any}
          userAnswer={session.selected}
          history={session.history as any}
          patternMode={false}
          onClose={() => session.setTutorOpen(false)}
        />
      )}
      gate={session.trialDone && !session.trialUnlocked ? (
        <QuizGate
          questionsAnswered={session.history.length}
          productKey="class1-water"
          productName="Class 1 Water Treatment Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "500 Class 1 Water questions — unlimited attempts",
            "Timed mock exam (100 questions, 2 hrs)",
            "AI Tutor explanations on every question",
            "Module-by-module performance tracking",
          ]}
          onUnlocked={session.handleGateUnlocked}
        />
      ) : undefined}
    />
  );
}
