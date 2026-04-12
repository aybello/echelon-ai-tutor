// WpiClass4WaterQuiz — generated from QuizShell template
import { useState, useCallback, useMemo } from "react";
import { useSearch } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import QuizShell, { type ModuleConfig } from "@/components/QuizShell";
import { shuffle } from "@/lib/utils";
import QuizModeBar, { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import QuizSettingsDrawer, { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";
import { trpc } from "@/lib/trpc";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";


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


const SESSION_SIZE = 15;
const HEADER_GRADIENT = "linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)";

export default function WpiClass4WaterQuiz() {
  // ── Load questions from database ──────────────────────────────────────────
  const { questions: dbQuestions, modules: dbModules, overviews: dbOverviews, isLoading: bankLoading } = useQuestionBank("wpi-class4-water");
  const allQuestions = dbQuestions as any[];
  const MODULES: ModuleConfig[] = dbModules.map((m: any) => ({
  name: m,
  icon: MODULE_ICONS[m] ?? "📚",
  bg: MODULE_COLORS[m]?.bg ?? "#F1F5F9",
  color: MODULE_COLORS[m]?.color ?? "#475569",
  }));

  // ── Quiz Mode & Settings ───────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const logAttemptFn = useAttemptLogger("wpi-class4-water", quizMode);
  // Fetch missed question IDs from backend for persistence across sessions
  const { data: missedData, refetch: refetchMissed } = trpc.quiz.getMissedQuestions.useQuery(
    { examType: "wpi-class4-water", limit: 50 },
    { refetchOnWindowFocus: false }
  );
  const missedIds = missedData?.questionIds ?? [];
  const missedCount = missedData?.total ?? 0;

  const handleModeChange = (mode: QuizMode) => {
    setQuizMode(mode);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    if (mode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      const mPool = allQuestions.filter((q: any) => missedSet.has(q.id));
      setCurrent(mPool.length > 0 ? (shuffle([...mPool])[0]) : null);
    } else {
      setCurrent((shuffle([...allQuestions])[0]));
    }
  };

  const handleSettingsApply = (settings: QuizSettings) => {
    setQuizSettings(settings);
    setHistory([]);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
    setCurrent((shuffle([...allQuestions])[0]));
  };
  // Auto-confirm + advance when timed mode expires
  const handleTimeUp = () => {
    if (confirmed) return; // already answered
    if (!current) return;
    // Determine the correct answer index
    const correctIdx = (current as any).correctIndex ?? 0;
    // Use the user's selection if they picked one, otherwise force a wrong answer
    const effectiveSelected = selected ?? (correctIdx === 0 ? 1 : 0);
    const isCorrect = effectiveSelected === correctIdx;
    // Set confidence to neutral (50) for timed-out questions
    const effectiveConfidence = confidence ?? 50;
    // Push history entry so the question isn't lost
    setHistory(h => [...h, { q: current, selected: effectiveSelected, confidence: effectiveConfidence, correct: isCorrect, questionObj: current } as any]);
    // Log the attempt to the backend for missed-questions tracking
    logAttemptFn({ topic: (current as any).module ?? (current as any).topic ?? "General", questionId: (current as any).id, correct: isCorrect, difficulty: (current as any).difficulty });
    setSelected(effectiveSelected);
    setConfidence(effectiveConfidence);
    setConfirmed(true);
    setTimeout(() => handleNext(), 800);
  };

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
    confidence: number; selectedOption: number; questionObj: DBQuestion;
  }>>([]);
  const [current, setCurrent] = useState<DBQuestion | null>(null);
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
      ? allQuestions.filter((q: any) => q.module === selectedModule)
      : allQuestions;
    return base.filter((q: any) => !usedIds.has(q.id) && (!calcOnly || q.isCalc));
  }, [selectedModule, usedIds, calcOnly]);

  const getNext = useCallback(() => {
    if (pool.length === 0) return null;
    return (shuffle([...pool])[0]);
  }, [pool]);

  function handleNext() {
    if (!current || selected === null) return;
    const isCorrect = selected === ((current as any).correctIndex ?? (current as any).correct);
    const newHistory = [...history, {
      questionId: current.id, module: current.module,
      correct: isCorrect, confidence: confidence ?? 3,
      selectedOption: selected, questionObj: current,
    }];
    setHistory(newHistory);
    // Log attempt for backend persistence (missed questions, topic tracking)
    logAttemptFn({ topic: current.module, questionId: current.id, correct: isCorrect, difficulty: (current as any).difficulty });
    if (!isCorrect) setTimeout(() => refetchMissed(), 500);
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
    const newPool = allQuestions.filter((q: any) => !next || q.isCalc);
    setCurrent(newPool.length > 0 ? (shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false); setHistory([]);
  }

  function handleModuleChange(mod: string | null) {
    setSelectedModule(mod);
    const newPool = (mod ? allQuestions.filter((q: any) => q.module === mod) : allQuestions)
      .filter((q: any) => !calcOnly || q.isCalc);
    setCurrent(newPool.length > 0 ? (shuffle([...newPool])[0]) : null);
    setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
  }

  const correctCount = history.filter(h => h.correct).length;



  return (
      <QuizShell
        currentPath="/wpi-class4-water"
        courseLabel="WPI Class IV · Water Treatment"
        courseTitle="WPI Class IV Water Practice Quiz"
        courseSubtitle="500 questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · Chief Operator"
        headerGradient={HEADER_GRADIENT}
        headerIcon="👑"
        headerActions={[{ label: "📝 Mock Exam →", href: "/wpi-class4-water-mock" }, { label: "🃏 Flashcards", href: "/wpi-class4-water-flashcards" }]}
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
          setHistory([]); setCurrent((shuffle([...allQuestions])[0]));
          setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false);
        }}
        moduleOverviews={dbOverviews ?? undefined}
        timedSeconds={quizSettings.timedMode ? quizSettings.timedSeconds : 0}
        onTimeUp={handleTimeUp}
        mockExamHref="/wpi-class4-water-mock"
        headerExtra={
          <>
            <QuizModeBar
              examType="wpi-class4-water"
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
        gate={trialDone && !trialUnlocked ? (
          <QuizGate
            questionsAnswered={history.length}
            productKey="wpi-class4-water"
            productName="WPI Class IV Water Treatment Practice Pass"
            priceLabel="CA$299"
            paidFeatures={[
              "502 WPI Class IV Water questions — unlimited attempts",
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
        ) : undefined}
      />
  );
}
