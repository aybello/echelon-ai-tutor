// WpiClass3WastewaterQuiz — generated from QuizShell template
import { useState, useCallback, useMemo } from "react";
import { useSearch } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  wpiClass3WastewaterQuestions,
  WPI_CLASS3_WASTEWATER_MODULES,
  type WpiClass3WastewaterQuestion,
} from "@/lib/wpiClass3WastewaterQuestions";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import PurchaseGate from "@/components/PurchaseGate";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import { shuffle } from "@/lib/utils";
import { WPI_CLASS3_WASTEWATER_OVERVIEWS } from "@/lib/moduleOverviews";

type QCompat = WpiClass3WastewaterQuestion & { q: string };
function toCompat(q: WpiClass3WastewaterQuestion): QCompat {
  return { ...q, q: (q as any).question ?? (q as any).text ?? (q as any).q ?? "" };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Biological Treatment": { "bg": "#DCFCE7", "color": "#15803D" },
  "Biological Nutrient Removal": { "bg": "#CCFBF1", "color": "#0F766E" },
  "Membrane Bioreactors & Advanced Processes": { "bg": "#EDE9FE", "color": "#6D28D9" },
  "Biosolids Management & Resource Recovery": { "bg": "#FFEDD5", "color": "#C2410C" },
  "Advanced Monitoring, Control & Management": { "bg": "#DBEAFE", "color": "#1D4ED8" },
};
const MODULE_ICONS: Record<string, string> = {
  "Advanced Biological Treatment": "🦠",
  "Biological Nutrient Removal": "🌿",
  "Membrane Bioreactors & Advanced Processes": "🔬",
  "Biosolids Management & Resource Recovery": "♻️",
  "Advanced Monitoring, Control & Management": "📊",
};

const MODULES: ModuleConfig[] = WPI_CLASS3_WASTEWATER_MODULES.map(m => ({
  name: m,
  icon: MODULE_ICONS[m] ?? "📚",
  bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
  color: MODULE_COLORS[m]?.color ?? "#475569",
}));

const SESSION_SIZE = 15;
const HEADER_GRADIENT = "linear-gradient(135deg, #065F46 0%, #0F766E 100%)";

export default function WpiClass3WastewaterQuiz() {
  usePageMeta({
    title: "WPI Class III Wastewater Treatment Practice Quiz — 501 Questions",
    description: "Practice for the WPI Class III Wastewater Treatment operator exam with 501 questions.",
    path: "/wpi-class3-wastewater",
    keywords: "WPI Class III wastewater, BC EOCP Level III, Alberta AWWOA Class III, operator exam prep",
  });

  const searchString = useSearch();
  const initialCalcOnly = new URLSearchParams(searchString).get("calcOnly") === "true";

  const [history, setHistory] = useState<Array<{
    questionId: number; module: string; correct: boolean;
    confidence: number; selectedOption: number; questionObj: QCompat;
  }>>([]);
  const [current, setCurrent] = useState<QCompat | null>(
    () => toCompat(shuffle([...wpiClass3WastewaterQuestions])[0])
  );
  const [selected, setSelected]     = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [showSteps, setShowSteps]   = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly]     = useState(initialCalcOnly);
  const [trialDone, setTrialDone]   = useState(false);
  const [trialUnlocked]             = useState(() => isTrialUnlocked());

  const usedIds = useMemo(() => new Set(history.map(h => h.questionId)), [history]);

  const pool = useMemo(() => {
    const base = selectedModule
      ? wpiClass3WastewaterQuestions.filter(q => q.module === selectedModule)
      : wpiClass3WastewaterQuestions;
    return base.filter(q => !usedIds.has(q.id) && (!calcOnly || q.isCalc));
  }, [selectedModule, usedIds, calcOnly]);

  const getNext = useCallback(() => {
    if (pool.length === 0) return null;
    return toCompat(shuffle([...pool])[0]);
  }, [pool]);

  function handleNext() {
    if (!current || selected === null) return;
    const isCorrect = selected === (current.correctAnswer ?? (current as any).correct);
    const newHistory = [...history, {
      questionId: current.id, module: current.module,
      correct: isCorrect, confidence: confidence ?? 3,
      selectedOption: selected, questionObj: current,
    }];
    setHistory(newHistory);
    if (!trialUnlocked && newHistory.length >= SESSION_SIZE) {
      setTrialDone(true);
      return;
    }
    const next = getNext();
    setCurrent(next);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
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
    const newPool = wpiClass3WastewaterQuestions.filter(q => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setHistory([]);
  }

  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? wpiClass3WastewaterQuestions.filter(q => q.module === mod) : wpiClass3WastewaterQuestions)
      .filter(q => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
  }

  const correctCount = history.filter(h => h.correct).length;

  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="wpi-class3-wastewater"
        productName="WPI Class III Wastewater Practice Pass"
        priceLabel="CA$349"
        paidFeatures={[
          "501 WPI Class III Wastewater questions — unlimited attempts",
          "Timed mock exam (100 questions, 2 hrs)",
          "AI Tutor explanations on every question",
          "Module-by-module performance tracking",
        ]}
        onUnlocked={() => {
          setTrialUnlocked(); setTrialDone(false);
          setCurrent(getNext());
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
        }}
      />
    );
  }

  return (
    <PurchaseGate
      backPath="/wpi"
      examType="wpi-class3-wastewater"
      productKey="wpi-class3-wastewater"
      productName="WPI Class III Wastewater Practice Pass"
      price={349}
    >
      <QuizShell
        currentPath="/wpi-class3-wastewater"
        courseLabel="WPI Class III · Wastewater Treatment"
        courseTitle="WPI Class III Wastewater Practice Quiz"
        courseSubtitle="501 questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB"
        headerGradient={HEADER_GRADIENT}
        headerIcon="🦠"
        headerActions={[{ label: "📝 Mock Exam →", href: "/wpi-class3-wastewater-mock" }, { label: "🃏 Flashcards", href: "/wpi-class3-wastewater-flashcards" }]}
        history={history}
        correctCount={correctCount}
        wrongCount={history.length - correctCount}
        sessionSize={SESSION_SIZE}
        modules={MODULES}
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
        onSelect={idx => { if (!confirmed) { setSelected(idx); setConfidence(null); } }}
        onConfirm={() => { if (selected !== null && confidence !== null) setConfirmed(true); }}
        onNext={handleNext}
        onGoBack={goBack}
        onConfidenceChange={setConfidence}
        onToggleSteps={() => setShowSteps(s => !s)}
        onTutorOpen={() => setTutorOpen(true)}
        onTutorClose={() => setTutorOpen(false)}
        onResetSession={() => {
          setHistory([]); setCurrent(toCompat(shuffle([...wpiClass3WastewaterQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
        }}
        moduleOverviews={WPI_CLASS3_WASTEWATER_OVERVIEWS}
        mockExamHref="/wpi-class3-wastewater-mock"
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
