// OIT WASTEWATER QUIZ
// Free 15-question trial → QuizGate upsell → paid full access
// Uses QuizShell for unified UI
import { useState, useCallback, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  CLASS1_WASTEWATER_QUESTIONS,
  CLASS1_WASTEWATER_MODULES,
  type Class1WastewaterQuestion,
} from "@/lib/class1WastewaterQuestions";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import QuizShell from "@/components/QuizShell";

const SESSION_SIZE = 15;

type HistoryEntry = {
  q: Class1WastewaterQuestion;
  selected: number;
  confidence: number | null;
  correct: boolean;
  questionObj?: Class1WastewaterQuestion;
};

// Module config with colors/icons for QuizShell
const MODULE_CONFIG = [
  { name: "Wastewater Characteristics & Preliminary Treatment", icon: "🔬", bg: "#ECFDF5", color: "#065F46" },
  { name: "Primary Treatment",                                  icon: "🏊", bg: "#DBEAFE", color: "#1D4ED8" },
  { name: "Secondary Treatment",                                icon: "🦠", bg: "#DCFCE7", color: "#15803D" },
  { name: "Biological Nutrient Removal",                        icon: "🧫", bg: "#CCFBF1", color: "#0F766E" },
  { name: "Tertiary Treatment & Filtration",                    icon: "💧", bg: "#EDE9FE", color: "#6D28D9" },
  { name: "Disinfection",                                       icon: "🧪", bg: "#FEF9C3", color: "#A16207" },
  { name: "Solids Handling & Biosolids",                        icon: "♻️", bg: "#FFEDD5", color: "#C2410C" },
  { name: "Regulations, Safety & Operations",                   icon: "📋", bg: "#FEE2E2", color: "#B91C1C" },
];

// OIT-WW trial unlock key is separate from OIT Water
const OIT_WW_TRIAL_KEY = "echelon_trial_unlocked_oit_ww";
function isOitWwTrialUnlocked(): boolean {
  try {
    return localStorage.getItem(OIT_WW_TRIAL_KEY) === "true";
  } catch { return false; }
}
function setOitWwTrialUnlocked(): void {
  try { localStorage.setItem(OIT_WW_TRIAL_KEY, "true"); } catch { /* noop */ }
}

export default function OITWastewaterQuiz() {
  usePageMeta({
    title: "OIT Wastewater Practice Quiz — 500+ Questions",
    description: "Practice for the Ontario OIT Wastewater exam with 500+ questions. AI Tutor, step-by-step solutions, and confidence tracking.",
    keywords: "OIT wastewater exam prep, Ontario wastewater operator, wastewater certification practice",
  });

  const allQuestions = CLASS1_WASTEWATER_QUESTIONS as Class1WastewaterQuestion[];

  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds]         = useState<Set<number | string>>(new Set());
  const [current, setCurrent]         = useState<Class1WastewaterQuestion | null>(() => {
    const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    return q ?? null;
  });
  const [selected, setSelected]       = useState<number | null>(null);
  const [confidence, setConfidence]   = useState<number | null>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [showSteps, setShowSteps]     = useState(false);
  const [tutorOpen, setTutorOpen]     = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly]       = useState(false);
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isOitWwTrialUnlocked());
  const [showGate, setShowGate]       = useState(false);

  const correctCount = history.filter(h => h.correct).length;
  const wrongCount   = history.filter(h => !h.correct).length;

  // ── Filtered pool ──────────────────────────────────────────────────────────
  const pool = useMemo(() => {
    let qs = allQuestions.filter(q => !usedIds.has((q as any).id));
    if (selectedModule) qs = qs.filter(q => (q as any).module === selectedModule);
    if (calcOnly) qs = qs.filter(q => (q as any).isCalc === true);
    return qs;
  }, [usedIds, selectedModule, calcOnly, allQuestions]);

  // ── Confirm answer ─────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const correctIdx = (current as any).correct ?? 0;
    const isCorrect = selected === correctIdx;
    setHistory(h => [...h, { q: current, selected, confidence, correct: isCorrect, questionObj: current }]);
    setUsedIds(s => new Set([...Array.from(s), (current as any).id]));
    setConfirmed(true);
    const newLen = history.length + 1;
    if (newLen >= SESSION_SIZE && !trialUnlocked) {
      setShowGate(true);
    }
  }, [selected, current, confidence, history, trialUnlocked]);

  // ── Next question ──────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (history.length >= SESSION_SIZE && !trialUnlocked) {
      setShowGate(true);
      return;
    }
    const next = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : allQuestions[Math.floor(Math.random() * allQuestions.length)];
    setCurrent(next ?? null);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [pool, allQuestions, history, trialUnlocked]);

  // ── Go back ────────────────────────────────────────────────────────────────
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

  // ── Calc Only toggle ───────────────────────────────────────────────────────
  const handleCalcOnlyToggle = useCallback(() => {
    const next = !calcOnly;
    setCalcOnly(next);
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

  // ── Module change ──────────────────────────────────────────────────────────
  const handleModuleChange = useCallback((mod: string | null) => {
    setSelectedModule(mod);
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
    <>
      <QuizShell
        currentPath="/oit-ww"
        courseLabel="Ontario OIT · Wastewater Treatment"
        courseTitle="OIT Wastewater Practice Quiz"
        courseSubtitle="Free · Ontario OIT Wastewater Exam Prep"
        headerGradient="linear-gradient(135deg, #0F766E 0%, #0369A1 100%)"
        headerIcon="🌊"
        headerActions={[
          { label: "📝 Mock Exam", href: "/oit-ww-mock" },
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
        mockExamHref="/oit-ww-mock"
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
          productKey="oit-ww"
          productName="OIT Wastewater Practice Pass"
          priceLabel="CA$49"
          paidFeatures={[
            "Full 500+ question bank — unlimited attempts",
            "OIT Wastewater Mock Exam (100 questions, 2-hour timer)",
            "AI Tutor explanations on every question",
            "Score history & module breakdown",
          ]}
          onUnlocked={() => {
            setOitWwTrialUnlocked();
            setTrialUnlockedState(true);
            setShowGate(false);
          }}
          onDismiss={() => setShowGate(false)}
        />
      )}
    </>
  );
}
