import QuizShell from "@/components/QuizShell";
import QuizSkeleton from "@/components/QuizSkeleton";
import QuizGate from "@/components/QuizGate";
import AITutor from "@/components/AITutor";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import { usePageMeta } from "@/hooks/usePageMeta";
import type { ModuleConfig } from "@/components/QuizShell";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "General":          { bg: "#FEF9C3", color: "#A16207" },
  "Support Systems":  { bg: "#DBEAFE", color: "#1D4ED8" },
  "Processes":        { bg: "#DCFCE7", color: "#15803D" },
  "Administration":   { bg: "#EDE9FE", color: "#6D28D9" },
};
const MODULE_ICONS: Record<string, string> = {
  "General":          "📐",
  "Support Systems":  "⚙️",
  "Processes":        "🚰",
  "Administration":   "📋",
};

export default function Class2WaterDistQuiz() {
  usePageMeta({
    title: "Ontario Class 2 Water Distribution Practice Questions",
    description: "Practice questions for the Ontario Class 2 Water Distribution operator certification exam. 500 questions aligned to Ontario O. Reg. 170/03 and O. Reg. 129/04.",
  });
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class2-water-dist", "lazy");
  const allQuestions = dbQuestions;
  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));
  const session = useQuizSession({ examType: "class2-water-dist", allQuestions });
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }
  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <QuizShell
      examType="class2-water-dist"
      currentPath="/class2-water-dist"
      courseLabel="Ontario Class 2 · Water Distribution"
      courseTitle="Ontario Class 2 Water Distribution Quiz"
      courseSubtitle="500 questions · Ontario Class 2 Water Distribution"
      headerGradient="linear-gradient(135deg, #0369A1 0%, #0E7490 100%)"
      headerIcon="🚰"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/class2-water-dist-mock" },
        { label: "🃏 Flashcards", href: "/class2-water-dist-flashcards" },
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
      mockExamHref="/class2-water-dist-mock"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="class2-water-dist"
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
          productKey="class2-water-dist"
          productName="Ontario Class 2 Water Distribution Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "300 Ontario Class 2 Water Distribution questions — unlimited attempts",
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
