/**
 * useQuizSession — unified quiz session hook for ALL quiz pages.
 *
 * Encapsulates:
 *   - Two-step confirm → next UX (Ontario pedagogical pattern)
 *   - History tracking with usedIds dedup
 *   - Quick 10 mode (stops at exactly 10, never shows paywall)
 *   - Standard mode paywall gate (after SESSION_SIZE questions for non-unlocked users)
 *   - Missed-questions mode (retry only previously wrong answers)
 *   - Timed mode auto-confirm on timer expiry
 *   - Calc-only filter, module filter
 *   - Session reset, mode change, settings apply
 *   - Go-back (undo last answer)
 *
 * Every quiz page should call this hook and wire the returned values
 * directly into QuizShell props. No quiz logic should live in page files.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { isTrialUnlocked, setTrialUnlocked, isSubscriptionUnlocked } from "@/components/QuizGate";
import { useAttemptLogger, type QuizMode } from "@/components/QuizModeBar";
import { DEFAULT_QUIZ_SETTINGS, type QuizSettings } from "@/components/QuizSettingsDrawer";
import type { DBQuestion } from "@/hooks/useQuestionBank";

// ─── Constants ───────────────────────────────────────────────────────────────
// Default/fallback session size; actual size comes from quizSettings.sessionSize
const DEFAULT_SESSION_SIZE = 15;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface HistoryEntry {
  questionId: number;
  module: string;
  difficulty: string;
  correct: boolean;
  confidence: number | null;
  selectedOption: number;
  questionObj: DBQuestion;
}

export interface UseQuizSessionConfig {
  /** The bank key used for tRPC queries, e.g. "class1-water", "wpi-class1-water", "oit" */
  examType: string;
  /** All questions loaded from useQuestionBank */
  allQuestions: DBQuestion[];
}

export interface UseQuizSessionReturn {
  // ── State ──────────────────────────────────────────────────────────────────
  history: HistoryEntry[];
  current: DBQuestion | null;
  selected: number | null;
  confidence: number | null;
  confirmed: boolean;
  showSteps: boolean;
  tutorOpen: boolean;
  selectedModule: string | null;
  calcOnly: boolean;
  quizMode: QuizMode;
  quizSettings: QuizSettings;
  settingsOpen: boolean;
  trialDone: boolean;
  trialUnlocked: boolean;
  missedCount: number;

  // ── Derived ────────────────────────────────────────────────────────────────
  correctCount: number;
  wrongCount: number;
  sessionSize: number;

  // ── Actions ────────────────────────────────────────────────────────────────
  handleConfirm: () => void;
  handleNext: () => void;
  goBack: () => void;
  resetSession: () => void;
  handleModeChange: (mode: QuizMode) => void;
  handleCalcOnlyToggle: () => void;
  handleModuleChange: (mod: string | null) => void;
  handleTimeUp: () => void;
  handleSettingsApply: (settings: QuizSettings) => void;
  handleGateUnlocked: () => void;
  setSelected: (idx: number | null) => void;
  setConfidence: (v: number | null) => void;
  setShowSteps: React.Dispatch<React.SetStateAction<boolean>>;
  setTutorOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;

  // ── Initialization ─────────────────────────────────────────────────────────
  initialized: boolean;
  initialize: () => void;

  // ── Exam context (for AI tutor memory) ─────────────────────────────────────
  examType: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Adaptive next-question selection ────────────────────────────────────────
function getAdaptiveNext(
  history: HistoryEntry[],
  pool: DBQuestion[],
  trialUnlocked: boolean,
): DBQuestion | null {
  if (pool.length === 0) return null;

  // For trial phase, prefer medium/hard questions
  if (!trialUnlocked && history.length < DEFAULT_SESSION_SIZE) {
    const hardPool = pool.filter(
      (q) => q.difficulty === "medium" || q.difficulty === "hard",
    );
    if (hardPool.length > 0) return pickRandom(hardPool);
  }

  // Adaptive: if recent history has weak modules, bias towards them
  if (history.length >= 3) {
    const recent = history.slice(-6);
    const moduleCounts: Record<string, { wrong: number; total: number }> = {};
    recent.forEach((h) => {
      if (!moduleCounts[h.module])
        moduleCounts[h.module] = { wrong: 0, total: 0 };
      moduleCounts[h.module].total++;
      if (!h.correct) moduleCounts[h.module].wrong++;
    });
    const weakModules = Object.entries(moduleCounts)
      .filter(([, v]) => v.wrong / v.total >= 0.5)
      .map(([k]) => k);
    if (weakModules.length > 0) {
      const weakQ = pool.filter((q) => weakModules.includes(q.module));
      if (weakQ.length > 0) return pickRandom(weakQ);
    }
  }

  return pickRandom(pool);
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useQuizSession({
  examType,
  allQuestions,
}: UseQuizSessionConfig): UseQuizSessionReturn {
  // ── URL params ─────────────────────────────────────────────────────────────
  const searchString = useSearch();
  const initialCalcOnly =
    new URLSearchParams(searchString).get("calcOnly") === "true";

  // ── Core state ─────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<DBQuestion | null>(null);
  const [selected, setSelectedState] = useState<number | null>(null);
  const [confidence, setConfidenceState] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpenState] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly] = useState(initialCalcOnly);
  const [initialized, setInitialized] = useState(false);

  // ── Trial / gate state ─────────────────────────────────────────────────────
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() =>
    isTrialUnlocked() || isSubscriptionUnlocked(examType),
  );
  const [trialDone, setTrialDone] = useState(false);

  // ── Server-side access check — lifts gate for paid users on any device ─────
  // Runs silently in the background. If the server confirms hasAccess:true
  // (e.g. user purchased on another device/browser), unlock the gate immediately.
  // Read stored email and access token for server-side access check (subscription/purchase customers without login)
  const [storedEmailForAccess] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("echelon_subscription_email")
        ?? localStorage.getItem("echelon_trial_email")
        ?? undefined;
    } catch { return undefined; }
  });
  const [storedAccessTokenForAccess] = useState<string | undefined>(() => {
    try { return localStorage.getItem("echelon_access_token") ?? undefined; } catch { return undefined; }
  });
  const { data: accessData } = trpc.stripe.checkAccess.useQuery(
    { examType, email: storedEmailForAccess, accessToken: storedAccessTokenForAccess },
    {
      staleTime: 5 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );
  // Lift the gate when server confirms access (safe useEffect pattern)
  useEffect(() => {
    if (accessData?.hasAccess === true && !trialUnlocked) {
      setTrialUnlockedState(true);
      setTrialUnlocked(); // persist to localStorage for instant next visit
    }
  }, [accessData?.hasAccess, trialUnlocked]);

  // ── Quiz mode & settings ───────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [quizSettings, setQuizSettings] =
    useState<QuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Missed-questions data ──────────────────────────────────────────────────
  const [missedIds, setMissedIds] = useState<number[]>([]);
  const logAttemptFn = useAttemptLogger(examType, quizMode);
  const { data: missedData, refetch: refetchMissed } =
    trpc.quiz.getMissedQuestions.useQuery(
      { examType, limit: 50 },
      { refetchOnWindowFocus: false },
    );
  const missedCount = missedData?.total ?? 0;

  // ── Progress persistence: seed usedIds from previously-mastered questions ──
  const { data: attemptStats } = trpc.quiz.getAttemptStats.useQuery(
    { examType },
    { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
  );
  // On mount, pre-seed usedIds with mastered questions (answered correctly 2+ times in 30 days)
  // This ensures returning users don't re-see questions they've already mastered
  useEffect(() => {
    if (attemptStats && attemptStats.seenIds.length > 0 && usedIds.size === 0 && history.length === 0) {
      // Only seed mastered questions (seenIds minus missedIds)
      const missedSet = new Set(attemptStats.missedIds);
      const masteredIds = attemptStats.seenIds.filter(id => !missedSet.has(id));
      if (masteredIds.length > 0) {
        setUsedIds(new Set(masteredIds));
      }
    }
  }, [attemptStats]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const correctCount = history.filter((h) => h.correct).length;
  const wrongCount = history.length - correctCount;
  // sessionSize: quick10 is always 10; otherwise use the user-configured setting
  const sessionSize = quizMode === "quick10" ? 10 : (quizSettings.sessionSize ?? DEFAULT_SESSION_SIZE);

  // ── Filtered pool ──────────────────────────────────────────────────────────
  const pool = useMemo(() => {
    let qs = allQuestions.filter((q) => !usedIds.has(q.id));
    if (quizMode === "missed" && missedIds.length > 0) {
      const missedSet = new Set(missedIds);
      qs = allQuestions.filter(
        (q) => missedSet.has(q.id) && !usedIds.has(q.id),
      );
    } else {
      if (selectedModule)
        qs = qs.filter((q) => q.module === selectedModule);
      if (calcOnly) qs = qs.filter((q) => q.isCalc === true);
    }
    return qs;
  }, [allQuestions, usedIds, selectedModule, calcOnly, quizMode, missedIds]);

  // ── Clear UI state helper ──────────────────────────────────────────────────
  const clearUI = useCallback(() => {
    setSelectedState(null);
    setConfidenceState(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpenState(false);
  }, []);

  // ── Set selected (only when not confirmed) ─────────────────────────────────
  const setSelected = useCallback(
    (idx: number | null) => {
      if (!confirmed) setSelectedState(idx);
    },
    [confirmed],
  );

  const setConfidence = useCallback(
    (v: number | null) => {
      if (!confirmed) setConfidenceState(v);
    },
    [confirmed],
  );

  const setTutorOpen = useCallback((v: boolean) => {
    setTutorOpenState(v);
  }, []);

  // ── Initialize (call once when allQuestions loads) ──────────────────────────
  const initialize = useCallback(() => {
    if (initialized || allQuestions.length === 0) return;
    // Prefer medium/hard for trial phase
    const trialPool = allQuestions.filter(
      (q) => q.difficulty === "medium" || q.difficulty === "hard",
    );
    const startPool = trialPool.length >= 15 ? trialPool : allQuestions;
    setCurrent(pickRandom(startPool));
    setInitialized(true);
  }, [initialized, allQuestions]);

  // ── Confirm answer (step 1: lock answer, show explanation) ─────────────────
  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const correctIdx = current.correctIndex ?? 0;
    const isCorrect = selected === correctIdx;

    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty ?? "medium",
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      questionObj: current,
    };

    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setUsedIds((s) => new Set([...Array.from(s), current.id]));
    setConfirmed(true);
    setShowSteps(false);

    // Log attempt to backend
    logAttemptFn({
      topic: current.module,
      questionId: current.id,
      correct: isCorrect,
      difficulty: current.difficulty ?? undefined,
    });

    // Refetch missed questions if wrong
    if (!isCorrect) setTimeout(() => refetchMissed(), 500);

    // Toast warning at 2 questions before paywall
    if (
      quizMode !== "quick10" &&
      !trialUnlocked &&
      updatedHistory.length === DEFAULT_SESSION_SIZE - 2
    ) {
      toast("2 free questions left", { description: "Subscribe to keep going after this." });
    }

    // Check if paywall should trigger (only in standard/missed mode, not quick10)
    if (
      quizMode !== "quick10" &&
      !trialUnlocked &&
      updatedHistory.length >= DEFAULT_SESSION_SIZE
    ) {
      setTrialDone(true);
    }
  }, [
    selected,
    confidence,
    current,
    history,
    trialUnlocked,
    logAttemptFn,
    refetchMissed,
    quizMode,
  ]);

  // ── Next question (step 2: advance to next question) ───────────────────────
  const handleNext = useCallback(() => {
    // Quick 10 stop: end session cleanly at 10
    if (quizMode === "quick10" && history.length >= 10) {
      setCurrent(null);
      return;
    }

    // Paywall gate: block advancement if trial exhausted (always 15 for non-unlocked users)
    if (!trialUnlocked && history.length >= DEFAULT_SESSION_SIZE) {
      setTrialDone(true);
      return;
    }

    // Get next question adaptively
    const next = getAdaptiveNext(history, pool, trialUnlocked);
    if (!next) {
      setCurrent(null);
      return;
    }
    setCurrent(next);
    clearUI();
  }, [history, pool, trialUnlocked, quizMode, clearUI]);

  // ── Go back (undo last answer) ─────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setUsedIds((s) => {
      const next = new Set(Array.from(s));
      next.delete(prev.questionId);
      return next;
    });
    setCurrent(prev.questionObj);
    setSelectedState(prev.selectedOption);
    setConfidenceState(prev.confidence);
    setConfirmed(true);
    setShowSteps(false);
    setTutorOpenState(false);
  }, [history]);

  // ── Reset session ──────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setHistory([]);
    setUsedIds(new Set());
    setTrialDone(false);
    clearUI();
    const q = pickRandom(allQuestions);
    setCurrent(q);
  }, [allQuestions, clearUI]);

  // ── Mode change ────────────────────────────────────────────────────────────
  const handleModeChange = useCallback(
    (mode: QuizMode) => {
      setQuizMode(mode);
      setHistory([]);
      setUsedIds(new Set());
      setTrialDone(false);
      clearUI();

      if (mode === "missed") {
        const ids = missedData?.questionIds ?? [];
        setMissedIds(ids);
        if (ids.length > 0) {
          const missedSet = new Set(ids);
          const mPool = allQuestions.filter((q) => missedSet.has(q.id));
          setCurrent(pickRandom(mPool));
        } else {
          setCurrent(null);
        }
      } else {
        setCurrent(pickRandom(allQuestions));
      }
    },
    [missedData, allQuestions, clearUI],
  );

  // ── Settings apply ─────────────────────────────────────────────────────────
  const handleSettingsApply = useCallback(
    (settings: QuizSettings) => {
      setQuizSettings(settings);
      setSettingsOpen(false);
      setHistory([]);
      setUsedIds(new Set());
      setTrialDone(false);
      clearUI();
      setCurrent(pickRandom(allQuestions));
    },
    [allQuestions, clearUI],
  );

  // ── Calc-only toggle ───────────────────────────────────────────────────────
  const handleCalcOnlyToggle = useCallback(() => {
    const next = !calcOnly;
    setCalcOnly(next);
    setHistory([]);
    setUsedIds(new Set());
    clearUI();
    const newPool = allQuestions.filter((q) => !next || q.isCalc);
    const filtered = selectedModule
      ? newPool.filter((q) => q.module === selectedModule)
      : newPool;
    setCurrent(pickRandom(filtered));
  }, [calcOnly, allQuestions, selectedModule, clearUI]);

  // ── Module change ──────────────────────────────────────────────────────────
  const handleModuleChange = useCallback(
    (mod: string | null) => {
      setSelectedModule(mod);
      let newPool = allQuestions.filter((q) => !usedIds.has(q.id));
      if (mod) newPool = newPool.filter((q) => q.module === mod);
      if (calcOnly) newPool = newPool.filter((q) => q.isCalc === true);
      if (newPool.length > 0) {
        setCurrent(pickRandom(newPool));
        clearUI();
      }
    },
    [allQuestions, usedIds, calcOnly, clearUI],
  );

  // ── Time-up handler (auto-confirm + advance) ──────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (confirmed || !current) return;
    const correctIdx = current.correctIndex ?? 0;
    const effectiveSelected = selected ?? (correctIdx === 0 ? 1 : 0);
    const isCorrect = effectiveSelected === correctIdx;
    const effectiveConfidence = confidence ?? 50;

    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty ?? "medium",
      correct: isCorrect,
      confidence: effectiveConfidence,
      selectedOption: effectiveSelected,
      questionObj: current,
    };

    setHistory((h) => [...h, entry]);
    setUsedIds((s) => new Set([...Array.from(s), current.id]));
    logAttemptFn({
      topic: current.module,
      questionId: current.id,
      correct: isCorrect,
      difficulty: current.difficulty ?? undefined,
    });
    setSelectedState(effectiveSelected);
    setConfidenceState(effectiveConfidence);
    setConfirmed(true);
    // Auto-advance after brief delay
    setTimeout(() => handleNext(), 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, current, selected, confidence, logAttemptFn, handleNext]);

  // ── Gate unlocked handler ──────────────────────────────────────────────────
  const handleGateUnlocked = useCallback(() => {
    setTrialUnlocked();
    setTrialUnlockedState(true);
    setTrialDone(false);
    clearUI();
    // Resume with next question from pool
    const next = getAdaptiveNext(history, pool, true);
    if (next) setCurrent(next);
  }, [history, pool, clearUI]);

  return {
    // State
    history,
    current,
    selected,
    confidence,
    confirmed,
    showSteps,
    tutorOpen,
    selectedModule,
    calcOnly,
    quizMode,
    quizSettings,
    settingsOpen,
    trialDone,
    trialUnlocked,
    missedCount,

    // Derived
    correctCount,
    wrongCount,
    sessionSize,

    // Actions
    handleConfirm,
    handleNext,
    goBack,
    resetSession,
    handleModeChange,
    handleCalcOnlyToggle,
    handleModuleChange,
    handleTimeUp,
    handleSettingsApply,
    handleGateUnlocked,
    setSelected,
    setConfidence,
    setShowSteps,
    setTutorOpen,
    setSettingsOpen,

    // Initialization
    initialized,
    initialize,

    // Exam context (for AI tutor memory)
    examType,
  };
}
