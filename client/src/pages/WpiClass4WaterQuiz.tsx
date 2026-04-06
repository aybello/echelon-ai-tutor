// WpiClass4WaterQuiz — generated from QuizShell template
import { useState, useCallback, useMemo } from "react";
import { useSearch } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  wpiClass4WaterQuestions,
  WPI_CLASS4_WATER_MODULES,
  type WpiClass4WaterQuestion,
} from "@/lib/wpiClass4WaterQuestions";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import PurchaseGate from "@/components/PurchaseGate";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import { shuffle } from "@/lib/utils";

type QCompat = WpiClass4WaterQuestion & { q: string };
function toCompat(q: WpiClass4WaterQuestion): QCompat {
  return { ...q, q: (q as any).question ?? (q as any).text ?? (q as any).q ?? "" };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Process Control": { "bg": "#DBEAFE", "color": "#1D4ED8" },
  "Advanced Water Quality": { "bg": "#DCFCE7", "color": "#15803D" },
  "Emergency Response & Contingency Planning": { "bg": "#EDE9FE", "color": "#6D28D9" },
  "Plant Management & Leadership": { "bg": "#CCFBF1", "color": "#0F766E" },
  "Regulatory Compliance & Reporting": { "bg": "#FFEDD5", "color": "#C2410C" },
  "Source Water Protection": { "bg": "#FEF9C3", "color": "#A16207" },
};
const MODULE_ICONS: Record<string, string> = {
  "Advanced Process Control": "⚙️",
  "Advanced Water Quality": "🔬",
  "Emergency Response & Contingency Planning": "🚨",
  "Plant Management & Leadership": "👔",
  "Regulatory Compliance & Reporting": "📋",
  "Source Water Protection": "🌊",
};

const MODULES: ModuleConfig[] = WPI_CLASS4_WATER_MODULES.map(m => ({
  name: m,
  icon: MODULE_ICONS[m] ?? "📚",
  bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
  color: MODULE_COLORS[m]?.color ?? "#475569",
}));

const SESSION_SIZE = 15;
const HEADER_GRADIENT = "linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)";

export default function WpiClass4WaterQuiz() {
  usePageMeta({
    title: "WPI Class IV Water Treatment Practice Quiz — 502 Questions",
    description: "Practice for the WPI Class IV Water Treatment chief operator exam with 502 questions.",
    path: "/wpi-class4-water",
    keywords: "WPI Class IV water treatment, BC EOCP Level IV, Alberta AWWOA Class IV, chief operator exam",
  });

  const searchString = useSearch();
  const initialCalcOnly = new URLSearchParams(searchString).get("calcOnly") === "true";

  const [history, setHistory] = useState<Array<{
    questionId: number; module: string; correct: boolean;
    confidence: number; selectedOption: number; questionObj: QCompat;
  }>>([]);
  const [current, setCurrent] = useState<QCompat | null>(
    () => toCompat(shuffle([...wpiClass4WaterQuestions])[0])
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
      ? wpiClass4WaterQuestions.filter(q => q.module === selectedModule)
      : wpiClass4WaterQuestions;
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
    const newPool = wpiClass4WaterQuestions.filter(q => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setHistory([]);
  }

  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? wpiClass4WaterQuestions.filter(q => q.module === mod) : wpiClass4WaterQuestions)
      .filter(q => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
  }

  const correctCount = history.filter(h => h.correct).length;

  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="wpi-class4-water"
        productName="WPI Class IV Water Treatment Practice Pass"
        priceLabel="CA$499"
        paidFeatures={[
          "502 WPI Class IV Water questions — unlimited attempts",
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
      examType="wpi-class4-water"
      productKey="wpi-class4-water"
      productName="WPI Class IV Water Treatment Practice Pass"
      price={499}
    >
      <QuizShell
        currentPath="/wpi-class4-water"
        courseLabel="WPI Class IV · Water Treatment"
        courseTitle="WPI Class IV Water Practice Quiz"
        courseSubtitle="502 questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · Chief Operator"
        headerGradient={HEADER_GRADIENT}
        headerIcon="👑"
        headerActions={[{ label: "📝 Mock Exam →", href: "/wpi-class4-water-mock" }]}
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
          setHistory([]); setCurrent(toCompat(shuffle([...wpiClass4WaterQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
        }}
        mockExamHref="/wpi-class4-water-mock"
        renderAITutor={() => (
          <AITutor
            question={null}
            userAnswer={selected}
            history={[]}
            patternMode={false}
            onClose={() => setTutorOpen(false)}
          />
        )}
      />
    </PurchaseGate>
  );
}
