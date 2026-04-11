// WPI Class I Water Distribution — Practice Quiz
import { useState, useCallback } from "react";
import QuizShell from "@/components/QuizShell";
import AITutor from "@/components/AITutor";

import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import { wpiClass1WaterDistQuestions, WPI_CLASS1_WATER_DIST_MODULES } from "@/lib/wpiClass1WaterDistQuestions";
import { WPI_CLASS1_WATER_DIST_OVERVIEWS } from "@/lib/moduleOverviews";
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";

const HEADER_GRADIENT = "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)";
const SESSION_SIZE = 15;

type Q = typeof wpiClass1WaterDistQuestions[0];
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
  { name: "Distribution System Components", icon: "🔧" },
  { name: "Equipment Installation, O&M & Repair", icon: "⚙️" },
  { name: "Water Quality Monitoring & Lab", icon: "🧪" },
  { name: "Security, Safety, Admin & Public Interactions", icon: "🛡️" },
];
const MODULES = MODULE_CONFIG.map(m => ({ name: m.name, icon: m.icon }));

export default function WpiClass1WaterDistQuiz() {
  // ── Quiz Mode & Settings ───────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [missedIds, setMissedIds] = useState<number[]>([]);
  const logAttemptFn = useAttemptLogger("wpi-class1-water-dist", quizMode);
  const missedCount = missedIds.length;

  const handleModeChange = (mode: QuizMode) => {
    setQuizMode(mode);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    if (mode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      const mPool = wpiClass1WaterDistQuestions.filter((q: any) => missedSet.has(q.id));
      setCurrent(mPool.length > 0 ? toCompat(shuffle([...mPool])[0]) : null);
    } else {
      setCurrent(toCompat(shuffle([...wpiClass1WaterDistQuestions])[0]));
    }
  };

  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    setCurrent(toCompat(shuffle([...wpiClass1WaterDistQuestions])[0]));
  };

  const [trialUnlocked] = useState(() => isTrialUnlocked());
  const [history, setHistory] = useState<any[]>([]);
  const [current, setCurrent] = useState<CompatQ | null>(toCompat(shuffle([...wpiClass1WaterDistQuestions])[0]));
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly] = useState(false);
  const [trialDone, setTrialDone] = useState(false);

  function getPool() {
    return wpiClass1WaterDistQuestions
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
    const newPool = wpiClass1WaterDistQuestions.filter(q => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false); setHistory([]);
  }

  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? wpiClass1WaterDistQuestions.filter(q => q.module === mod) : wpiClass1WaterDistQuestions)
      .filter(q => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
  }

  const correctCount = history.filter(h => h.correct).length;

  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="wpi-class1-water-dist"
        productName="WPI Class I Water Distribution Practice Pass"
        priceLabel="CA$99"
        paidFeatures={[
          "500 WPI Class I Distribution questions — unlimited attempts",
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
        currentPath="/wpi-class1-water-dist"
        courseLabel="WPI Class I · Water Distribution"
        courseTitle="WPI Class I Water Distribution Quiz"
        courseSubtitle="500 questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB"
        headerGradient={HEADER_GRADIENT}
        headerIcon="🚰"
        headerActions={[
          { label: "📝 Mock Exam →", href: "/wpi-class1-water-dist-mock" },
          { label: "🃏 Flashcards", href: "/wpi-class1-water-dist-flashcards" },
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
          setHistory([]); setCurrent(toCompat(shuffle([...wpiClass1WaterDistQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
        }}
        mockExamHref="/wpi-class1-water-dist-mock"
        moduleOverviews={WPI_CLASS1_WATER_DIST_OVERVIEWS}
        headerExtra={
          <>
            <QuizModeBar
              examType="wpi-class1-water-dist"
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
                totalQuestions={wpiClass1WaterDistQuestions.length}
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
