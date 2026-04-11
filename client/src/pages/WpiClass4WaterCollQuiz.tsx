// WPI Class IV Wastewater Collection — Practice Quiz
import { useState, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import { wpiClass4WastewaterCollQuestions, WPI_CLASS4_WASTEWATER_COLL_MODULES } from "@/lib/wpiClass4WastewaterCollQuestions";
import { WPI_CLASS4_WASTEWATER_COLL_OVERVIEWS } from "@/lib/moduleOverviews";
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";
import { trpc } from "@/lib/trpc";
const HEADER_GRADIENT = "linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)";
const SESSION_SIZE = 15;
type Q = typeof wpiClass4WastewaterCollQuestions[0];
type CompatQ = Q & { text: string; correct: number };
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function toCompat(q: Q): CompatQ {
  return { ...q, text: q.question, correct: q.correctAnswer };
}
const MODULE_CONFIG: { name: string; icon: string }[] = [
  { name: "System Planning & Capital Improvement", icon: "📋" },
  { name: "Advanced Engineering & Design", icon: "📐" },
  { name: "Utility Management & Leadership", icon: "👔" },
  { name: "Advanced Regulatory & Environmental Management", icon: "⚖️" },
  { name: "Emerging Technologies & Innovation", icon: "🚀" },
];
const MODULES = MODULE_CONFIG.map(m => ({ name: m.name, icon: m.icon }));
export default function WpiClass4WaterCollQuiz() {
  // ── Quiz Mode & Settings ───────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const logAttemptFn = useAttemptLogger("wpi-class4-water-coll", quizMode);
  // Fetch missed question IDs from backend for persistence across sessions
  const { data: missedData, refetch: refetchMissed } = trpc.quiz.getMissedQuestions.useQuery(
    { examType: "wpi-class4-water-coll", limit: 50 },
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
      const mPool = wpiClass4WastewaterCollQuestions.filter((q: any) => missedSet.has(q.id));
      setCurrent(mPool.length > 0 ? toCompat(shuffle([...mPool])[0]) : null);
    } else {
      setCurrent(toCompat(shuffle([...wpiClass4WastewaterCollQuestions])[0]));
    }
  };

  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    setCurrent(toCompat(shuffle([...wpiClass4WastewaterCollQuestions])[0]));
  };
  // Auto-confirm + advance when timed mode expires
  const handleTimeUp = () => {
    if (confirmed) return; // already answered
    if (!current) return;
    // Determine the correct answer index
    const correctIdx = (current as any).correctAnswer ?? (current as any).correct ?? (current as any).correctIndex ?? 0;
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
  const [current, setCurrent] = useState<CompatQ | null>(toCompat(shuffle([...wpiClass4WastewaterCollQuestions])[0]));
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly] = useState(false);
  const [trialDone, setTrialDone] = useState(false);
  function getPool() {
    return wpiClass4WastewaterCollQuestions
      .filter(q => !selectedModule || q.module === selectedModule)
      .filter(q => !calcOnly || q.isCalc);
  }
  function getNext() {
    const pool = getPool().filter(q => q.id !== current?.id);
    return pool.length > 0 ? toCompat(shuffle(pool)[0]) : toCompat(shuffle(getPool())[0]);
  }
  function handleNext() {
    if (!current || selected === null) return;
    const isCorrect = selected === current.correctAnswer;
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
    const newPool = wpiClass4WastewaterCollQuestions.filter(q => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false); setHistory([]);
  }
  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? wpiClass4WastewaterCollQuestions.filter(q => q.module === mod) : wpiClass4WastewaterCollQuestions)
      .filter(q => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
  }
  const correctCount = history.filter(h => h.correct).length;
  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="wpi-class4-water-coll"
        productName="WPI Class IV Wastewater Collection Practice Pass"
        priceLabel="CA$299"
        paidFeatures={[
          "504 WPI Class IV Collection questions — unlimited attempts",
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
    );
  }
  return (
      <QuizShell
        currentPath="/wpi-class4-water-coll"
        courseLabel="WPI Class IV · Wastewater Collection"
        courseTitle="WPI Class IV Wastewater Collection Quiz"
        courseSubtitle="500 questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB"
        headerGradient={HEADER_GRADIENT}
        headerIcon="🚧"
        headerActions={[
          { label: "📝 Mock Exam →", href: "/wpi-class4-water-coll-mock" },
          { label: "🃏 Flashcards", href: "/wpi-class4-water-coll-flashcards" },
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
          setHistory([]); setCurrent(toCompat(shuffle([...wpiClass4WastewaterCollQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
        }}
        timedSeconds={quizSettings.timedMode ? quizSettings.timedSeconds : 0}
        onTimeUp={handleTimeUp}
        mockExamHref="/wpi-class4-water-coll-mock"
        moduleOverviews={WPI_CLASS4_WASTEWATER_COLL_OVERVIEWS}
        headerExtra={
          <>
            <QuizModeBar
              examType="wpi-class4-water-coll"
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
                totalQuestions={wpiClass4WastewaterCollQuestions.length}
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
      />
  );
}
