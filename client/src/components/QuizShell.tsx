/**
 * QuizShell — Unified quiz page layout used by all 19 quiz pages.
 *
 * Provides:
 *  - Dark gradient header with course title, subtitle, stats, and action buttons
 *  - Thin animated progress bar
 *  - Module filter pills + Calc Only toggle
 *  - Question card with answer options, confidence meter, confirm/next/prev buttons
 *  - Explanation box (correct/incorrect) with step-by-step toggle
 *  - Session-complete screen
 *  - AI Tutor drawer + Report Error modal
 */

import { class1OptionOrder, class1DisplayLetter } from "@/lib/class1OptionOrder";
import React, { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { TutorPanelPlacement } from "./TutorPanelPlacement";
import SiteNav from "@/components/SiteNav";
import ModuleOverviewPanel from "@/components/ModuleOverview";
import type { ModuleOverview } from "@/lib/questionTypes";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import StepSolution from "@/components/StepSolution";
import ReportErrorModal from "@/components/ReportErrorModal";
import FeedbackModal from "@/components/FeedbackModal";
import { shouldShowReviewPrompt, GOOGLE_REVIEW_URL, markReviewPromptShown, markAsReviewed } from "@/lib/reviewFunnel";
import { Link, useSearch } from "wouter";
import { readUSStudyContext, withUSStudyContext } from "@shared/usStudyContext";
import { resolveCourseKey } from "@shared/courseRegistry";
import { trpc } from "@/lib/trpc";
import PracticeQuestionStatus from "@/components/PracticeQuestionStatus";
import QuizSkeleton from "@/components/QuizSkeleton";
import PracticeOptions from "@/components/PracticeOptions";
import { getPracticeGuidePath } from "@/lib/practiceResources";
import StudyNotesTopics from "@/components/StudyNotesTopics";
import { resolveStudyNotesTopics } from "@/lib/studyNotesTopics";
import "./StudyWorkspace.css";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: number;
  correct?: number;          // alias used by some question banks
  explanation?: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  module?: string;
  difficulty?: string;
  isCalc?: boolean;
  formulaLink?: string;
  [key: string]: unknown;
}

export type AnyQuizQuestion = QuizQuestion & { [key: string]: unknown };

export interface ModuleConfig {
  name: string;
  icon?: string;
  bg?: string;
  color?: string;
}

export interface QuizShellProps {
  // Navigation
  currentPath: string;

  // Header
  courseLabel: string;       // e.g. "WPI Class I · Water Treatment"
  courseTitle: string;       // e.g. "Practice Quiz"
  courseSubtitle?: string;   // e.g. "502 questions · BC (EOCP Level I)"
  headerGradient?: string;   // CSS gradient string, defaults to brand blue-teal
  headerIcon?: string;       // emoji for the icon box

  // Header action buttons (formula sheet, mock exam, etc.)
  headerActions?: { label: string; href: string }[];

  // Session state
  history: unknown[];
  correctCount: number;
  wrongCount: number;
  sessionSize?: number;

  // Module filter
  modules?: ModuleConfig[];
  selectedModule: string | null;
  onModuleChange: (mod: string | null) => void;

  // Calc Only
  hasCalcOnly?: boolean;
  calcOnly: boolean;
  noCalcQuestions?: boolean;
  onCalcOnlyToggle: () => void;

  // Current question
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  current: any;
  questionStatus?: "loading" | "error" | "empty";
  questionError?: string;
  onRetryQuestions?: () => void;
  selected: number | null;
  confidence: number | null;
  confirmed: boolean;
  showSteps: boolean;
  tutorOpen: boolean;

  // Callbacks
  onSelect: (idx: number) => void;
  onConfirm: () => void;
  onNext: () => void;
  onGoBack: () => void;
  onConfidenceChange: (v: number) => void;
  onToggleSteps: () => void;
  onTutorOpen: () => void;
  onTutorClose: () => void;
  onResetSession: () => void;

  // AI Tutor render prop (optional — caller renders its own AITutor)
  renderAITutor?: (onDismiss: () => void) => ReactNode;
  // Optional: mock exam link for session-complete screen
  mockExamHref?: string;

  // Optional: formula links per module
  formulaLinks?: Record<string, string>;

  // Optional: extra content below question card (e.g. pattern alerts)
  extraContent?: ReactNode;

  // Optional: module overview study notes (keyed by module name)
  moduleOverviews?: Record<string, ModuleOverview>;

  // Optional course-specific visuals that extend the shared question and notes surfaces.
  renderQuestionSupplement?: (question: AnyQuizQuestion) => ReactNode;
  renderModuleSupplement?: (moduleName: string) => ReactNode;

  // Optional: extra content rendered inside the header (below stats/pills row)
  headerExtra?: ReactNode;
  // Optional: timed mode — seconds per question (0 = disabled)
  timedSeconds?: number;
  // Optional: callback when timer expires (caller should auto-confirm/advance)
  onTimeUp?: () => void;
  // Optional: paywall/gate overlay — rendered on top of the quiz when provided.
  // Use this instead of an early return so the page stays mounted on mobile.
  gate?: ReactNode;
  // Optional: exam type / bank key for feedback tracking (e.g. "class1-water")
  examType?: string;
  // Optional: show "Free preview: N of M" indicator for non-unlocked users
  isFreePreview?: boolean;
  freeLimit?: number;
}

/**
 * A saved topic URL can outlive a bank import or question repair. Once the
 * current learner-visible module list is loaded, fall back to All Modules
 * instead of issuing a filter that cannot return a question.
 */
export function shouldClearUnavailableSelectedModule(
  selectedModule: string | null,
  modules: readonly ModuleConfig[],
): boolean {
  return Boolean(selectedModule?.trim())
    && modules.length > 0
    && !modules.some((module) => module.name === selectedModule);
}

/** The recovery panel is for a real delivery failure or an empty valid slice.
 * A normal in-flight request must keep the familiar quiz workspace visible. */
export function shouldShowPracticeQuestionStatus(
  questionStatus: QuizShellProps["questionStatus"],
): questionStatus is "error" | "empty" {
  return questionStatus === "error" || questionStatus === "empty";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFF_COLOR: Record<string, string> = {
  easy: "#059669",
  medium: "#D97706",
  hard: "#DC2626",
};
const DIFF_BG: Record<string, string> = {
  easy: "#DCFCE7",
  medium: "#FEF9C3",
  hard: "#FEE2E2",
};

const DEFAULT_GRADIENT = "linear-gradient(135deg, #0369A1 0%, #0E7490 100%)";

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuizShell({
  currentPath,
  courseLabel,
  courseTitle,
  courseSubtitle,
  headerGradient = DEFAULT_GRADIENT,
  headerIcon,
  headerActions = [],
  history,
  correctCount,
  wrongCount,
  sessionSize,
  modules = [],
  selectedModule,
  onModuleChange,
  hasCalcOnly = false,
  calcOnly,
  noCalcQuestions = false,
  onCalcOnlyToggle,
  current,
  questionStatus, questionError, onRetryQuestions,
  selected,
  confidence,
  confirmed,
  showSteps,
  tutorOpen,
  onSelect,
  onConfirm,
  onNext,
  onGoBack,
  onConfidenceChange,
  onToggleSteps,
  onTutorOpen,
  onTutorClose,
  onResetSession,
  mockExamHref,
  formulaLinks,
  extraContent,
  renderAITutor,
  moduleOverviews,
  renderQuestionSupplement,
  renderModuleSupplement,
  headerExtra,
  timedSeconds = 0,
  onTimeUp,
  gate,
  examType,
  isFreePreview = false,
  freeLimit = 15,
}: QuizShellProps) {
  const search = useSearch();
  const usContext = readUSStudyContext(search);
  const canonicalCourse = resolveCourseKey(examType ?? currentPath.slice(1));
  // A dedicated US course carries its own US question bank, so it is named as
  // such. A shared WPI course is only labelled US preparation when the learner
  // actually carries US study context, and stays honest about being shared.
  const displaySubtitle = canonicalCourse?.examFamily === "us-wpi"
    ? `${usContext.state?.name ?? "United States"} · US Class I preparation · Confirm your local exam requirements`
    : canonicalCourse?.examFamily === "western" && usContext.isUS
      ? `${usContext.state?.name ?? "US"} · Shared WPI preparation · Confirm your local exam requirements`
      : courseSubtitle;
  const clearedUnavailableModuleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldClearUnavailableSelectedModule(selectedModule, modules)) {
      clearedUnavailableModuleRef.current = null;
      return;
    }
    if (clearedUnavailableModuleRef.current !== selectedModule) {
      clearedUnavailableModuleRef.current = selectedModule;
      onModuleChange(null);
    }
  }, [modules, onModuleChange, selectedModule]);

  // Show toast when calc-only has no questions available
  useEffect(() => {
    if (noCalcQuestions) {
      toast.error("No calculation questions available for this course yet.", { duration: 4000 });
    }
  }, [noCalcQuestions]);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [studyNotesOpen, setStudyNotesOpen] = useState(false);
  const [studyNotesModule, setStudyNotesModule] = useState<string | null>(null);
  const [studyNotesPracticeModule, setStudyNotesPracticeModule] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const openStudyNotes = useCallback((practiceModule: string | null) => {
    const courseKey = examType ?? currentPath.slice(1);
    const resolution = resolveStudyNotesTopics(courseKey, practiceModule, Object.keys(moduleOverviews ?? {}));
    setStudyNotesPracticeModule(practiceModule);
    setStudyNotesModule(resolution.initialTopic);
    setStudyNotesOpen(true);
  }, [currentPath, examType, moduleOverviews]);

  const dismissTutor = useCallback(() => {
    onTutorClose();
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("panel") === "tutor") {
        url.searchParams.delete("panel");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // Closing the panel must still work when browser history is unavailable.
    }
  }, [onTutorClose]);

  // Course-workspace deep links open the requested learning surface directly.
  // Notes often arrive after cached questions, so this deliberately retries when
  // the note payload resolves instead of showing an inaccurate preparation state.
  useEffect(() => {
    const panel = new URLSearchParams(window.location.search).get("panel");
    if (panel === "notes") {
      if (moduleOverviews) {
        openStudyNotes(selectedModule);
      }
    }
    if (panel === "tutor") onTutorOpen();
  // Retry when cached-question pages receive their independent notes payload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, moduleOverviews, selectedModule]);
  const toggleBookmarkMutation = trpc.dashboard.toggleBookmark.useMutation({
    onSuccess: (data) => {
      setBookmarked(data.bookmarked);
      toast(data.bookmarked ? "🔖 Bookmarked" : "Bookmark removed");
    },
    onError: () => toast.error("Could not save bookmark — please try again."),
  });

  // ── Session-complete feedback modal ──────────────────────────────────────────
  const [showSessionFeedback, setShowSessionFeedback] = useState(false);
  const prevHistoryLen = useRef(0);

  // Trigger feedback modal when session completes (current becomes null after answering questions)
  // Only show if at least 5 questions were answered (avoids premature trigger when pool is exhausted)
  const FEEDBACK_MIN_QUESTIONS = 5;
  useEffect(() => {
    if (!questionStatus && !current && history.length >= FEEDBACK_MIN_QUESTIONS && prevHistoryLen.current > 0) {
      setShowSessionFeedback(true);
      // Increment session counter for review prompt gating
      try {
        const n = (parseInt(localStorage.getItem("echelon_session_count") ?? "0", 10) || 0) + 1;
        localStorage.setItem("echelon_session_count", String(n));
      } catch { /* ignore */ }
    }
    prevHistoryLen.current = history.length;
  }, [current, history.length, questionStatus]);

  // ── Timed mode countdown ───────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(timedSeconds > 0 ? timedSeconds : 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer whenever the question changes or timed mode changes
  useEffect(() => {
    if (timedSeconds <= 0 || confirmed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(timedSeconds);
    // Local guards scoped to this question's timer instance: `remaining` tracks
    // the countdown and `fired` ensures the time-up side effects run exactly once
    // (calling them inside the setState updater could double-fire them).
    let remaining = timedSeconds;
    let fired = false;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining > 0 ? remaining : 0);
      if (remaining <= 0 && !fired) {
        fired = true;
        if (timerRef.current) clearInterval(timerRef.current);
        onTimeUp?.();
        toast.warning("\u23f1\ufe0f Time's up!", { description: "The question was auto-submitted.", duration: 3000 });
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, timedSeconds, confirmed]);

  const timerPct = timedSeconds > 0 ? (timeLeft / timedSeconds) * 100 : 100;
  const timerColor = timerPct > 50 ? "#059669" : timerPct > 25 ? "#D97706" : "#DC2626";

  // Reset bookmark state when question changes
  const prevQuestionId = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (current?.id !== prevQuestionId.current) {
      setBookmarked(false);
      prevQuestionId.current = current?.id;
    }
  }, [current?.id]);

  const progress = sessionSize ? Math.min(100, (history.length / sessionSize) * 100) : 0;
  const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : null;

  // Delivery failures and genuinely empty selections are separate from a
  // completed quiz session. Normal loading stays in the quiz workspace.
  if (shouldShowPracticeQuestionStatus(questionStatus)) {
    return <><SiteNav currentPath={currentPath} /><main className="mx-auto max-w-3xl p-6 text-slate-900">
      <h1 className="text-xl font-bold">{courseTitle}</h1>
      <PracticeQuestionStatus status={questionStatus} error={questionError} answerCount={history.length}
        modules={modules} selectedModule={selectedModule} calcOnly={calcOnly} hasCalcOnly={hasCalcOnly}
        onModuleChange={onModuleChange} onCalcOnlyToggle={onCalcOnlyToggle}
        onRetry={onRetryQuestions} onRestart={onResetSession}>
        {headerExtra}
      </PracticeQuestionStatus>
    </main>{gate}</>;
  }

  if (!current && history.length > 0) {
    const pct = Math.round((correctCount / history.length) * 100);
    return (
      <div className="practice-page" style={{ minHeight: "100vh", background: "#F4F7FB", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath={currentPath} />
        {showSessionFeedback && examType && (
          <FeedbackModal
            examType={examType}
            feedbackType="session_complete"
            onClose={() => setShowSessionFeedback(false)}
            onSubmitted={() => setShowSessionFeedback(false)}
          />
        )}
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "40px 36px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            textAlign: "center",
          }} className="qs-session-card">
            <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 70 ? "🎉" : "📚"}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Session Complete!
            </h2>
            <div style={{
              fontSize: 40,
              fontWeight: 900,
              color: pct >= 70 ? "#059669" : "#DC2626",
              marginBottom: 4,
            }}>
              {pct}%
            </div>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>
              {correctCount} correct · {wrongCount} incorrect
              {sessionSize ? ` · ${sessionSize} questions` : ""}
            </p>
            {/* Google Review prompt — shown when user scores 70%+ AND review prompt budget allows */}
            {pct >= 70 && shouldShowReviewPrompt() && (
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { markReviewPromptShown(); markAsReviewed(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 12,
                  background: "#FEF9C3",
                  border: "1.5px solid #FDE047",
                  color: "#713F12",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  marginBottom: 12,
                  fontFamily: "inherit",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <span style={{ fontSize: 18 }}>⭐</span>
                Enjoying Echelon? Leave us a Google Review
              </a>
            )}
            <div className="qs-session-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={onResetSession}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: headerGradient,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                🔄 New Session
              </button>
              {mockExamHref && (
                <Link href={withUSStudyContext(mockExamHref, canonicalCourse?.courseKey, search)} style={{ flex: 1, width: "100%", padding: "14px 20px", borderRadius: 12, background: "#fff", color: "#0369A1", fontWeight: 700, fontSize: 15, border: "1.5px solid #0369A1", cursor: "pointer", fontFamily: "inherit", textDecoration: "none", textAlign: "center", boxSizing: "border-box" }}>
                  📝 Mock Exam
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // The initial request has no prior question to keep on screen. Subsequent
  // module changes retain their current question while the next slice arrives.
  if (!current) {
    if (questionStatus === "loading") return <QuizSkeleton />;
    return null;
  }

  const isQuestionLoading = questionStatus === "loading";
  const correctIdx = current.correctAnswer ?? current.correct ?? (current as any).correctIndex ?? 0;
  const moduleConfig = modules.find(m => m.name === current.module);
  const moduleBg = moduleConfig?.bg ?? "#F1F5F9";
  const moduleColor = moduleConfig?.color ?? "#475569";
  const moduleIcon = moduleConfig?.icon ?? "📚";

  // Formula link for current question
  const formulaLink = current.formulaLink
    ?? (formulaLinks && current.module ? formulaLinks[current.module] : undefined);

  return (
    <div className={`practice-page practice-screen${tutorOpen && renderAITutor ? " has-tutor" : ""}`} style={{ background: "#F4F7FB", fontFamily: "'Sora', sans-serif", overscrollBehavior: "none" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        /* Keep every module available. A hidden horizontal overflow made the
           final module buttons look cut off on laptops and tablets. */
        .qs-module-pills-row { flex-wrap: wrap !important; overflow-x: visible !important; row-gap: 5px; padding-bottom: 3px; }
        .qs-module-pills-row::-webkit-scrollbar, .qs-mode-bar-wrap::-webkit-scrollbar { display: none; }
        .qs-mode-bar-wrap { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; padding-bottom: 3px; scrollbar-width: none; }
        .qs-mode-card { min-width: 0 !important; padding: 6px 10px !important; }
        .qs-mode-card-desc { display: none; }
        .qs-mode-settings-btn { padding: 6px 10px !important; }
        @media (max-width: 640px) {
          .qs-course-header { padding: 8px 16px 6px !important; }
          .qs-course-subtitle { display: none !important; }
          /* These destinations are already present in the course navigation above the quiz. */
          .qs-header-actions { display: none !important; }
          .qs-stats-only { margin-top: 4px !important; }
          .qs-module-pills-row { margin-top: 4px !important; }
          .qs-mode-bar-wrap { margin-top: 2px !important; }
          /* Larger touch targets for answer options */
          .qs-question-card button {
            min-height: 48px !important;
            padding: 14px 16px !important;
            touch-action: manipulation;
          }
          /* Confirm/Next buttons full width on mobile */
          .qs-action-row { flex-direction: column !important; gap: 8px !important; }
          .qs-action-row > button { width: 100% !important; flex: none !important; min-height: 48px !important; min-width: 0 !important; box-sizing: border-box !important; }
          /* Session end buttons */
          .qs-session-btns { flex-direction: column !important; }
          .qs-session-btns a, .qs-session-btns button { width: 100% !important; min-height: 48px !important; }
        }
        @media (max-width: 640px) {
          .qs-header-title-row { flex-direction: column !important; align-items: flex-start !important; }
          /* Course navigation already exposes these destinations; keep the question viewport clear. */
          .qs-header-actions { display: none !important; }
          /* Inline segmented stats bar */
          .qs-stats-only { display: flex !important; flex-wrap: nowrap !important; gap: 0 !important; background: rgba(0,0,0,0.20) !important; border-radius: 10px !important; overflow: hidden !important; margin-top: 10px !important; width: 100% !important; }
          .qs-stats-only > div { flex: 1 !important; min-width: 0 !important; padding: 6px 4px !important; border-right: 1px solid rgba(255,255,255,0.12) !important; text-align: center !important; background: transparent !important; border-radius: 0 !important; }
          .qs-stats-only > div:last-child { border-right: none !important; }
          /* Module pills wrap into readable rows instead of clipping off-screen. */
          .qs-module-pills-row { display: flex !important; gap: 5px !important; overflow-x: visible !important; flex-wrap: wrap !important; row-gap: 5px !important; padding-bottom: 4px !important; margin-top: 8px !important; width: 100% !important; }
          .qs-module-pills-row::-webkit-scrollbar { display: none !important; }
          .qs-module-pills-row button { font-size: 10px !important; padding: 4px 9px !important; flex-shrink: 0 !important; white-space: nowrap !important; }
          /* Compact mode cards on mobile */
          .qs-mode-bar-wrap { gap: 6px !important; width: 100% !important; }
          .qs-mode-card { min-width: 0 !important; padding: 8px 10px !important; flex: 1 1 0 !important; }
          .qs-mode-card-icon { width: 28px !important; height: 28px !important; font-size: 14px !important; border-radius: 8px !important; }
          .qs-mode-card-label { font-size: 11px !important; }
          .qs-mode-card-desc { display: none !important; }
          .qs-mode-settings-btn { padding: 8px 10px !important; font-size: 11px !important; }
          /* Question card */
          .qs-question-card { padding: 16px 14px 14px !important; }
          .qs-session-card { padding: 28px 18px !important; }
          /* Badges row: keep all items on one line, truncate long module names */
          .qs-badges-row { flex-wrap: nowrap !important; overflow: hidden !important; }
          .qs-badges-row > span:first-child { min-width: 0 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; max-width: 55% !important; }
          .qs-q-counter { margin-left: auto !important; flex-shrink: 0 !important; white-space: nowrap !important; }
          /* Post-confirm secondary buttons: wrap into 2-column grid on mobile */
          .qs-action-row-secondary { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; width: 100% !important; }
          .qs-action-row-secondary button { width: 100% !important; min-width: 0 !important; flex: none !important; }
        }
      `}</style>

      <SiteNav currentPath={currentPath} />

      <div className="practice-screen-main">
      <section className="practice-header" aria-label="Practice session">
        <div className="practice-header-inner">
          <div className="practice-title-row"><div>
            <span className="workspace-eyebrow">{courseLabel}</span>
            <h1>{courseTitle}</h1>
            {displaySubtitle && <p>{displaySubtitle}</p>}
          </div></div>
          <div className="practice-session-stats" aria-live="polite">
            <span><strong>{confirmed ? history.length : history.length + 1}{sessionSize ? ` / ${sessionSize}` : ""}</strong> questions</span>
            <span><strong>{correctCount}</strong> correct</span>
            {accuracy !== null && <span><strong>{accuracy}%</strong> accuracy</span>}
          </div>
          {isFreePreview && <p className="practice-preview">Free preview · {Math.min(history.length, freeLimit)} of {freeLimit} questions used</p>}
          <PracticeOptions modules={modules} selectedModule={selectedModule} onModuleChange={onModuleChange}
            hasCalcOnly={hasCalcOnly} calcOnly={calcOnly} onCalcOnlyToggle={onCalcOnlyToggle}>
            {headerExtra}
          </PracticeOptions>
        </div>
      </section>

       {/* ── Progress bar ── */}
      {sessionSize && (
        <div style={{ height: 3, background: "rgba(0,0,0,0.08)" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: headerGradient,
            transition: "width 0.4s ease",
          }} />
        </div>
      )}
      {/* ── Timed mode bar ── */}
      {timedSeconds > 0 && !confirmed && (
        <div style={{ position: "relative", height: 4, background: "rgba(0,0,0,0.08)" }}>
          <div style={{
            height: "100%",
            width: `${timerPct}%`,
            background: timerColor,
            transition: "width 1s linear, background 0.3s",
          }} />
          {/* Floating countdown badge */}
          <div style={{
            position: "absolute",
            right: 12,
            top: 6,
            background: timerColor,
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: 100,
            fontFamily: "'Sora', sans-serif",
            letterSpacing: "0.04em",
            minWidth: 36,
            textAlign: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}>
            {timeLeft}s
          </div>
        </div>
      )}
      {/* ── Body ── */}
      <div className="practice-content" tabIndex={0} role="region" aria-label="Practice question and explanation">

        {/* Ticket 12: Gate skeleton — when gate is active, render a blurred placeholder instead of the full quiz content.
             This prevents locked question text and answer options from being sent to the DOM. */}
        {gate ? (
          <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }} aria-hidden="true">
            {/* Static skeleton cards — no real question data */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 10 }}>
              <div style={{ height: 12, background: "#E2E8F0", borderRadius: 6, marginBottom: 12, width: "30%" }} />
              <div style={{ height: 16, background: "#E2E8F0", borderRadius: 6, marginBottom: 8, width: "90%" }} />
              <div style={{ height: 16, background: "#E2E8F0", borderRadius: 6, marginBottom: 20, width: "70%" }} />
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 44, background: "#F1F5F9", borderRadius: 10, marginBottom: 8 }} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Module Overview panel — shown when a specific module is selected */}
        {!gate && moduleOverviews && selectedModule && moduleOverviews[selectedModule] && (
          <ModuleOverviewPanel
            key={selectedModule}
            overview={moduleOverviews[selectedModule]}
            moduleName={selectedModule}
            moduleColor={modules.find(m => m.name === selectedModule)?.color}
            moduleBg={modules.find(m => m.name === selectedModule)?.bg}
            moduleIcon={modules.find(m => m.name === selectedModule)?.icon}
            defaultExpanded={false}
          />
        )}

        {/* Only render quiz content when gate is NOT active */}
        {!gate && (<>

        {/* Question card */}
        <div className="qs-question-card" style={{
          background: "#fff",
          borderRadius: 14,
          padding: "16px 18px 14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: 10,
          animation: "fadeUp 0.2s ease",
          position: "relative",
        }}>
          {isQuestionLoading && (
            <div role="status" aria-live="polite" style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              background: "rgba(248,250,252,0.86)",
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
              backdropFilter: "blur(1px)",
            }}>
              Loading your next question…
            </div>
          )}
          <div inert={isQuestionLoading} aria-busy={isQuestionLoading || undefined}>
          {/* Badges row */}
          <div className="qs-badges-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
            {current.module && (
              <span style={{
                padding: "3px 10px",
                borderRadius: 100,
                background: moduleBg,
                color: moduleColor,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}>
                {moduleIcon} {current.module}
              </span>
            )}
            {current.difficulty && (
              <span style={{
                padding: "3px 10px",
                borderRadius: 100,
                background: DIFF_BG[current.difficulty] ?? "#F1F5F9",
                color: DIFF_COLOR[current.difficulty] ?? "#475569",
                fontSize: 10,
                fontWeight: 700,
              }}>
                {current.difficulty}
              </span>
            )}
            <span className="qs-q-counter" style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>
              Q{confirmed ? history.length : history.length + 1}
            </span>
          </div>

          {/* Question text */}
          {renderQuestionSupplement?.(current)}
          <p data-testid="practice-question" data-question-id={current.id} style={{
            fontSize: "clamp(13px, 2.2vw, 15px)",
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.5,
            margin: "0 0 12px",
          }}>
            {current.question ?? (current as any).q}
          </p>

          {/* Answer options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {class1OptionOrder(examType, current.id, current.options.length).map((idx, displayIndex) => {
              const rawOpt: string = current.options[idx];
              // Strip any baked-in letter prefix (e.g. "A. ", "B. ") to avoid doubling
              const opt = rawOpt.replace(/^[A-Da-d][.):]\s*/, "");
              const isSelected = selected === idx;
              const isCorrect  = confirmed && idx === correctIdx;
              const isWrong    = confirmed && isSelected && idx !== correctIdx;

              let bg     = "#F8FAFC";
              let border = "#E2E8F0";
              let color  = "#0F172A";

              if (isCorrect)       { bg = "#DCFCE7"; border = "#86EFAC"; color = "#15803D"; }
              else if (isWrong)    { bg = "#FEE2E2"; border = "#FCA5A5"; color = "#B91C1C"; }
              else if (isSelected) { bg = "#EFF6FF"; border = "#93C5FD"; color = "#1D4ED8"; }

              return (
                <button
                  key={idx}
                  aria-pressed={isSelected}
                  onClick={() => !confirmed && !isQuestionLoading && onSelect(idx)}
                  disabled={confirmed || isQuestionLoading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${border}`,
                    background: bg,
                    color,
                    fontSize: 13,
                    fontWeight: isSelected || isCorrect ? 700 : 500,
                    cursor: confirmed ? "default" : "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    lineHeight: 1.45,
                    transition: "border-color 0.1s, background 0.1s",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span style={{ opacity: 0.55, fontSize: 12, fontWeight: 800, flexShrink: 0, paddingTop: 1 }}>
                    {String.fromCharCode(65 + displayIndex)}.
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isCorrect && <span style={{ flexShrink: 0 }}>✓</span>}
                  {isWrong   && <span style={{ flexShrink: 0 }}>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Confidence meter */}
          {selected !== null && !confirmed && (
            <details className="practice-confidence"><summary>Optional: how sure are you?</summary>
              <ConfidenceMeter value={confidence} onChange={onConfidenceChange} />
            </details>
          )}

          {/* Action buttons */}
          <div className="qs-action-row practice-primary-actions" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Primary row: Prev + Confirm/Next */}
            <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
              {history.length > 0 && (
                <button
                  onClick={onGoBack}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #E2E8F0",
                    background: "#fff",
                    color: "#64748B",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  ← Prev
                </button>
              )}
              {!confirmed ? (
                <button
                  onClick={onConfirm}
                  disabled={isQuestionLoading || selected === null}
                  style={{
                    flex: 1,
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: selected !== null
                      ? headerGradient
                      : "#E2E8F0",
                    color: selected !== null ? "#fff" : "#94A3B8",
                    fontWeight: 800,
                    fontSize: 14,
                    border: "none",
                    cursor: selected !== null ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    minWidth: 0,
                  }}
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={() => {
                    document.querySelector(".practice-content")?.scrollTo({ top: 0, behavior: "instant" });
                    onNext();
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: headerGradient,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Next Question →
                </button>
              )}
            </div>
            {confirmed && current.steps && current.steps.length > 0 && <button type="button" className="practice-steps-toggle" onClick={onToggleSteps}>{showSteps ? "Hide worked solution" : "Show worked solution"}</button>}
          </div>
          </div>
        </div>

        <div inert={isQuestionLoading}>
        {/* ── Explanation box ── */}
        {confirmed && (
          <div className="practice-explanation" style={{
            background: selected === correctIdx ? "#F0FDF4" : "#FFF7ED",
            border: `1px solid ${selected === correctIdx ? "#BBF7D0" : "#FED7AA"}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 10,
            animation: "fadeUp 0.2s ease",
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: selected === correctIdx ? "#15803D" : "#C2410C",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              {selected === correctIdx ? "✓ Correct!" : "✗ Incorrect"}
            </div>

            {current.explanation ? (
              <div className="practice-explanation-content" style={{ fontSize: 15, color: "#374151", lineHeight: 1.7 }}>
                {current.explanation.split("\n").map((line: string, i: number) => {
                  const isBold = /^\*\*Step \d+/.test(line) || /^\*\*/.test(line);
                  if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                  return (
                    <div key={i} style={{ marginBottom: 4 }}>
                      {isBold ? (
                        <strong style={{ color: "#0F172A" }}>
                          {line.replace(/\*\*/g, "")}
                        </strong>
                      ) : (
                        line
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
                The correct answer is option {class1DisplayLetter(examType, current.id, current.options.length, correctIdx)}.
              </p>
            )}

            {formulaLink && (
              <a
                href={formulaLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 10,
                  fontSize: 12,
                  color: "#0369A1",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                📐 View formula sheet ↗
              </a>
            )}

            <div className="practice-resource-actions">
              {moduleOverviews && <button type="button" onClick={() => openStudyNotes(current.module ?? null)}>Read topic notes</button>}
              <button type="button" onClick={onTutorOpen}>Ask the Tutor about this question</button>
              {getPracticeGuidePath(currentPath) && <a href={getPracticeGuidePath(currentPath)!}>Explore the process guide</a>}
              {getPracticeGuidePath(currentPath) && /clarif|sediment/i.test(current.module ?? "") && <a href="/equipment-lab">Explore equipment</a>}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <button
                onClick={() => setReportModalOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  color: "#94A3B8",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Report an error with this question
              </button>
              {current?.id && (
                <button
                  onClick={() => {
                    if (!current?.id) return;
                    // FIX 5: Pass bankKey (examType) + questionId for per-user+question bookmark
                    toggleBookmarkMutation.mutate({ bankKey: examType ?? "unknown", questionId: current.id });
                  }}
                  disabled={toggleBookmarkMutation.isPending}
                  style={{
                    background: bookmarked ? "#EFF6FF" : "none",
                    border: bookmarked ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 11,
                    color: bookmarked ? "#2563EB" : "#94A3B8",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontWeight: bookmarked ? 700 : 400,
                  }}
                >
                  {bookmarked ? "🔖 Bookmarked" : "📑 Bookmark"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step-by-step solution ── */}
        {confirmed && showSteps && current.steps && current.steps.length > 0 && (
          <div style={{ marginBottom: 12, animation: "fadeUp 0.2s ease" }}>
            <StepSolution
              steps={current.steps}
              tip={current.tip ?? ""}
            />
          </div>
        )}

        {/* ── Extra content slot ── */}
        {extraContent}
        </div>
        {/* Close the !gate fragment */}
        </>)}
      </div>

      </div>
      {/* Same shared panel and context for every course, in its own screen slot. */}
      {tutorOpen && renderAITutor && (
        <TutorPanelPlacement.Provider value="workspace">
          <div className="practice-tutor-slot">{renderAITutor(dismissTutor)}</div>
        </TutorPanelPlacement.Provider>
      )}

      {/* ── Report Error modal ── */}
      {reportModalOpen && current && (
        <ReportErrorModal
          questionId={current.id ?? 0}
          questionText={current.question ?? (current as any).q}
          module={current.module ?? ""}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {/* ── Study Notes modal ── */}
      {studyNotesOpen && moduleOverviews && (
        <div
          onClick={() => setStudyNotesOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            padding: "40px 16px 40px",
            overflowY: "auto",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#F8FAFC",
              borderRadius: 18,
              width: "100%",
              maxWidth: 760,
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              fontFamily: "'Sora', sans-serif",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px",
              background: "#0F172A",
              color: "#fff",
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>📖 Study Notes</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Select a note topic to read its overview</div>
              </div>
              <button
                onClick={() => setStudyNotesOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}
              >✕</button>
            </div>

            <StudyNotesTopics
              courseKey={examType ?? currentPath.slice(1)}
              practiceModule={studyNotesPracticeModule}
              selectedTopic={studyNotesModule}
              overviews={moduleOverviews}
              modules={modules}
              onSelect={setStudyNotesModule}
              renderSupplement={renderModuleSupplement}
            />
          </div>
        </div>
      )}
      {/* ── Gate overlay (paywall) — rendered on top of the quiz ── */}
      {gate}
    </div>
  );
}
