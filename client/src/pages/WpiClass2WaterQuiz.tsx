// WPI Class 2 Water Practice Quiz — Unified via useQuizSession hook
import { usePageMeta } from "@/hooks/usePageMeta";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Treatment Processes": { bg: "#DBEAFE", color: "#1D4ED8" },
  "System Design & Engineering": { bg: "#DCFCE7", color: "#15803D" },
  "Advanced Laboratory & Monitoring": { bg: "#EDE9FE", color: "#6D28D9" },
  "Source Water & Environmental": { bg: "#CCFBF1", color: "#0F766E" },
  "Management, Regulations & Safety": { bg: "#FFEDD5", color: "#C2410C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Advanced Treatment Processes": "⚗️",
  "System Design & Engineering": "🔧",
  "Advanced Laboratory & Monitoring": "🔬",
  "Source Water & Environmental": "🌊",
  "Management, Regulations & Safety": "🦺",
};

export default function WpiClass2WaterQuiz() {
  usePageMeta({
    title: "WPI Class 2 Water Treatment Practice Quiz",
    description: "Practice for the WPI Class 2 Water Treatment operator exam with 500 questions.",
    path: "/wpi-class2-water",
    keywords: "WPI Class 2 water treatment, operator exam prep",
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("wpi-class2-water", "lazy");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#1E293B",
    color: MODULE_COLORS[m]?.color ?? "#E2E8F0",
  }));

  const session = useQuizSession({ examType: "wpi-class2-water", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <QuizShell
      examType="wpi-class2-water"
      currentPath="/wpi-class2-water"
      courseLabel="WPI Class 2 · Water Treatment"
      courseTitle="WPI Class 2 Water Practice Quiz"
      courseSubtitle="500 questions · BC (EOCP Level II) · Alberta (AWWOA Class 2) · SK · MB"
      headerGradient="linear-gradient(135deg, #1D4ED8 0%, #0E7490 100%)"
      headerIcon="🔬"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/wpi-class2-water-mock" },
        { label: "🃏 Flashcards", href: "/wpi-class2-water-flashcards" },
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
      mockExamHref="/wpi-class2-water-mock"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="wpi-class2-water"
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
          productKey="wpi-class2-water"
          productName="WPI Class 2 Water Treatment Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "502 WPI Class 2 questions — unlimited attempts",
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
