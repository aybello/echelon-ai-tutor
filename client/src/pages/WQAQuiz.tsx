// WQA Practice Quiz — Unified via useQuizSession hook
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";

export default function WQAQuiz() {
  const { questions: dbQuestions, modules: dbModules, formulaLinks, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("wqa");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: typeof m === "string" ? m : (m as any).name,
    icon: typeof m === "object" ? (m as any).icon : undefined,
    bg: typeof m === "object" ? (m as any).bg : undefined,
    color: typeof m === "object" ? (m as any).color : undefined,
  }));

  const session = useQuizSession({ examType: "wqa", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
    <QuizShell
      currentPath="/wqa"
      courseLabel="Water Quality Analyst"
      courseTitle="WQA Practice Quiz"
      courseSubtitle="500 questions · Ontario Water Quality Analyst"
      headerGradient="linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%)"
      headerIcon="🔬"
      headerActions={[
        { label: "📝 Mock Exam", href: "/wqa-mock" },
        { label: "🃏 Flashcards", href: "/wqa-flashcards" },
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
      mockExamHref="/wqa-mock"
      moduleOverviews={dbOverviews ?? undefined}
      formulaLinks={formulaLinks ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="wqa"
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
          productKey="wqa"
          productName="WQA Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "500 WQA questions — unlimited attempts",
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
