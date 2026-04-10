import { useState, useMemo, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import { QUESTIONS as CLASS4_WATER_QUESTIONS, CLASS4_WATER_MODULES } from '@/lib/class4WaterQuestions';
import { CLASS4_WATER_OVERVIEWS } from '@/lib/moduleOverviews';

// ─── Types ───────────────────────────────────────────────────────────────────

type HistoryEntry = {
  q: any;
  selected: number;
  confidence: number | null;
  correct: boolean;
  questionObj?: any;
};

// ─── Module Config (icons + colours) ────────────────────────────────────────
const MODULE_CONFIG = [
  { name: "Treatment Process",               icon: "🏭", bg: "#DBEAFE", color: "#1D4ED8" },
  { name: "Equipment O&M",                   icon: "⚙️", bg: "#FFEDD5", color: "#C2410C" },
  { name: "Hydraulics",                      icon: "💧", bg: "#DCFCE7", color: "#15803D" },
  { name: "Regulations & Management",        icon: "📜", bg: "#EDE9FE", color: "#6D28D9" },
  { name: "Water Quality",                   icon: "🔬", bg: "#FEF9C3", color: "#A16207" },
  { name: "Math & Calculations",             icon: "🧮", bg: "#FEE2E2", color: "#B91C1C" },
  { name: "Source Water Protection",         icon: "🌿", bg: "#CCFBF1", color: "#0F766E" },
  { name: "Plant Management",                icon: "🏢", bg: "#F3E8FF", color: "#7C3AED" },
  { name: "Emergency Response",              icon: "🚨", bg: "#FEE2E2", color: "#DC2626" },
  { name: "Advanced Treatment",              icon: "⚡", bg: "#E0F2FE", color: "#0284C7" },
  { name: "Lab Analysis",                    icon: "🧪", bg: "#FEF9C3", color: "#CA8A04" },
  { name: "Safety",                          icon: "🛡️", bg: "#FEE2E2", color: "#B91C1C" },
  { name: "Water Distribution",              icon: "🚰", bg: "#E0F2FE", color: "#0284C7" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Class4WaterQuiz() {
  const allQuestions = CLASS4_WATER_QUESTIONS as any[];
  const modules = MODULE_CONFIG;

  const SESSION_SIZE = 15;
  const [trialDone, setTrialDone]   = useState(false);
  const [trialUnlocked]             = useState(() => isTrialUnlocked());

  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds]       = useState<Set<number | string>>(new Set());
  const [current, setCurrent]       = useState<any | null>(() => {
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
  const getNext = useCallback((currentPool: any[]): any | null => {
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
        productKey="class4-water"
        productName="Class 4 Water Treatment Practice Pass"
        priceLabel="CA$299"
        paidFeatures={[
          "500+ Class 4 Water questions — unlimited attempts",
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
        currentPath="/class4-water"
        courseLabel="Ontario Class 4 · Water Treatment"
        courseTitle="Class 4 Water Practice Quiz"
        courseSubtitle="Ontario OWWCO Class 4 Water Exam Prep"
        headerGradient="linear-gradient(135deg, #7C3AED 0%, #DC2626 100%)"
        headerIcon="💧"
        headerActions={[
          { label: "📝 Mock Exam", href: "/class4-water-mock" },
          { label: "🃏 Flashcards", href: "/class4-water-flashcards" },
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
        mockExamHref="/class4-water-mock"
        moduleOverviews={CLASS4_WATER_OVERVIEWS}
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
