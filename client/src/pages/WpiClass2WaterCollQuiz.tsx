// WPI Class II Wastewater Collection — Practice Quiz
import { useState, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";
import { trpc } from "@/lib/trpc";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
const HEADER_GRADIENT = "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)";
const SESSION_SIZE = 15;
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const MODULE_CONFIG: { name: string; icon: string }[] = [
  { name: "Advanced Collection System Design", icon: "📐" },
  { name: "Intermediate Lift Station Operations", icon: "⚙️" },
  { name: "System Maintenance & Rehabilitation", icon: "🔧" },
  { name: "Hydraulics & Flow Analysis", icon: "💧" },
  { name: "Regulatory Compliance & Reporting", icon: "📋" },
];
const MODULES = MODULE_CONFIG.map((m: any) => ({ name: m.name, icon: m.icon }));
export default function WpiClass2WaterCollQuiz() {
  // ── Load questions from database ──────────────────────────────────────────
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("wpi-class2-wastewater-coll");
  const allQuestions = dbQuestions as any[];


  // ── Quiz Mode & Settings ───────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const logAttemptFn = useAttemptLogger("wpi-class2-water-coll", quizMode);
  // Fetch missed question IDs from backend for persistence across sessions
  const { data: missedData, refetch: refetchMissed } = trpc.quiz.getMissedQuestions.useQuery(
    { examType: "wpi-class2-water-coll", limit: 50 },
    { refetchOnWindowFocus: false }
  );
  const missedIds = missedData?.questionIds ?? [];
  const missedCount = missedData?.total ?? 0;

  const handleModeChange = (mode: QuizMode) => {
    setQuizMode(mode);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    if (mode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      const mPool = allQuestions.filter((q: any) => missedSet.has(q.id));
      setCurrent(mPool.length > 0 ? (shuffle([...mPool])[0]) : null);
    } else {
      setCurrent((shuffle([...allQuestions])[0]));
    }
  };

  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    setCurrent((shuffle([...allQuestions])[0]));
  };
  // Auto-confirm + advance when timed mode expires
  const handleTimeUp = () => {
    if (confirmed) return; // already answered
    if (!current) return;
    // Determine the correct answer index
    const correctIdx = (current as any).correctIndex ?? 0;
    // Use the user's selection if they picked one, otherwise force a wrong answer
    const effectiveSelected = selected ?? (correctIdx === 0 ? 1 : 0);
    const isCorrect = effectiveSelected === correctIdx;
    // Set confidence to neutral (50) for timed-out questions
    const effectiveConfidence = confidence ?? 50;
    // Push history entry so the question isn't lost
    setHistory(h => [...h, { q: current, selected: effectiveSelected, confidence: effectiveConfidence, correct: isCorrect, questionObj: current } as any]);
    // Log the attempt to the backend for missed-questions tracking
    logAttemptFn({ topic: (current as any).module ?? (current as any).topic ?? "General", questionId: (current as any).id, correct: isCorrect, difficulty: (current as any).difficulty });
    setSelected(effectiveSelected);
    setConfidence(effectiveConfidence);
    setConfirmed(true);
    setTimeout(() => handleNext(), 800);
  };

  const [trialUnlocked] = useState(() => isTrialUnlocked());
  const [history, setHistory] = useState<any[]>([]);
  const [current, setCurrent] = useState<DBQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly] = useState(false);
  const [trialDone, setTrialDone] = useState(false);
  const [initialized, setInitialized] = useState(false);
  function getPool() {
    return allQuestions
      .filter((q: any) => !selectedModule || q.module === selectedModule)
      .filter((q: any) => !calcOnly || q.isCalc);
  }
  function getNext() {
    const pool = getPool().filter((q: any) => q.id !== current?.id);
    return pool.length > 0 ? (shuffle(pool)[0]) : (shuffle(getPool())[0]);
  }
  function handleNext() {
    if (!current || selected === null) return;
    const isCorrect = selected === (current as any).correctIndex;
    const newHistory = [...history, {
      questionId: current.id, module: current.module,
      correct: isCorrect, confidence: confidence ?? 3,
      selectedOption: selected, questionObj: current,
    }];
    setHistory(newHistory);
    // Log attempt for backend persistence (missed questions, topic tracking)
    logAttemptFn({ topic: current.module, questionId: current.id, correct: isCorrect, difficulty: (current as any).difficulty });
    if (!isCorrect) setTimeout(() => refetchMissed(), 500);
        if (!trialUnlocked && newHistory.length >= SESSION_SIZE) {
      setTrialDone(true);
      return;
    }
    const next = getNext();
    setCurrent(next);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
  }
  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrent(prev.questionObj);
    setSelected(prev.selectedOption);
    setConfidence(prev.confidence);
    setConfirmed(true);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history]);
  function handleCalcOnlyToggle() {
    const next = !calcOnly;
    setCalcOnly(next);
    const newPool = allQuestions.filter((q: any) => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? (shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false); setHistory([]);
  }
  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? allQuestions.filter((q: any) => q.module === mod) : allQuestions)
      .filter((q: any) => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? (shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
  }
  const correctCount = history.filter(h => h.correct).length;


  // Set the first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !initialized) {
    const trialPool = allQuestions.filter((q: any) => (q as any).difficulty === "medium" || (q as any).difficulty === "hard");
    const startPool = trialPool.length >= 15 ? trialPool : allQuestions;
    setCurrent(startPool[Math.floor(Math.random() * startPool.length)] ?? null);
    setInitialized(true);
  }

  if (bankLoading) return <QuizSkeleton />;

  return (
      <QuizShell
        currentPath="/wpi-class2-water-coll"
        courseLabel="WPI Class II · Wastewater Collection"
        courseTitle="WPI Class II Wastewater Collection Quiz"
        courseSubtitle="500 questions · BC (EOCP Level II) · Alberta (AWWOA Class II) · SK · MB"
        headerGradient={HEADER_GRADIENT}
        headerIcon="🚧"
        headerActions={[
          { label: "📝 Mock Exam →", href: "/wpi-class2-water-coll-mock" },
          { label: "🃏 Flashcards", href: "/wpi-class2-water-coll-flashcards" },
        ]}
        history={history}
        correctCount={correctCount}
        wrongCount={history.length - correctCount}
        sessionSize={SESSION_SIZE}
        modules={MODULES}
        selectedModule={selectedModule}
        onModuleChange={handleModuleChange}
        hasCalcOnly
        calcOnly={calcOnly}
        onCalcOnlyToggle={handleCalcOnlyToggle}
        current={current}
        selected={selected}
        confidence={confidence}
        confirmed={confirmed}
        showSteps={showSteps}
        tutorOpen={tutorOpen}
        onSelect={idx => { if (!confirmed) { setSelected(idx); setConfidence(null); } }}
        onConfirm={() => { if (selected !== null && confidence !== null) setConfirmed(true); }}
        onNext={handleNext}
        onGoBack={goBack}
        onConfidenceChange={setConfidence}
        onToggleSteps={() => setShowSteps(s => !s)}
        onTutorOpen={() => setTutorOpen(true)}
        onTutorClose={() => setTutorOpen(false)}
        onResetSession={() => {
          setHistory([]); setCurrent((shuffle([...allQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
        }}
        timedSeconds={quizSettings.timedMode ? quizSettings.timedSeconds : 0}
        onTimeUp={handleTimeUp}
        mockExamHref="/wpi-class2-water-coll-mock"
        moduleOverviews={dbOverviews ?? undefined}
        headerExtra={
          <>
            <QuizModeBar
              examType="wpi-class2-water-coll"
              currentMode={quizMode}
              onModeChange={handleModeChange}
              missedCount={missedCount}
              onSettingsOpen={() => setSettingsOpen(true)}
            />
            {settingsOpen && (
              <QuizSettingsDrawer
                settings={quizSettings}
                onApply={handleSettingsApply}
                onClose={() => setSettingsOpen(false)}
                totalQuestions={allQuestions.length}
              />
            )}
          </>
        }
        renderAITutor={() => (
          <AITutor
            question={current as any}
            userAnswer={selected}
            history={history as any}
            patternMode={false}
            onClose={() => setTutorOpen(false)}
          />
        )}
        gate={trialDone && !trialUnlocked ? (
          <QuizGate
            questionsAnswered={history.length}
            productKey="wpi-class2-water-coll"
            productName="WPI Class II Wastewater Collection Practice Pass"
            priceLabel="CA$149"
            paidFeatures={[
              "504 WPI Class II Collection questions — unlimited attempts",
              "Timed mock exam (100 questions, 2 hrs)",
              "AI Tutor explanations on every question",
              "Module-by-module performance tracking",
            ]}
            onUnlocked={() => {
              setTrialUnlocked(); setTrialDone(false);
              setCurrent(getNext());
              setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
            }}
          />
        ) : undefined}
      />
  );
}
