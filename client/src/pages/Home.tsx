// ECHELON AI TUTOR — OIT Free Quiz Page
// Unified UI via QuizShell component
import { useState, useCallback, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import QuizShell from "@/components/QuizShell";
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";
import { trpc } from "@/lib/trpc";

const SESSION_SIZE = 15;

// ── HistoryEntry for OIT quiz (uses questionId, not q) ──────────────────────
interface HistoryEntry {
  questionId: number;
  module: string;
  difficulty: string;
  correct: boolean;
  confidence: number;
  selectedOption: number;
  wrongExplanation?: string | null;
  questionObj?: DBQuestion;
}

// Module config with colors/icons for QuizShell
const MODULE_CONFIG = [
  { name: "Disinfection",             icon: "🧪", bg: "#DBEAFE", color: "#1D4ED8" },
  { name: "Chemical Feed & Storage",  icon: "⚗️", bg: "#FEF9C3", color: "#A16207" },
  { name: "Hydraulics",               icon: "💧", bg: "#DCFCE7", color: "#15803D" },
  { name: "Math & Calculations",      icon: "📐", bg: "#FFEDD5", color: "#C2410C" },
  { name: "Ontario Regulations",      icon: "📋", bg: "#EDE9FE", color: "#6D28D9" },
  { name: "Pumping Systems",          icon: "⚙️", bg: "#CCFBF1", color: "#0F766E" },
  { name: "Water Treatment",          icon: "🏭", bg: "#DBEAFE", color: "#0369A1" },
  { name: "Wastewater Treatment",     icon: "♻️", bg: "#ECFDF5", color: "#065F46" },
  { name: "Water Quality & Sampling", icon: "🔬", bg: "#FEF9C3", color: "#A16207" },
  { name: "Health & Safety",          icon: "🦺", bg: "#FEE2E2", color: "#B91C1C" },
  { name: "Water Distribution",       icon: "🚰", bg: "#E0F2FE", color: "#0369A1" },
];

// ── Adaptive next-question selection (replaces getNextQuestion from questions.ts) ──
function getNextQuestion(history: HistoryEntry[], allQuestions: DBQuestion[]): DBQuestion | null {
  if (history.length === 0) return allQuestions[0] ?? null;
  const recentHistory = history.slice(-6);
  const moduleCounts: Record<string, { wrong: number; total: number }> = {};
  recentHistory.forEach((h) => {
    if (!moduleCounts[h.module]) moduleCounts[h.module] = { wrong: 0, total: 0 };
    moduleCounts[h.module].total++;
    if (!h.correct) moduleCounts[h.module].wrong++;
  });
  const weakModules = Object.entries(moduleCounts)
    .filter(([, v]) => v.wrong / v.total >= 0.5)
    .map(([k]) => k);
  const answered = new Set(history.map((h) => h.questionId));
  const unanswered = allQuestions.filter((q: any) => !answered.has(q.id));
  if (unanswered.length === 0) return null;
  if (weakModules.length > 0) {
    const weakQ = unanswered.filter((q: any) => weakModules.includes(q.module));
    if (weakQ.length > 0) {
      return weakQ[Math.floor(Math.random() * weakQ.length)];
    }
  }
  return unanswered[Math.floor(Math.random() * unanswered.length)];
}

export default function Home() {
  usePageMeta({
    title: "OIT Practice Quiz — 551+ Questions",
    description: "Practice for the Ontario Operator-in-Training (OIT) exam with 551+ questions across 11 modules including Water Distribution. AI Tutor, step-by-step solutions, and confidence tracking included.",
    keywords: "water operator exam, OIT exam prep, wastewater certification, operator practice questions",
  });

  // ── Load questions from database ──────────────────────────────────────────
  const { questions: dbQuestions, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("oit");
  const allQuestions = dbQuestions as DBQuestion[];

  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds]         = useState<Set<number>>(new Set());
  const [current, setCurrent]         = useState<DBQuestion | null>(null);
  const [selected, setSelected]       = useState<number | null>(null);
  const [confidence, setConfidence]   = useState<number | null>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [showSteps, setShowSteps]     = useState(false);
  const [tutorOpen, setTutorOpen]     = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly]       = useState(false);
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isTrialUnlocked());
  const [showGate, setShowGate]       = useState(false);
  const [quizMode, setQuizMode]       = useState<QuizMode>("standard");
  const [missedIds, setMissedIds]     = useState<number[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Set the first question once data loads
  if (!bankLoading && allQuestions.length > 0 && !initialized) {
    setCurrent(allQuestions[0]);
    setInitialized(true);
  }

  // Attempt logger — fires silently on every confirmed answer
  const logAttempt = useAttemptLogger("oit", quizMode);

  // Fetch missed question IDs for the Missed Quiz mode
  const { data: missedData } = trpc.quiz.getMissedQuestions.useQuery(
    { examType: "oit", limit: 30 },
    { refetchOnWindowFocus: false }
  );

  const correctCount = history.filter(h => h.correct).length;
  const wrongCount   = history.filter(h => !h.correct).length;
  const missedCount  = missedData?.total ?? 0;

  // ── Filtered pool ──────────────────────────────────────────────────────────
  const pool = useMemo(() => {
    let qs = allQuestions.filter((q: any) => !usedIds.has(q.id));
    if (quizMode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      qs = allQuestions.filter((q: any) => missedSet.has(q.id) && !usedIds.has(q.id));
    } else {
      if (selectedModule) qs = qs.filter((q: any) => q.module === selectedModule);
      if (calcOnly) qs = qs.filter((q: any) => q.isCalc === true);
    }
    return qs;
  }, [allQuestions, usedIds, selectedModule, calcOnly, quizMode, missedIds]);

  // ── Confirm answer ─────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const correctIdx = (current as any).correctAnswer ?? (current as any).correct ?? (current as any).correctIndex ?? 0;
    const isCorrect = selected === correctIdx;
    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty ?? "medium",
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      wrongExplanation: null,
      questionObj: current,
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setUsedIds(s => new Set([...Array.from(s), current.id]));
    setConfirmed(true);
    logAttempt({ topic: current.module, questionId: current.id, correct: isCorrect, difficulty: current.difficulty ?? "medium" });
    if (quizMode !== "quick10" && updatedHistory.length >= SESSION_SIZE && !trialUnlocked) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlocked, logAttempt, quizMode]);

  // ── Next question ──────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (quizMode === "quick10" && history.length >= 10) {
      setCurrent(null);
      return;
    }
    if (history.length >= SESSION_SIZE && !trialUnlocked) {
      setShowGate(true);
      return;
    }
    const nextQ = getNextQuestion(history, pool.length > 0 ? pool : allQuestions);
    if (!nextQ) {
      setCurrent(null);
      return;
    }
    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history, pool, allQuestions, trialUnlocked, quizMode]);

  // ── Go back ────────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = history.slice(0, -1);
    const prev = history[history.length - 1];
    setHistory(newHistory);
    setUsedIds(s => {
      const next = new Set(Array.from(s));
      next.delete(prev.questionId);
      return next;
    });
    setCurrent((prev.questionObj as DBQuestion) ?? null);
    setSelected(prev.selectedOption);
    setConfidence(prev.confidence);
    setConfirmed(true);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history]);

  // ── Reset session ──────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setHistory([]);
    setUsedIds(new Set());
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setShowGate(false);
    const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    setCurrent(q ?? null);
  }, [allQuestions]);

  // ── Mode change ────────────────────────────────────────────────────────────
  const handleModeChange = useCallback((mode: QuizMode) => {
    setQuizMode(mode);
    setHistory([]);
    setUsedIds(new Set());
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    if (mode === "missed") {
      const ids = missedData?.questionIds ?? [];
      setMissedIds(ids);
      if (ids.length > 0) {
        const missedSet = new Set(ids);
        const mPool = allQuestions.filter((q: any) => missedSet.has(q.id));
        const q = mPool[Math.floor(Math.random() * mPool.length)];
        setCurrent(q ?? null);
      } else {
        setCurrent(null);
      }
    } else if (mode === "quick10") {
      const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      setCurrent(q ?? null);
    } else {
      const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      setCurrent(q ?? null);
    }
  }, [missedData, allQuestions]);

  // ── Settings apply ──────────────────────────────────────────────────────────
  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setSettingsOpen(false);
    setHistory([]);
    setUsedIds(new Set());
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    setCurrent(q ?? null);
  };

  // Auto-confirm + advance when timed mode expires
  const handleTimeUp = useCallback(() => {
    if (confirmed) return;
    if (!current) return;
    const correctIdx = (current as any).correctAnswer ?? (current as any).correct ?? (current as any).correctIndex ?? 0;
    const effectiveSelected = selected ?? (correctIdx === 0 ? 1 : 0);
    const isCorrect = effectiveSelected === correctIdx;
    const effectiveConfidence = confidence ?? 50;
    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty ?? "medium",
      correct: isCorrect,
      confidence: effectiveConfidence,
      selectedOption: effectiveSelected,
      wrongExplanation: null,
      questionObj: current,
    };
    setHistory(h => [...h, entry]);
    setUsedIds(s => new Set([...Array.from(s), current.id]));
    logAttempt({ topic: current.module, questionId: current.id, correct: isCorrect, difficulty: current.difficulty ?? "medium" });
    setSelected(effectiveSelected);
    setConfidence(effectiveConfidence);
    setConfirmed(true);
    setTimeout(() => handleNext(), 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, handleNext, selected, current, confidence, logAttempt]);

  // ── Calc Only toggle ───────────────────────────────────────────────────────
  const handleCalcOnlyToggle = useCallback(() => {
    const next = !calcOnly;
    setCalcOnly(next);
    if (next) {
      let calcPool = allQuestions.filter((q: any) => q.isCalc === true && !usedIds.has(q.id));
      if (selectedModule) calcPool = calcPool.filter((q: any) => q.module === selectedModule);
      if (calcPool.length > 0) {
        const q = calcPool[Math.floor(Math.random() * calcPool.length)];
        setCurrent(q);
        setSelected(null);
        setConfidence(null);
        setConfirmed(false);
        setShowSteps(false);
      }
    }
  }, [calcOnly, allQuestions, usedIds, selectedModule]);

  // ── Module change ──────────────────────────────────────────────────────────
  const handleModuleChange = useCallback((mod: string | null) => {
    setSelectedModule(mod);
    let newPool = allQuestions.filter((q: any) => !usedIds.has(q.id));
    if (mod) newPool = newPool.filter((q: any) => q.module === mod);
    if (calcOnly) newPool = newPool.filter((q: any) => q.isCalc === true);
    if (newPool.length > 0) {
      const q = newPool[Math.floor(Math.random() * newPool.length)];
      setCurrent(q);
      setSelected(null);
      setConfidence(null);
      setConfirmed(false);
      setShowSteps(false);
    }
  }, [allQuestions, usedIds, calcOnly]);

  if (bankLoading || allQuestions.length === 0) return <QuizSkeleton />;

  return (
    <>
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
        history={history}
        correctCount={correctCount}
        wrongCount={wrongCount}
        sessionSize={quizMode === "quick10" ? 10 : SESSION_SIZE}
        modules={MODULE_CONFIG}
        selectedModule={selectedModule}
        onModuleChange={handleModuleChange}
        hasCalcOnly={true}
        calcOnly={calcOnly}
        onCalcOnlyToggle={handleCalcOnlyToggle}
        current={current}
        selected={selected}
        confidence={confidence}
        confirmed={confirmed}
        showSteps={showSteps}
        tutorOpen={tutorOpen}
        onSelect={setSelected}
        onConfirm={handleConfirm}
        onNext={handleNext}
        onGoBack={goBack}
        onConfidenceChange={setConfidence}
        onToggleSteps={() => setShowSteps(v => !v)}
        onTutorOpen={() => setTutorOpen(true)}
        onTutorClose={() => setTutorOpen(false)}
        onResetSession={resetSession}
        timedSeconds={quizSettings.timedMode ? quizSettings.timedSeconds : 0}
        onTimeUp={handleTimeUp}
        mockExamHref="/oit-mock"
        moduleOverviews={dbOverviews ?? undefined}
        headerExtra={
          <>
            <QuizModeBar
              examType="oit"
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
      />
      {/* Trial gate — shown after SESSION_SIZE questions for non-unlocked users */}
      {showGate && (
        <QuizGate
          questionsAnswered={history.length}
          productKey="oit"
          productName="OIT Practice Pass"
          priceLabel="CA$49"
          paidFeatures={[
            "Full 551+ question bank — unlimited attempts",
            "OIT Mock Exam (100 questions, 2-hour timer)",
            "AI Tutor explanations on every question",
            "Score history & module breakdown",
          ]}
          onUnlocked={() => {
            setTrialUnlocked();
            setTrialUnlockedState(true);
            setShowGate(false);
          }}
          onDismiss={() => setShowGate(false)}
        />
      )}
    </>
  );
}
