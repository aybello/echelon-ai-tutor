// WPI Class 4 Wastewater Practice Quiz — Unified via useQuizSession hook
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
  "Expert Treatment Operations": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Expert Engineering & Optimization": { bg: "#DCFCE7", color: "#15803D" },
  "Research & Advanced QA/QC": { bg: "#EDE9FE", color: "#6D28D9" },
  "Expert Collection Systems": { bg: "#CCFBF1", color: "#0F766E" },
  "Executive Management": { bg: "#FFEDD5", color: "#C2410C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Expert Treatment Operations": "🔬",
  "Expert Engineering & Optimization": "🔧",
  "Research & Advanced QA/QC": "🧫",
  "Expert Collection Systems": "🚰",
  "Executive Management": "🦺",
};

export default function WpiClass4WastewaterQuiz() {
  usePageMeta({
    title: "WPI Class 4 Wastewater Treatment Practice Questions",
    description: "Practice Questions for WPI Class 4 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("wpi-class4-wastewater", "lazy");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));

  const session = useQuizSession({ examType: "wpi-class4-wastewater", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
    <QuizShell
      examType="wpi-class4-wastewater"
      currentPath="/wpi-class4-wastewater"
      courseLabel="WPI Class 4 · Wastewater Treatment"
      courseTitle="WPI Class 4 Wastewater Practice Quiz"
      courseSubtitle="500 questions · BC (EOCP Level IV) · Alberta (AWWOA Class 4)"
      headerGradient="linear-gradient(135deg, #1D4ED8 0%, #0E7490 100%)"
      headerIcon="👑"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/wpi-class4-wastewater-mock" },
        { label: "🃏 Flashcards", href: "/wpi-class4-wastewater-flashcards" },
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
      mockExamHref="/wpi-class4-wastewater-mock"
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="wpi-class4-wastewater"
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
          productKey="wpi-class4-wastewater"
          productName="WPI Class 4 Wastewater Practice Pass"
          priceLabel="CA$299"
          paidFeatures={[
            "500 WPI Class 4 Wastewater questions — unlimited attempts",
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
