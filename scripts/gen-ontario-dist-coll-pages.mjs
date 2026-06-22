/**
 * Generates all 24 Ontario Distribution/Collection pages:
 * - 8 Quiz pages
 * - 8 Mock Exam pages
 * - 8 Flashcard pages
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = resolve(__dirname, '../client/src/pages');

// Bank configurations
const WATER_DIST_BANKS = [
  {
    classNum: 1, classLabel: 'Class 1', classRoman: 'Class 1',
    bankKey: 'class1-water-dist',
    module: 'Water Distribution',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 1 Water Treatment (Distribution)',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0E7490 100%)',
    accentColor: '#0369A1',
    stream: 'water',
    icon: '🚰',
  },
  {
    classNum: 2, classLabel: 'Class 2', classRoman: 'Class 2',
    bankKey: 'class2-water-dist',
    module: 'Water Distribution',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 2 Water Treatment (Distribution)',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0E7490 100%)',
    accentColor: '#0369A1',
    stream: 'water',
    icon: '🚰',
  },
  {
    classNum: 3, classLabel: 'Class 3', classRoman: 'Class 3',
    bankKey: 'class3-water-dist',
    module: 'Water Distribution',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 3 Water Treatment (Distribution)',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0E7490 100%)',
    accentColor: '#0369A1',
    stream: 'water',
    icon: '🚰',
  },
  {
    classNum: 4, classLabel: 'Class 4', classRoman: 'Class 4',
    bankKey: 'class4-water-dist',
    module: 'Water Distribution',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 4 Water Treatment (Distribution)',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0E7490 100%)',
    accentColor: '#0369A1',
    stream: 'water',
    icon: '🚰',
  },
];

const WW_COLL_BANKS = [
  {
    classNum: 1, classLabel: 'Class 1', classRoman: 'Class 1',
    bankKey: 'class1-wastewater-coll',
    module: 'Wastewater Collection',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 1 Wastewater Treatment (Collection)',
    gradient: 'linear-gradient(135deg, #065F46 0%, #0F766E 100%)',
    accentColor: '#065F46',
    stream: 'wastewater',
    icon: '🔩',
  },
  {
    classNum: 2, classLabel: 'Class 2', classRoman: 'Class 2',
    bankKey: 'class2-wastewater-coll',
    module: 'Collection Systems',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 2 Wastewater Treatment (Collection)',
    gradient: 'linear-gradient(135deg, #065F46 0%, #0F766E 100%)',
    accentColor: '#065F46',
    stream: 'wastewater',
    icon: '🔩',
  },
  {
    classNum: 3, classLabel: 'Class 3', classRoman: 'Class 3',
    bankKey: 'class3-wastewater-coll',
    module: 'Wastewater Collection',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 3 Wastewater Treatment (Collection)',
    gradient: 'linear-gradient(135deg, #065F46 0%, #0F766E 100%)',
    accentColor: '#065F46',
    stream: 'wastewater',
    icon: '🔩',
  },
  {
    classNum: 4, classLabel: 'Class 4', classRoman: 'Class 4',
    bankKey: 'class4-wastewater-coll',
    module: 'Wastewater Collection',
    priceCAD: 99, priceLabel: 'CA$99',
    subtitle: '300 questions · Ontario Class 4 Wastewater Treatment (Collection)',
    gradient: 'linear-gradient(135deg, #065F46 0%, #0F766E 100%)',
    accentColor: '#065F46',
    stream: 'wastewater',
    icon: '🔩',
  },
];

const ALL_BANKS = [...WATER_DIST_BANKS, ...WW_COLL_BANKS];

function componentName(bankKey) {
  // class1-water-dist -> Class1WaterDist
  // class2-wastewater-coll -> Class2WastewaterColl
  return bankKey
    .split('-')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function quizPath(bankKey) { return `/${bankKey}`; }
function mockPath(bankKey) { return `/${bankKey}-mock`; }
function flashcardsPath(bankKey) { return `/${bankKey}-flashcards`; }

function genQuizPage(b) {
  const comp = componentName(b.bankKey);
  const isWater = b.stream === 'water';
  const streamLabel = isWater ? 'Water Distribution' : 'Wastewater Collection';
  const productName = `Ontario ${b.classLabel} ${streamLabel} Practice Pass`;
  return `import QuizShell from "@/components/QuizShell";
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
  "${b.module}": { bg: "${isWater ? '#DBEAFE' : '#D1FAE5'}", color: "${isWater ? '#1D4ED8' : '#065F46'}" },
};
const MODULE_ICONS: Record<string, string> = {
  "${b.module}": "${b.icon}",
};

export default function ${comp}Quiz() {
  usePageMeta({
    title: "Ontario ${b.classLabel} ${streamLabel} Practice Questions",
    description: "Practice questions for the Ontario ${b.classLabel} ${streamLabel} operator certification exam. 300 questions aligned to Ontario O. Reg. 170/03 and O. Reg. 129/04.",
  });
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("${b.bankKey}", "lazy");
  const allQuestions = dbQuestions;
  const MODULES: ModuleConfig[] = dbModules.map((m) => ({
    name: m,
    icon: MODULE_ICONS[m] ?? "📚",
    bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
    color: MODULE_COLORS[m]?.color ?? "#475569",
  }));
  const session = useQuizSession({ examType: "${b.bankKey}", allQuestions });
  if (!bankLoading && allQuestions.length > 0 && !session.initialized) {
    session.initialize();
  }
  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <QuizShell
      examType="${b.bankKey}"
      currentPath="${quizPath(b.bankKey)}"
      courseLabel="Ontario ${b.classLabel} · ${streamLabel}"
      courseTitle="Ontario ${b.classLabel} ${streamLabel} Quiz"
      courseSubtitle="${b.subtitle}"
      headerGradient="${b.gradient}"
      headerIcon="${b.icon}"
      headerActions={[
        { label: "📝 Mock Exam →", href: "${mockPath(b.bankKey)}" },
        { label: "🃏 Flashcards", href: "${flashcardsPath(b.bankKey)}" },
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
      mockExamHref="${mockPath(b.bankKey)}"
      formulaLinks={formulaLinks ?? undefined}
      moduleOverviews={dbOverviews ?? undefined}
      headerExtra={
        <>
          <QuizModeBar
            examType="${b.bankKey}"
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
          productKey="${b.bankKey}"
          productName="${productName}"
          priceLabel="${b.priceLabel}"
          paidFeatures={[
            "300 Ontario ${b.classLabel} ${streamLabel} questions — unlimited attempts",
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
`;
}

function genMockExamPage(b) {
  const comp = componentName(b.bankKey);
  const isWater = b.stream === 'water';
  const streamLabel = isWater ? 'Water Distribution' : 'Wastewater Collection';
  const productName = `Ontario ${b.classLabel} ${streamLabel} Practice Pass`;
  const moduleColorEntry = isWater
    ? `  "${b.module}": { bg: "#DBEAFE", color: "#1D4ED8" },`
    : `  "${b.module}": { bg: "#D1FAE5", color: "#065F46" },`;
  return `import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
${moduleColorEntry}
};

export default function ${comp}MockExam() {
  usePageMeta({
    title: "Ontario ${b.classLabel} ${streamLabel} Mock Exam",
    description: "100-question timed mock exam for the Ontario ${b.classLabel} ${streamLabel} certification. 2-hour timer, 70% pass threshold.",
  });
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("${b.bankKey}");
  const POOL: ExamQuestion[] = (dbQuestions as any[]).map((q: any) => ({
    id: q.id, module: q.module,
    question: q.question ?? q.text ?? "",
    options: q.options,
    correct: q.correctIndex ?? q.correct ?? q.correctAnswer ?? 0,
    explanation: q.explanation,
  }));
  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <MockExamShell
      title="Ontario ${b.classLabel} ${streamLabel} Mock Exam"
      badge="ONTARIO ${b.classLabel.toUpperCase()} · ${streamLabel.toUpperCase()}"
      metaDescription="100-question timed mock exam for Ontario ${b.classLabel} ${streamLabel} certification. 2-hour timer, 70% pass threshold."
      metaKeywords="Ontario ${b.classLabel} ${streamLabel} mock exam, Ontario operator certification"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="${b.bankKey}"
      productName="${productName}"
      price={${b.priceCAD}}
      backPath="/class${b.classNum}-${isWater ? 'water' : 'wastewater'}"
      practicePath="${quizPath(b.bankKey)}"
      practiceLabel="${b.classLabel} ${streamLabel} Practice"
      showProvinceSelector={false}
      currentPath="${mockPath(b.bankKey)}"
      infoLine={\`\${POOL.length} questions · Ontario ${b.classLabel} ${streamLabel}\`}
      stream="${b.stream}"
      accentColor="${b.accentColor}"
    />
  );
}
`;
}

function genFlashcardsPage(b) {
  const comp = componentName(b.bankKey);
  const isWater = b.stream === 'water';
  const streamLabel = isWater ? 'Water Distribution' : 'Wastewater Collection';
  const productName = `Ontario ${b.classLabel} ${streamLabel} Practice Pass`;
  return `import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ${comp}Flashcards() {
  usePageMeta({
    title: "Ontario ${b.classLabel} ${streamLabel} Flashcards",
    description: "Flashcards for the Ontario ${b.classLabel} ${streamLabel} operator certification exam.",
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("${b.bankKey}");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario ${b.classLabel} ${streamLabel}" backPath="${quizPath(b.bankKey)}">
      <PurchaseGate
        examType="${b.bankKey}"
        productKey="${b.bankKey}"
        productName="${productName}"
        price={${b.priceCAD}}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario ${b.classLabel} ${streamLabel}"
          examType="${b.bankKey}"
          backPath="${quizPath(b.bankKey)}"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
`;
}

let count = 0;
for (const b of ALL_BANKS) {
  const comp = componentName(b.bankKey);
  writeFileSync(`${PAGES_DIR}/${comp}Quiz.tsx`, genQuizPage(b));
  writeFileSync(`${PAGES_DIR}/${comp}MockExam.tsx`, genMockExamPage(b));
  writeFileSync(`${PAGES_DIR}/${comp}Flashcards.tsx`, genFlashcardsPage(b));
  count += 3;
  console.log(`Generated: ${comp}Quiz.tsx, ${comp}MockExam.tsx, ${comp}Flashcards.tsx`);
}
console.log(`\nDone: ${count} files written.`);
