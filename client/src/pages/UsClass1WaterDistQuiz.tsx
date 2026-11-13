// US Class I Water Distribution Quiz — US-authored bank, separate from the Canadian WPI courses
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution components": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment/field work": { bg: "#DCFCE7", color: "#15803D" },
  "Water quality/laboratory": { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety/security/administration/public interactions": { bg: "#CCFBF1", color: "#0F766E" },
};
const MODULE_ICONS: Record<string, string> = {
  "Distribution components": "🔧",
  "Equipment/field work": "⚙️",
  "Water quality/laboratory": "🔬",
  "Safety/security/administration/public interactions": "🦺",
};

export default function UsClass1WaterDistQuiz() {
  usePageMeta({
    title: "US Class I Water Distribution Practice Questions",
    description: "Practice questions for the US Class I Water Distribution operator certification exam, written against the WPI Class 1 Water Distribution Need-to-Know Criteria.",
    noindex: true,
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("us-class1-water-dist", "lazy");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));

  const session = useQuizSession({ examType: "us-class1-water-dist", allQuestions });

  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <QuizShell
      examType="us-class1-water-dist"
      currentPath="/us-class1-water-dist"
      courseLabel="US Class I · Water Distribution"
      courseTitle="US Class I Water Distribution Quiz"
      courseSubtitle="United States · WPI Class 1 Need-to-Know Criteria"
      headerGradient="linear-gradient(135deg, #1D4ED8 0%, #0369A1 100%)"
      headerIcon="🚰"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/us-class1-water-dist-mock" },
        { label: "🃏 Flashcards", href: "/us-class1-water-dist-flashcards" },
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
      noCalcQuestions={session.noCalcQuestions}
      onCalcOnlyToggle={session.handleCalcOnlyToggle}
      questionStatus={session.questionStatus}
      questionError={session.questionError}
      onRetryQuestions={session.retryQuestions}
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
      mockExamHref="/us-class1-water-dist-mock"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="us-class1-water-dist"
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
              totalQuestions={session.availableQuestionCount}
              trialUnlocked={session.trialUnlocked}
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
          history={session.history}
          productKey="us-class1-water-dist"
          productName="US Class I Water Distribution Practice Pass"
          priceLabel="CA$149"
          paidFeatures={[
            "198 original US Class I Water Distribution questions with cited sources",
            "Timed mock exam (100 questions, 2 hrs)",
            "Worked step-by-step solutions on every calculation",
            "AI Tutor explanations and module performance tracking",
          ]}
          onUnlocked={session.handleGateUnlocked}
        />
      ) : undefined}
    />
  );
}
