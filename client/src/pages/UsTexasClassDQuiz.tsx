import { useEffect } from "react";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate from "@/components/QuizGate";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  TEXAS_CLASS_D_WATER_MATH_QUESTIONS_PER_MOCK,
  TEXAS_CLASS_D_WATER_MOCK_QUESTIONS,
  TEXAS_CLASS_D_WATER_TOTAL_QUESTIONS,
} from "@shared/texasClassD";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Rules, licensing and records": { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety and operator responsibilities": { bg: "#FEF2F2", color: "#B91C1C" },
  "Source water and general water quality": { bg: "#ECFEFF", color: "#0E7490" },
  "Groundwater systems": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Surface water treatment": { bg: "#DCFCE7", color: "#15803D" },
  "Storage and distribution": { bg: "#FFF7ED", color: "#C2410C" },
  "Disinfection": { bg: "#F0FDF4", color: "#166534" },
  "Water utility math": { bg: "#FEFCE8", color: "#A16207" },
};

const MODULE_ICONS: Record<string, string> = {
  "Rules, licensing and records": "📋",
  "Safety and operator responsibilities": "🦺",
  "Source water and general water quality": "💧",
  "Groundwater systems": "🕳️",
  "Surface water treatment": "🧪",
  "Storage and distribution": "🚰",
  "Disinfection": "🦠",
  "Water utility math": "🧮",
};

/**
 * Texas Class D learning surface. This component is deliberately not registered
 * in App.tsx until the separately staged bank is released and the commercial
 * decision is approved. Its question bank is also in_review, which means it
 * cannot return learner questions before that governed release.
 */
export default function UsTexasClassDQuiz() {
  usePageMeta({
    title: "Texas Class D Water Practice Questions | Echelon Institute",
    description: "Original Texas Class D Water practice questions based on the public TCEQ operator topic scope. Echelon is an independent preparation provider.",
    noindex: true,
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("us-texas-class-d-water", "lazy");
  const allQuestions = dbQuestions;
  const session = useQuizSession({ examType: "us-texas-class-d-water", allQuestions });
  const { initialized, initialize } = session;
  const modules: ModuleConfig[] = dbModules.map((name) => ({
    name,
    icon: MODULE_ICONS[name] ?? "📚",
    bg: MODULE_COLORS[name]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[name]?.color ?? "#475569",
  }));

  useEffect(() => {
    if (!bankLoading && allQuestions.length > 0 && !initialized) {
      initialize();
    }
  }, [allQuestions.length, bankLoading, initialize, initialized]);

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <QuizShell
      examType="us-texas-class-d-water"
      currentPath="/us-texas-class-d-water"
      courseLabel="Texas Class D · Water"
      courseTitle="Texas Class D Water Practice"
      courseSubtitle="Texas · Public TCEQ Class D topic scope"
      headerGradient="linear-gradient(135deg, #7C2D12 0%, #C2410C 48%, #0E7490 100%)"
      headerIcon="⭐"
      headerActions={[
        { label: "📝 Mock Exam", href: "/us-texas-class-d-water-mock" },
        { label: "🃏 Flashcards", href: "/us-texas-class-d-water-flashcards" },
        { label: "🧮 Formula Sheet", href: "/formulas-us-texas-class-d-water" },
      ]}
      history={session.history}
      correctCount={session.correctCount}
      wrongCount={session.wrongCount}
      sessionSize={session.sessionSize}
      modules={modules}
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
      onToggleSteps={() => session.setShowSteps((visible) => !visible)}
      onTutorOpen={() => session.setTutorOpen(true)}
      onTutorClose={() => session.setTutorOpen(false)}
      onResetSession={session.resetSession}
      timedSeconds={session.quizSettings.timedMode ? session.quizSettings.timedSeconds : 0}
      onTimeUp={session.handleTimeUp}
      mockExamHref="/us-texas-class-d-water-mock"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={<>
        <QuizModeBar examType="us-texas-class-d-water" currentMode={session.quizMode} onModeChange={session.handleModeChange} missedCount={session.missedCount} onSettingsOpen={() => session.setSettingsOpen(true)} />
        {session.settingsOpen && <QuizSettingsDrawer settings={session.quizSettings} onApply={session.handleSettingsApply} onClose={() => session.setSettingsOpen(false)} totalQuestions={session.availableQuestionCount} trialUnlocked={session.trialUnlocked} />}
      </>}
      renderAITutor={() => <AITutor question={session.current as any} userAnswer={session.selected} history={session.history as any} patternMode={false} onClose={() => session.setTutorOpen(false)} examType={session.examType} />}
      isFreePreview={!session.trialUnlocked}
      freeLimit={session.sessionSize}
      gate={session.trialDone && !session.trialUnlocked ? <QuizGate
        questionsAnswered={session.history.length}
        history={session.history}
        productKey="us-texas-class-d-water"
        paidFeatures={[
          `${TEXAS_CLASS_D_WATER_TOTAL_QUESTIONS} original Texas Class D Water practice questions`,
          `${TEXAS_CLASS_D_WATER_MOCK_QUESTIONS}-question timed mock exam with an ${TEXAS_CLASS_D_WATER_MATH_QUESTIONS_PER_MOCK}-question math set`,
          "Worked steps on every calculation",
          "AI Tutor explanations and module performance tracking",
        ]}
        onUnlocked={session.handleGateUnlocked}
      /> : undefined}
    />
  );
}
