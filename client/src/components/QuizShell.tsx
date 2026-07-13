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

import React, { useState, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import ModuleOverviewPanel from "@/components/ModuleOverview";
import type { ModuleOverview } from "@/lib/questionTypes";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import StepSolution from "@/components/StepSolution";
import ReportErrorModal from "@/components/ReportErrorModal";
import FeedbackModal from "@/components/FeedbackModal";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

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
  onCalcOnlyToggle: () => void;

  // Current question
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  current: any;
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
  renderAITutor?: () => ReactNode;
  // Optional: mock exam link for session-complete screen
  mockExamHref?: string;

  // Optional: formula links per module
  formulaLinks?: Record<string, string>;

  // Optional: extra content below question card (e.g. pattern alerts)
  extraContent?: ReactNode;

  // Optional: module overview study notes (keyed by module name)
  moduleOverviews?: Record<string, ModuleOverview>;

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
  onCalcOnlyToggle,
  current,
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
  headerExtra,
  timedSeconds = 0,
  onTimeUp,
  gate,
  examType,
  isFreePreview = false,
  freeLimit = 15,
}: QuizShellProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [studyNotesOpen, setStudyNotesOpen] = useState(false);
  const [studyNotesModule, setStudyNotesModule] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
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
    if (!current && history.length >= FEEDBACK_MIN_QUESTIONS && prevHistoryLen.current > 0) {
      setShowSessionFeedback(true);
      // Increment session counter for review prompt gating
      try {
        const n = (parseInt(localStorage.getItem("echelon_session_count") ?? "0", 10) || 0) + 1;
        localStorage.setItem("echelon_session_count", String(n));
      } catch { /* ignore */ }
    }
    prevHistoryLen.current = history.length;
  }, [current, history.length]);

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

  //  // ── Session complete screen ──────────────────────────────────────────
  if (!current && history.length > 0) {
    const pct = Math.round((correctCount / history.length) * 100);
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
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
            {/* Google Review prompt — shown when user scores 70%+ AND has completed 3+ sessions */}
            {pct >= 70 && (() => {
              try {
                const count = parseInt(localStorage.getItem("echelon_session_count") ?? "0", 10) || 0;
                return count >= 3;
              } catch { return false; }
            })() && (
              <a
                href="https://g.page/r/CWsjBbkUlS8rEBM/review"
                target="_blank"
                rel="noopener noreferrer"
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
                <Link href={mockExamHref} style={{ flex: 1 }}>
                  <button style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 12,
                    background: "#fff",
                    color: "#0369A1",
                    fontWeight: 700,
                    fontSize: 15,
                    border: "1.5px solid #0369A1",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}>
                    📝 Mock Exam
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const correctIdx = current.correctAnswer ?? current.correct ?? (current as any).correctIndex ?? 0;
  const moduleConfig = modules.find(m => m.name === current.module);
  const moduleBg = moduleConfig?.bg ?? "#F1F5F9";
  const moduleColor = moduleConfig?.color ?? "#475569";
  const moduleIcon = moduleConfig?.icon ?? "📚";

  // Formula link for current question
  const formulaLink = current.formulaLink
    ?? (formulaLinks && current.module ? formulaLinks[current.module] : undefined);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif", overscrollBehavior: "none" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @media (max-width: 640px) {
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
          /* Scrollable action buttons strip */
          .qs-header-actions { display: flex !important; flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; gap: 6px !important; padding-bottom: 4px !important; margin-top: 8px !important; width: 100% !important; scrollbar-width: none !important; }
          .qs-header-actions::-webkit-scrollbar { display: none !important; }
          .qs-header-actions a, .qs-header-actions button { white-space: nowrap !important; flex-shrink: 0 !important; font-size: 11px !important; padding: 5px 10px !important; }
          /* Inline segmented stats bar */
          .qs-stats-only { display: flex !important; flex-wrap: nowrap !important; gap: 0 !important; background: rgba(0,0,0,0.20) !important; border-radius: 10px !important; overflow: hidden !important; margin-top: 10px !important; width: 100% !important; }
          .qs-stats-only > div { flex: 1 !important; min-width: 0 !important; padding: 6px 4px !important; border-right: 1px solid rgba(255,255,255,0.12) !important; text-align: center !important; background: transparent !important; border-radius: 0 !important; }
          .qs-stats-only > div:last-child { border-right: none !important; }
          /* Scrollable module pills row */
          .qs-module-pills-row { display: flex !important; gap: 5px !important; overflow-x: auto !important; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch !important; padding-bottom: 4px !important; scrollbar-width: none !important; margin-top: 8px !important; width: 100% !important; }
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

      {/* ── Header ── */}
      <div style={{ background: headerGradient, color: "#fff", padding: "10px 16px 8px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Top row: title + action buttons */}
          <div className="qs-header-title-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {headerIcon && (
                <div style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  padding: "6px 8px",
                  fontSize: 16,
                  lineHeight: 1,
                }}>
                  {headerIcon}
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", opacity: 0.75, textTransform: "uppercase", marginBottom: 2 }}>
                  {courseLabel}
                </div>
                <h1 style={{ margin: 0, fontSize: "clamp(15px, 2.5vw, 18px)", fontWeight: 900, letterSpacing: "-0.3px" }}>
                  {courseTitle}
                </h1>
                {courseSubtitle && (
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>
                    {courseSubtitle}
                    {accuracy !== null && (
                      <span style={{ fontWeight: 700, opacity: 1 }}> · {accuracy}% accuracy</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="qs-header-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {/* Study Notes button — shown when moduleOverviews are available */}
              {moduleOverviews && Object.keys(moduleOverviews).length > 0 && (
                <button
                  onClick={() => {
                    setStudyNotesModule(selectedModule);
                    setStudyNotesOpen(true);
                  }}
                  style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.22)",
                    color: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  📖 Study Notes
                </button>
              )}
              {headerActions.map(a => (
                <Link key={a.href} href={a.href}>
                  <button style={{
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}>
                    {a.label}
                  </button>
                </Link>
              ))}
              {/* Dashboard shortcut — always visible so students can easily check progress */}
              <Link href="/dashboard">
                <button style={{
                  padding: "5px 10px",
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  📊 Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* Stats row — compact inline bar */}
          <div className="qs-stats-only" style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            {/* Session progress tracker — Q{n}/{sessionSize} */}
            <div style={{
              background: "rgba(255,255,255,0.22)",
              border: "1.5px solid rgba(255,255,255,0.5)",
              borderRadius: 8,
              padding: "3px 10px",
              textAlign: "center",
              minWidth: 56,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Q{confirmed ? history.length : history.length + 1}<span style={{ fontSize: 11, fontWeight: 600, opacity: 0.75 }}>/{sessionSize}</span></div>
              <div style={{ fontSize: 8, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Question</div>
            </div>
            {[
              { label: "Correct", value: correctCount },
              { label: "Accuracy", value: `${accuracy ?? 0}%` },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "3px 10px",
                textAlign: "center",
                minWidth: 48,
              }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 8, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Free preview indicator — shown when user has not unlocked */}
          {isFreePreview && (
            <div style={{ marginTop: 8, padding: "6px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Free preview · {Math.min(history.length, freeLimit)} of {freeLimit} questions</span>
              <span style={{ opacity: 0.8 }}>
                {Math.max(0, freeLimit - history.length)} left before unlock
              </span>
            </div>
          )}

          {/* Module pills + Calc Only — scrollable row on mobile via .qs-module-pills-row CSS */}
          {(modules.length > 0 || hasCalcOnly) && (
            <div className="qs-module-pills-row" style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
              {modules.length > 0 && (
                <button
                  onClick={() => onModuleChange(null)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1.5px solid",
                    borderColor: selectedModule === null ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    background: selectedModule === null ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  All Modules
                </button>
              )}
              {modules.map((m, idx) => {
                const isDistColl = /distrib|collect/i.test(m.name);
                // Insert a subtle divider before the Distribution/Collection pill
                const prevIsDistColl = idx > 0 && /distrib|collect/i.test(modules[idx-1].name);
                const needsDivider = isDistColl && idx > 0;
                return (
                  <React.Fragment key={m.name}>
                    {needsDivider && (
                      <span style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.35)", fontSize: 10, flexShrink: 0, userSelect: "none" }}>|</span>
                    )}
                    <button
                      onClick={() => onModuleChange(selectedModule === m.name ? null : m.name)}
                      style={{
                        padding: isDistColl ? "4px 11px" : "4px 10px",
                        borderRadius: 20,
                        border: isDistColl ? "2px solid" : "1.5px solid",
                        borderColor: selectedModule === m.name
                          ? "rgba(255,255,255,0.95)"
                          : isDistColl
                          ? "rgba(255,220,100,0.75)"
                          : "rgba(255,255,255,0.3)",
                        background: selectedModule === m.name
                          ? "rgba(255,255,255,0.28)"
                          : isDistColl
                          ? "rgba(255,200,50,0.18)"
                          : "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: isDistColl ? 700 : 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        flexShrink: 0,
                      }}
                    >
                      {m.icon && <span style={{ marginRight: 4 }}>{m.icon}</span>}
                      {m.name}
                      {isDistColl && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.85, fontWeight: 800, letterSpacing: "0.03em", background: "rgba(255,200,50,0.35)", borderRadius: 4, padding: "1px 4px" }}>NEW</span>}
                    </button>
                  </React.Fragment>
                );
              })}
              {hasCalcOnly && (
                <button
                  onClick={onCalcOnlyToggle}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1.5px solid",
                    borderColor: calcOnly ? "rgba(167,139,250,0.9)" : "rgba(255,255,255,0.3)",
                    background: calcOnly ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  🧮 Calc Only
                </button>
              )}
            </div>
          )}

          {/* Optional extra header content (e.g. quiz mode selector) */}
          {headerExtra && (
            <div style={{ marginTop: 8 }}>
              {headerExtra}
            </div>
          )}
        </div>
      </div>

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
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "12px 16px 24px" }}>

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
        }}>
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
          <p style={{
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
            {(current.options as string[]).map((rawOpt: string, idx: number) => {
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
                  onClick={() => !confirmed && onSelect(idx)}
                  disabled={confirmed}
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
                    {String.fromCharCode(65 + idx)}.
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
            <ConfidenceMeter value={confidence} onChange={onConfidenceChange} />
          )}

          {/* Action buttons */}
          <div className="qs-action-row" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
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
                  disabled={selected === null || confidence === null}
                  style={{
                    flex: 1,
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: selected !== null && confidence !== null
                      ? headerGradient
                      : "#E2E8F0",
                    color: selected !== null && confidence !== null ? "#fff" : "#94A3B8",
                    fontWeight: 800,
                    fontSize: 14,
                    border: "none",
                    cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    minWidth: 0,
                  }}
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); onNext(); }}
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
            {/* Secondary row: Show Steps + AI Tutor (only after confirming) */}
            {confirmed && (
              <div className="qs-action-row-secondary" style={{ display: "flex", gap: 8 }}>
                {current.steps && current.steps.length > 0 && (
                  <button
                    onClick={onToggleSteps}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #E2E8F0",
                      background: showSteps ? "#EFF6FF" : "#fff",
                      color: showSteps ? "#0369A1" : "#64748B",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {showSteps ? "Hide Steps" : "Show Steps"}
                  </button>
                )}
                <button
                  onClick={onTutorOpen}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #E2E8F0",
                    background: "#fff",
                    color: "#0F172A",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  🤖 AI Tutor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Explanation box ── */}
        {confirmed && (
          <div style={{
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
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
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
                The correct answer is option {String.fromCharCode(65 + correctIdx)}.
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
        {/* Close the !gate fragment */}
        </>)}
      </div>

      {/* ── AI Tutor drawer ── */}
      {tutorOpen && renderAITutor && renderAITutor()}

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
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Select a module to read its overview</div>
              </div>
              <button
                onClick={() => setStudyNotesOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}
              >✕</button>
            </div>

            {/* Module picker — shown when no module selected in modal */}
            {!studyNotesModule && (
              <div style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>Choose a module:</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {Object.keys(moduleOverviews).map(modName => {
                    const mod = modules.find(m => m.name === modName);
                    return (
                      <button
                        key={modName}
                        onClick={() => setStudyNotesModule(modName)}
                        style={{
                          padding: "12px 14px",
                          background: mod?.bg ?? "#DBEAFE",
                          color: mod?.color ?? "#1D4ED8",
                          border: `1.5px solid ${mod?.color ?? "#1D4ED8"}33`,
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "left",
                        }}
                      >
                        {mod?.icon && <span style={{ marginRight: 6 }}>{mod.icon}</span>}
                        {modName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overview content — shown when a module is selected in modal */}
            {studyNotesModule && moduleOverviews[studyNotesModule] && (
              <div style={{ padding: "0 22px 22px" }}>
                <button
                  onClick={() => setStudyNotesModule(null)}
                  style={{
                    background: "none", border: "none", color: "#0369A1",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    padding: "14px 0 10px", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >← All modules</button>
                <ModuleOverviewPanel
                  key={studyNotesModule + "-modal"}
                  overview={moduleOverviews[studyNotesModule]}
                  moduleName={studyNotesModule}
                  moduleColor={modules.find(m => m.name === studyNotesModule)?.color}
                  moduleBg={modules.find(m => m.name === studyNotesModule)?.bg}
                  moduleIcon={modules.find(m => m.name === studyNotesModule)?.icon}
                  defaultExpanded={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Gate overlay (paywall) — rendered on top of the quiz ── */}
      {gate}
    </div>
  );
}
