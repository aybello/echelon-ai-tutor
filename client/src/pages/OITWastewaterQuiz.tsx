// OIT Wastewater Practice Quiz — Unified via useQuizSession hook
import { usePageMeta } from "@/hooks/usePageMeta";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";

export default function OITWastewaterQuiz() {
  usePageMeta({
    title: "OIT Wastewater Practice Quiz — 500+ Questions",
    description: "Practice for the Ontario OIT Wastewater exam with 500+ questions. AI Tutor, step-by-step solutions, and confidence tracking.",
    keywords: "OIT wastewater exam, Ontario wastewater certification, operator practice questions",
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("oit-ww", "lazy");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: typeof m === "string" ? m : (m as any).name,
    icon: typeof m === "object" ? (m as any).icon : undefined,
    bg: typeof m === "object" ? (m as any).bg : undefined,
    color: typeof m === "object" ? (m as any).color : undefined,
  }));

  const session = useQuizSession({ examType: "oit-ww", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <QuizShell
      examType="oit-ww"
      currentPath="/oit-ww"
      courseLabel="Ontario OIT · Wastewater Treatment"
      courseTitle="OIT Wastewater Practice Quiz"
      courseSubtitle="Free · Ontario OIT Wastewater Exam Prep"
      headerGradient="linear-gradient(135deg, #0F766E 0%, #0369A1 100%)"
      headerIcon="🌊"
      headerActions={[
        { label: "📝 Mock Exam", href: "/oit-ww-mock" },
        { label: "🃏 Flashcards", href: "/oit-ww-flashcards" },
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
      mockExamHref="/oit-ww-mock"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="oit-ww"
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
          examType={session.examType}
        />
      )}
      isFreePreview={!session.trialUnlocked}
      freeLimit={session.sessionSize}
      gate={session.trialDone && !session.trialUnlocked ? (
        <QuizGate
          questionsAnswered={session.history.length}
          productKey="oit-ww"
          productName="OIT Wastewater Practice Pass"
          priceLabel="CA$49"
          paidFeatures={[
            "Full 500+ question bank — unlimited attempts",
            "OIT Wastewater Mock Exam (100 questions, 2-hour timer)",
            "AI Tutor explanations on every question",
            "Score history & module breakdown",
          ]}
          onUnlocked={session.handleGateUnlocked}
          onDismiss={session.resetSession}
        />
      ) : undefined}
    />
  );
}
