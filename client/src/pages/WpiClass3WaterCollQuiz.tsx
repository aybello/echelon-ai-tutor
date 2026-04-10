// WPI Class III Wastewater Collection — Practice Quiz
import { useState, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import { wpiClass3WastewaterCollQuestions, WPI_CLASS3_WASTEWATER_COLL_MODULES } from "@/lib/wpiClass3WastewaterCollQuestions";
import { WPI_CLASS3_WASTEWATER_COLL_OVERVIEWS } from "@/lib/moduleOverviews";
const HEADER_GRADIENT = "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)";
const SESSION_SIZE = 15;
type Q = typeof wpiClass3WastewaterCollQuestions[0];
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
  { name: "Complex System Operations & SCADA", icon: "🖥️" },
  { name: "Advanced Pump Station Engineering", icon: "⚙️" },
  { name: "System Hydraulic Modelling", icon: "📊" },
  { name: "Advanced Maintenance Management", icon: "🔧" },
  { name: "Leadership, Safety & Regulatory Management", icon: "🛡️" },
];
const MODULES = MODULE_CONFIG.map(m => ({ name: m.name, icon: m.icon }));
export default function WpiClass3WaterCollQuiz() {
  const [trialUnlocked] = useState(() => isTrialUnlocked());
  const [history, setHistory] = useState<any[]>([]);
  const [current, setCurrent] = useState<CompatQ | null>(toCompat(shuffle([...wpiClass3WastewaterCollQuestions])[0]));
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly] = useState(false);
  const [trialDone, setTrialDone] = useState(false);
  function getPool() {
    return wpiClass3WastewaterCollQuestions
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
    const newPool = wpiClass3WastewaterCollQuestions.filter(q => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false); setHistory([]);
  }
  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? wpiClass3WastewaterCollQuestions.filter(q => q.module === mod) : wpiClass3WastewaterCollQuestions)
      .filter(q => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
  }
  const correctCount = history.filter(h => h.correct).length;
  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="wpi-class3-water-coll"
        productName="WPI Class III Wastewater Collection Practice Pass"
        priceLabel="CA$249"
        paidFeatures={[
          "504 WPI Class III Collection questions — unlimited attempts",
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
        currentPath="/wpi-class3-water-coll"
        courseLabel="WPI Class III · Wastewater Collection"
        courseTitle="WPI Class III Wastewater Collection Quiz"
        courseSubtitle="504 questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB"
        headerGradient={HEADER_GRADIENT}
        headerIcon="🚧"
        headerActions={[
          { label: "📝 Mock Exam →", href: "/wpi-class3-water-coll-mock" },
          { label: "🃏 Flashcards", href: "/wpi-class3-water-coll-flashcards" },
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
          setHistory([]); setCurrent(toCompat(shuffle([...wpiClass3WastewaterCollQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
        }}
        mockExamHref="/wpi-class3-water-coll-mock"
        moduleOverviews={WPI_CLASS3_WASTEWATER_COLL_OVERVIEWS}
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
