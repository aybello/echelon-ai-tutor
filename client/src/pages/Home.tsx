// ECHELON AI TUTOR — OIT Free Quiz Page
// Unified UI via QuizShell component
import { useState, useCallback, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  QUESTIONS,
  getNextQuestion,
  type Question,
  type HistoryEntry,
} from "@/lib/questions";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import QuizShell from "@/components/QuizShell";
import { OIT_WATER_OVERVIEWS } from "@/lib/moduleOverviews";
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";
import { trpc } from "@/lib/trpc";

const SESSION_SIZE = 15;

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
  { name: "Water Distribution",         icon: "🚰", bg: "#E0F2FE", color: "#0369A1" },
];

export default function Home() {
  usePageMeta({
    title: "OIT Practice Quiz — 551+ Questions",
    description: "Practice for the Ontario Operator-in-Training (OIT) exam with 551+ questions across 11 modules including Water Distribution. AI Tutor, step-by-step solutions, and confidence tracking included.",
    keywords: "water operator exam, OIT exam prep, wastewater certification, operator practice questions",
  });

  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds]         = useState<Set<number>>(new Set());
  const [current, setCurrent]         = useState<Question | null>(() => QUESTIONS[0] ?? null);
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
    let qs = QUESTIONS.filter(q => !usedIds.has(q.id));
    if (quizMode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      qs = QUESTIONS.filter(q => missedSet.has(q.id) && !usedIds.has(q.id));
    } else {
      if (selectedModule) qs = qs.filter(q => q.module === selectedModule);
      if (calcOnly) qs = qs.filter(q => q.isCalc === true);
    }
    return qs;
  }, [usedIds, selectedModule, calcOnly, quizMode, missedIds]);

  // ── Confirm answer ─────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const isCorrect = selected === current.correct;
    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty,
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      wrongExplanation: !isCorrect ? (current.wrongExp?.[selected] ?? null) : null,
      questionObj: current,
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setUsedIds(s => new Set([...Array.from(s), current.id]));
    setConfirmed(true);
    // Log attempt silently for topic tracking and missed questions
    logAttempt({ topic: current.module, questionId: current.id, correct: isCorrect, difficulty: current.difficulty });
    // Fire gate after SESSION_SIZE answers for non-unlocked users
    const effectiveSize = quizMode === "quick10" ? 10 : SESSION_SIZE;
    if (updatedHistory.length >= effectiveSize && !trialUnlocked) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlocked, logAttempt, quizMode]);

  // ── Next question ──────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    const effectiveSize = quizMode === "quick10" ? 10 : SESSION_SIZE;
    if (history.length >= effectiveSize && !trialUnlocked) {
      setShowGate(true);
      return;
    }
    const nextQ = getNextQuestion(history, pool.length > 0 ? pool : QUESTIONS);
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
  }, [history, pool, trialUnlocked, quizMode]);

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
    setCurrent((prev.questionObj as Question) ?? null);
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
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setCurrent(q ?? null);
  }, []);

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
        const pool = QUESTIONS.filter(q => missedSet.has(q.id));
        const q = pool[Math.floor(Math.random() * pool.length)];
        setCurrent(q ?? null);
      } else {
        setCurrent(null);
      }
    } else if (mode === "quick10") {
      const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
      setCurrent(q ?? null);
    } else {
      const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
      setCurrent(q ?? null);
    }
  }, [missedData]);

  // ── Settings apply ──────────────────────────────────────────────────────────
  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setSettingsOpen(false);
    setHistory([]);
    setUsedIds(new Set());
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setCurrent(q ?? null);
  };
  // Auto-confirm + advance when timed mode expires
  const handleTimeUp = useCallback(() => {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      handleNext();
    }, 1200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, handleNext]);

  // ── Calc Only toggle ───────────────────────────────────────────────────────
  const handleCalcOnlyToggle = useCallback(() => {
    const next = !calcOnly;
    setCalcOnly(next);
    if (next) {
      let calcPool = QUESTIONS.filter(q => q.isCalc === true && !usedIds.has(q.id));
      if (selectedModule) calcPool = calcPool.filter(q => q.module === selectedModule);
      if (calcPool.length > 0) {
        const q = calcPool[Math.floor(Math.random() * calcPool.length)];
        setCurrent(q);
        setSelected(null);
        setConfidence(null);
        setConfirmed(false);
        setShowSteps(false);
      }
    }
  }, [calcOnly, usedIds, selectedModule]);

  // ── Module change ──────────────────────────────────────────────────────────
  const handleModuleChange = useCallback((mod: string | null) => {
    setSelectedModule(mod);
    let newPool = QUESTIONS.filter(q => !usedIds.has(q.id));
    if (mod) newPool = newPool.filter(q => q.module === mod);
    if (calcOnly) newPool = newPool.filter(q => q.isCalc === true);
    if (newPool.length > 0) {
      const q = newPool[Math.floor(Math.random() * newPool.length)];
      setCurrent(q);
      setSelected(null);
      setConfidence(null);
      setConfirmed(false);
      setShowSteps(false);
    }
  }, [usedIds, calcOnly]);

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
          { label: "📝 Mock Exam", href: "/mock-exam" },
          { label: "🃏 Flashcards", href: "/oit-water-flashcards" },
          { label: "🔬 Processes", href: "/process" },
          { label: "📐 Formulas", href: "/formulas" },
          { label: "🗺️ Career", href: "/career" },
        ]}
        history={history}
        correctCount={correctCount}
        wrongCount={wrongCount}
        sessionSize={SESSION_SIZE}
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
        mockExamHref="/mock-exam"
        moduleOverviews={OIT_WATER_OVERVIEWS}
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
                totalQuestions={QUESTIONS.length}
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
