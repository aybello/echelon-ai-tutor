import { useState, useMemo, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import PurchaseGate from "@/components/PurchaseGate";
import { CLASS1_QUESTIONS, CLASS1_MODULES, getClass1Questions } from '@/lib/class1Questions';

// ─── Types ───────────────────────────────────────────────────────────────────

type HistoryEntry = {
  q: any;
  selected: number;
  confidence: number | null;
  correct: boolean;
  questionObj?: any;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Class1Quiz() {
  const allQuestions = CLASS1_QUESTIONS as any[];
  const modules = CLASS1_MODULES;

  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds]       = useState<Set<number | string>>(new Set());
  const [current, setCurrent]       = useState<any | null>(() => {
    const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
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
    const next = getNext(pool);
    setCurrent(next);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [pool, getNext]);

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
    }
  }, [allQuestions, usedIds, calcOnly]);

  return (
    <PurchaseGate
      examType="class1-water"
      productKey="class1-water"
      productName="Ontario OIT · Water Treatment"
      price={49}
    >
      <QuizShell
        currentPath="/quiz"
        courseLabel="Ontario OIT · Water Treatment"
        courseTitle="OIT Water Practice Quiz"
        courseSubtitle="Ontario OIT Water Exam Prep"
        headerGradient="linear-gradient(135deg, #0369A1 0%, #0E7490 100%)"
        headerIcon="💧"
        headerActions={[
          { label: "📝 Mock Exam", href: "/mock-exam" },
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
        mockExamHref="/mock-exam"
        
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
    </PurchaseGate>
  );
}
