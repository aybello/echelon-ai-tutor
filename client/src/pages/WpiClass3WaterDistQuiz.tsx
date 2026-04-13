// WPI Class 3 Water Distribution Quiz — Unified via useQuizSession hook
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Complex Distribution Systems": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Advanced System Design": { bg: "#DCFCE7", color: "#15803D" },
  "Expert Water Quality": { bg: "#EDE9FE", color: "#6D28D9" },
  "Leadership & Compliance": { bg: "#CCFBF1", color: "#0F766E" },
  "Expert Calculations": { bg: "#FFEDD5", color: "#C2410C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Complex Distribution Systems": "🔧",
  "Advanced System Design": "⚙️",
  "Expert Water Quality": "💧",
  "Leadership & Compliance": "🦺",
  "Expert Calculations": "🔢",
};

export default function WpiClass3WaterDistQuiz() {
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("wpi-class3-water-dist");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));

  const session = useQuizSession({ examType: "wpi-class3-water-dist", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
    <QuizShell
      currentPath="/wpi-class3-water-dist"
      courseLabel="WPI Class 3 · Water Distribution"
      courseTitle="WPI Class 3 Water Distribution Quiz"
      courseSubtitle="500 questions · BC (EOCP Level III) · Alberta (AWWOA Class 3) · SK · MB"
      headerGradient="linear-gradient(135deg, #0369A1 0%, #0E7490 100%)"
      headerIcon="🚰"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/wpi-class3-water-dist-mock" },
        { label: "🃏 Flashcards", href: "/wpi-class3-water-dist-flashcards" },
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
      mockExamHref="/wpi-class3-water-dist-mock"
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="wpi-class3-water-dist"
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
          productKey="wpi-class3-water-dist"
          productName="WPI Class 3 Water Distribution Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "500 WPI Class 3 Water Distribution questions — unlimited attempts",
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
