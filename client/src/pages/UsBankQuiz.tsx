import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizModeBar from "@/components/QuizModeBar";
import QuizSettingsDrawer from "@/components/QuizSettingsDrawer";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { useQuizSession } from "@/hooks/useQuizSession";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

import { getCourseByKey } from "@shared/courseRegistry";
import { type PennsylvaniaCourseKey } from "@shared/pennsylvaniaBanks";
export default function UsBankQuiz({ courseKey }: { courseKey: PennsylvaniaCourseKey }) {
  const course = getCourseByKey(courseKey)!;

  usePageMeta({
    title: `${course.displayName} Practice Questions`,
    description: "Original Pennsylvania practice in US customary units. Independent preparation, not an official exam blueprint.",
    noindex: true,
  });

  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank(courseKey, "lazy");
  const allQuestions = dbQuestions;

  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: "US",
    bg: "#DBEAFE",
    color: "#1D4ED8",
  }));

  const session = useQuizSession({ examType: courseKey, allQuestions });

  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <QuizShell
      examType={courseKey}
      currentPath={course.quizPath}
      courseLabel={course.shortName}
      courseTitle={`${course.displayName} Quiz`}
      courseSubtitle="Pennsylvania · US customary units · Independent practice"
      headerGradient="linear-gradient(135deg, #0F172A 0%, #1D4ED8 100%)"
      headerIcon="US"
      headerActions={[
        { label: "Mock Exam", href: course.mockExamPath },
        { label: "Flashcards", href: course.flashcardPath! },
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
      mockExamHref={course.mockExamPath}
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType={courseKey}
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
        <div role="status" style={{ padding: 24, background: "#0F172A", color: "white" }}>
          <h2>Free preview complete</h2>
          <p>Full Pennsylvania course-pass sales are not available yet. No other state or Canadian pass unlocks this course.</p>
          <a href="/us/states/pennsylvania">Back to Pennsylvania preparation</a>
        </div>
      ) : undefined}
    />
  );
}
