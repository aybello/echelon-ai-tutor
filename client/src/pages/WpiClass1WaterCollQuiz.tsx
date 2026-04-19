// WPI Class 1 Wastewater Collection Quiz — Unified via useQuizSession hook
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
  "Collection System Components": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation & Maintenance": { bg: "#DCFCE7", color: "#15803D" },
  "Safety & Regulations": { bg: "#EDE9FE", color: "#6D28D9" },
  "Math & Calculations": { bg: "#CCFBF1", color: "#0F766E" },
  "Environmental & Public Health": { bg: "#FFEDD5", color: "#C2410C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Collection System Components": "🔧",
  "Equipment Operation & Maintenance": "⚙️",
  "Safety & Regulations": "🦺",
  "Math & Calculations": "🔢",
  "Environmental & Public Health": "🌿",
};

export default function WpiClass1WaterCollQuiz() {
  usePageMeta({
    title: "WPI Class 1 Water Collection Practice Questions",
    description: "Practice Questions for WPI Class 1 Water Collection operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("wpi-class1-wastewater-coll", "lazy");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));

  const session = useQuizSession({ examType: "wpi-class1-water-coll", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
    <QuizShell
      examType="wpi-class1-water-coll"
      currentPath="/wpi-class1-water-coll"
      courseLabel="WPI Class 1 · Wastewater Collection"
      courseTitle="WPI Class 1 Wastewater Collection Quiz"
      courseSubtitle="500 questions · BC (EOCP Level I) · Alberta (AWWOA Class 1) · SK · MB"
      headerGradient="linear-gradient(135deg, #065F46 0%, #059669 100%)"
      headerIcon="🚧"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/wpi-class1-water-coll-mock" },
        { label: "🃏 Flashcards", href: "/wpi-class1-water-coll-flashcards" },
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
      mockExamHref="/wpi-class1-water-coll-mock"
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="wpi-class1-water-coll"
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
      gate={session.trialDone && !session.trialUnlocked ? (
        <QuizGate
          questionsAnswered={session.history.length}
          productKey="wpi-class1-water-coll"
          productName="WPI Class 1 Wastewater Collection Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "500 WPI Class 1 Wastewater Collection questions — unlimited attempts",
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
