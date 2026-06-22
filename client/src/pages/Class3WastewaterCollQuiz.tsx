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
  "Wastewater Collection": { bg: "#D1FAE5", color: "#065F46" },
};
const MODULE_ICONS: Record<string, string> = {
  "Wastewater Collection": "🔩",
};

export default function Class3WastewaterCollQuiz() {
  usePageMeta({
    title: "Ontario Class 3 Wastewater Collection Practice Questions",
    description: "Practice questions for the Ontario Class 3 Wastewater Collection operator certification exam. 300 questions aligned to Ontario O. Reg. 170/03 and O. Reg. 129/04.",
  });
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("class3-wastewater-coll", "lazy");
  const allQuestions = dbQuestions;
  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));
  const session = useQuizSession({ examType: "class3-wastewater-coll", allQuestions });
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }
  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <QuizShell
      examType="class3-wastewater-coll"
      currentPath="/class3-wastewater-coll"
      courseLabel="Ontario Class 3 · Wastewater Collection"
      courseTitle="Ontario Class 3 Wastewater Collection Quiz"
      courseSubtitle="300 questions · Ontario Class 3 Wastewater Treatment (Collection)"
      headerGradient="linear-gradient(135deg, #065F46 0%, #0F766E 100%)"
      headerIcon="🔩"
      headerActions={[
        { label: "📝 Mock Exam →", href: "/class3-wastewater-coll-mock" },
        { label: "🃏 Flashcards", href: "/class3-wastewater-coll-flashcards" },
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
      mockExamHref="/class3-wastewater-coll-mock"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="class3-wastewater-coll"
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
          productKey="class3-wastewater-coll"
          productName="Ontario Class 3 Wastewater Collection Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "300 Ontario Class 3 Wastewater Collection questions — unlimited attempts",
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
