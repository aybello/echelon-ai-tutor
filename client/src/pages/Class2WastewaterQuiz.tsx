import { useState, useMemo, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import { CLASS2_WW_QUESTIONS, CLASS2_WW_MODULES, type WastewaterQuestion } from '@/lib/class2WastewaterQuestions';
import { CLASS2_WASTEWATER_OVERVIEWS } from '@/lib/moduleOverviews';
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";

// ─── Types ───────────────────────────────────────────────────────────────────

type HistoryEntry = {
  q: WastewaterQuestion;
  selected: number;
  confidence: number | null;
  correct: boolean;
  questionObj?: WastewaterQuestion;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Class2WastewaterQuiz() {
  // ── Quiz Mode & Settings ───────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [missedIds, setMissedIds] = useState<number[]>([]);
  const logAttemptFn = useAttemptLogger("class2-ww", quizMode);
  const missedCount = missedIds.length;

  const handleModeChange = (mode: QuizMode) => {
    setQuizMode(mode);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    if (mode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      const mPool = allQuestions.filter((q: any) => missedSet.has(q.id));
      setCurrent(mPool.length > 0 ? mPool[Math.floor(Math.random() * mPool.length)] : null);
    } else {
      const pool = [...allQuestions];
      setCurrent(pool[Math.floor(Math.random() * pool.length)]);
    }
  };

  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    const pool = [...allQuestions];
    setCurrent(pool[Math.floor(Math.random() * pool.length)]);
  };

  const allQuestions = CLASS2_WW_QUESTIONS as WastewaterQuestion[];
  const modules = CLASS2_WW_MODULES;

  const SESSION_SIZE = 15;
  const [trialDone, setTrialDone]   = useState(false);
  const [trialUnlocked]             = useState(() => isTrialUnlocked());

  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds]       = useState<Set<number | string>>(new Set());
  const [current, setCurrent]       = useState<WastewaterQuestion | null>(() => {
    // Trial phase: start with medium/hard questions
    const trialPool = allQuestions.filter(q => (q as any).difficulty === "medium" || (q as any).difficulty === "hard");
    const startPool = trialPool.length >= 15 ? trialPool : allQuestions;
    const q = startPool[Math.floor(Math.random() * startPool.length)];
    return q ?? null;
  });
  const [selected, setSelected]     = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [showSteps, setShowSteps]   = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly]     = useState(false);

  const correctCount = history.filter(h => h.correct).length;
  const wrongCount   = history.filter(h => !h.correct).length;

  // ── Filtered pool ─────────────────────────────────────────────────────────
  const pool = useMemo(() => {
    let qs = allQuestions.filter(q => !usedIds.has((q as any).id));
    if (selectedModule) qs = qs.filter(q => (q as any).module === selectedModule);
    if (calcOnly) qs = qs.filter(q => (q as any).isCalc === true);
    return qs;
  }, [usedIds, selectedModule, calcOnly]);

  // ── Get next question ─────────────────────────────────────────────────────
  const getNext = useCallback((currentPool: WastewaterQuestion[]): WastewaterQuestion | null => {
    if (currentPool.length === 0) return null;
    return currentPool[Math.floor(Math.random() * currentPool.length)];
  }, []);

  // ── Confirm answer ────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (selected === null || !current) return;
    const correctIdx = (current as any).correctAnswer ?? (current as any).correct ?? (current as any).correctIndex ?? 0;
    const isCorrect = selected === correctIdx;
    setHistory(h => [...h, { q: current, selected, confidence, correct: isCorrect, questionObj: current }]);
    setUsedIds(s => new Set([...Array.from(s), (current as any).id]));
    setConfirmed(true);
    setShowSteps(false);
  }, [selected, current, confidence]);

  // ── Next question ─────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!trialUnlocked && history.length >= SESSION_SIZE) {
      setTrialDone(true);
      return;
    }
    // For trial phase, prefer medium/hard questions
    let nextPool = pool;
    if (!trialUnlocked && history.length < SESSION_SIZE) {
      const hardPool = pool.filter(q => (q as any).difficulty === "medium" || (q as any).difficulty === "hard");
      if (hardPool.length > 0) nextPool = hardPool;
    }
    const next = getNext(nextPool);
    setCurrent(next);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [pool, getNext, history, trialUnlocked]);

  // ── Go back ───────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = history.slice(0, -1);
    const prev = history[history.length - 1];
    setHistory(newHistory);
    setUsedIds(s => {
      const next = new Set(Array.from(s));
      next.delete((prev.q as any).id);
      return next;
    });
    setCurrent(prev.questionObj ?? prev.q);
    setSelected(prev.selected);
    setConfidence(prev.confidence);
    setConfirmed(true);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history]);

  // ── Reset session ─────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setHistory([]);
    setUsedIds(new Set());
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    setCurrent(q ?? null);
  }, [allQuestions]);

  // ── Calc Only toggle ──────────────────────────────────────────────────────
  const handleCalcOnlyToggle = useCallback(() => {
    const next = !calcOnly;
    setCalcOnly(next);
    // Immediately load a calc question when toggling on
    if (next) {
      let calcPool = allQuestions.filter(q => (q as any).isCalc === true && !usedIds.has((q as any).id));
      if (selectedModule) calcPool = calcPool.filter(q => (q as any).module === selectedModule);
      if (calcPool.length > 0) {
        const q = calcPool[Math.floor(Math.random() * calcPool.length)];
        setCurrent(q);
        setSelected(null);
        setConfidence(null);
        setConfirmed(false);
        setShowSteps(false);
        setTutorOpen(false);
      }
    }
  }, [calcOnly, allQuestions, usedIds, selectedModule]);

  // ── Module change ─────────────────────────────────────────────────────────
  const handleModuleChange = useCallback((mod: string | null) => {
    setSelectedModule(mod);
    // Immediately load a question from the new module
    let newPool = allQuestions.filter(q => !usedIds.has((q as any).id));
    if (mod) newPool = newPool.filter(q => (q as any).module === mod);
    if (calcOnly) newPool = newPool.filter(q => (q as any).isCalc === true);
    if (newPool.length > 0) {
      const q = newPool[Math.floor(Math.random() * newPool.length)];
      setCurrent(q);
      setSelected(null);
      setConfidence(null);
      setConfirmed(false);
      setShowSteps(false);
      setTutorOpen(false);
    }
  }, [allQuestions, usedIds, calcOnly]);

  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="class2-ww"
        productName="Class 2 Wastewater Treatment Practice Pass"
        priceLabel="CA$149"
        paidFeatures={[
          "500 Class 2 Wastewater questions — unlimited attempts",
          "Timed mock exam (100 questions, 2 hrs)",
          "AI Tutor explanations on every question",
          "Module-by-module performance tracking",
        ]}
        onUnlocked={() => {
          setTrialUnlocked();
          setTrialDone(false);
          setSelected(null);
          setConfidence(null);
          setConfirmed(false);
          setShowSteps(false);
          setTutorOpen(false);
        }}
      />
    );
  }

  return (
      <QuizShell
        currentPath="/class2-ww"
        moduleOverviews={CLASS2_WASTEWATER_OVERVIEWS}
        courseLabel="Ontario Class 2 · Wastewater Treatment"
        courseTitle="Class 2 Wastewater Practice Quiz"
        courseSubtitle="Ontario OWWCO Class 2 Wastewater Exam Prep"
        headerGradient="linear-gradient(135deg, #0F766E 0%, #0369A1 100%)"
        headerIcon="🌊"
        headerActions={[
          { label: "📝 Mock Exam", href: "/class2-ww-mock" },
          { label: "🃏 Flashcards", href: "/class2-ww-flashcards" },
        ]}
        history={history}
        correctCount={correctCount}
        wrongCount={wrongCount}
        modules={modules.map((m: any) => ({
          name: typeof m === "string" ? m : m.name,
          icon: typeof m === "object" ? m.icon : undefined,
          bg:   typeof m === "object" ? m.bg   : undefined,
          color: typeof m === "object" ? m.color : undefined,
        }))}
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
        mockExamHref="/class2-ww-mock"
        
        headerExtra={
          <>
            <QuizModeBar
              examType="class2-ww"
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
  );
}
