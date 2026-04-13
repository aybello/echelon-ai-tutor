// OIT Practice Quiz — 551+ Questions — Unified via useQuizSession hook
import { usePageMeta } from "@/hooks/usePageMeta";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";

const MODULE_CONFIG: ModuleConfig[] = [
  { name: "Disinfection", icon: "🧪", bg: "#DBEAFE", color: "#1D4ED8" },
  { name: "Chemical Feed & Storage", icon: "⚗️", bg: "#FEF9C3", color: "#A16207" },
  { name: "Hydraulics", icon: "💧", bg: "#DCFCE7", color: "#15803D" },
  { name: "Math & Calculations", icon: "📐", bg: "#FFEDD5", color: "#C2410C" },
  { name: "Ontario Regulations", icon: "📋", bg: "#EDE9FE", color: "#6D28D9" },
  { name: "Pumping Systems", icon: "⚙️", bg: "#CCFBF1", color: "#0F766E" },
  { name: "Water Treatment", icon: "🏭", bg: "#DBEAFE", color: "#0369A1" },
  { name: "Wastewater Treatment", icon: "♻️", bg: "#ECFDF5", color: "#065F46" },
  { name: "Water Quality & Sampling", icon: "🔬", bg: "#FEF9C3", color: "#A16207" },
  { name: "Health & Safety", icon: "🦺", bg: "#FEE2E2", color: "#B91C1C" },
  { name: "Water Distribution", icon: "🚰", bg: "#E0F2FE", color: "#0369A1" },
];

export default function Home() {
  usePageMeta({
    title: "OIT Practice Quiz — 551+ Questions",
    description: "Practice for the Ontario Operator-in-Training (OIT) exam with 551+ questions across 11 modules including Water Distribution. AI Tutor, step-by-step solutions, and confidence tracking included.",
    keywords: "water operator exam, OIT exam prep, wastewater certification, operator practice questions",
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("oit");
  const allQuestions = dbQuestions;

  const MODULES = MODULE_CONFIG;

  const session = useQuizSession({ examType: "oit", allQuestions });

  // Initialize first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
    <QuizShell
      currentPath="/quiz"
      courseLabel="Ontario OIT · Water Treatment"
      courseTitle="OIT Practice Quiz — 551+ Questions"
      courseSubtitle="Free · Ontario OIT Exam Prep"
      headerGradient="linear-gradient(135deg, #1D4ED8 0%, #0F766E 100%)"
      headerIcon="💧"
      headerActions={[
        { label: "📝 Mock Exam", href: "/oit-mock" },
        { label: "🃏 Flashcards", href: "/oit-water-flashcards" },
        { label: "🔬 Processes", href: "/process" },
        { label: "📐 Formulas", href: "/formulas" },
        { label: "🗺️ Career", href: "/career" },
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
      mockExamHref="/oit-mock"
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="oit"
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
          productKey="oit"
          productName="OIT Practice Pass"
          priceLabel="CA$49"
          paidFeatures={[
            "Full 551+ question bank — unlimited attempts",
            "OIT Mock Exam (100 questions, 2-hour timer)",
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
