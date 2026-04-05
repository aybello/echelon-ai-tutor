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

import { useState, type ReactNode } from "react";
import SiteNav from "@/components/SiteNav";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import StepSolution from "@/components/StepSolution";
import ReportErrorModal from "@/components/ReportErrorModal";
import { Link } from "wouter";

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
}: QuizShellProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const progress = sessionSize ? (history.length / sessionSize) * 100 : 0;
  const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : null;

  // ── Session complete screen ────────────────────────────────────────────────
  if (!current && history.length > 0) {
    const pct = Math.round((correctCount / history.length) * 100);
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath={currentPath} />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "40px 36px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}>
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
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
      `}</style>

      <SiteNav currentPath={currentPath} />

      {/* ── Header ── */}
      <div style={{ background: headerGradient, color: "#fff", padding: "20px 16px 16px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Top row: title + action buttons */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {headerIcon && (
                <div style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontSize: 18,
                  lineHeight: 1,
                }}>
                  {headerIcon}
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", opacity: 0.75, textTransform: "uppercase", marginBottom: 2 }}>
                  {courseLabel}
                </div>
                <h1 style={{ margin: 0, fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 900, letterSpacing: "-0.3px" }}>
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
            {headerActions.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {headerActions.map(a => (
                  <Link key={a.href} href={a.href}>
                    <button style={{
                      padding: "7px 12px",
                      background: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                      {a.label}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { label: "Answered", value: history.length },
              { label: "Correct", value: correctCount },
              { label: "Accuracy", value: `${accuracy ?? 0}%` },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "5px 12px",
                textAlign: "center",
                minWidth: 56,
              }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 9, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}

            {/* Module filter toggle */}
            {modules.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: 4 }}>
                <button
                  onClick={() => onModuleChange(null)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "1.5px solid",
                    borderColor: selectedModule === null ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    background: selectedModule === null ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  All Modules
                </button>
                {modules.map(m => (
                  <button
                    key={m.name}
                    onClick={() => onModuleChange(selectedModule === m.name ? null : m.name)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      border: "1.5px solid",
                      borderColor: selectedModule === m.name ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                      background: selectedModule === m.name ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {m.icon && <span style={{ marginRight: 4 }}>{m.icon}</span>}
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            {/* Calc Only toggle */}
            {hasCalcOnly && (
              <button
                onClick={onCalcOnlyToggle}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1.5px solid",
                  borderColor: calcOnly ? "rgba(167,139,250,0.9)" : "rgba(255,255,255,0.3)",
                  background: calcOnly ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                🧮 Calc Only
              </button>
            )}
          </div>
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

      {/* ── Body ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Question card */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "24px 24px 20px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          marginBottom: 12,
          animation: "fadeUp 0.2s ease",
        }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
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
            <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>
              Q{history.length + 1}
            </span>
          </div>

          {/* Question text */}
          <p style={{
            fontSize: "clamp(14px, 2.5vw, 16px)",
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.6,
            margin: "0 0 18px",
          }}>
            {current.question}
          </p>

          {/* Answer options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {(current.options as string[]).map((opt: string, idx: number) => {
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
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1.5px solid ${border}`,
                    background: bg,
                    color,
                    fontSize: 14,
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
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* ← Prev (always show if history exists) */}
            {history.length > 0 && (
              <button
                onClick={onGoBack}
                style={{
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "1.5px solid #E2E8F0",
                  background: "#fff",
                  color: "#64748B",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
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
                  padding: "11px 20px",
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
                }}
              >
                Confirm Answer
              </button>
            ) : (
              <>
                <button
                  onClick={onNext}
                  style={{
                    flex: 1,
                    padding: "11px 20px",
                    borderRadius: 10,
                    background: headerGradient,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    minWidth: 130,
                  }}
                >
                  Next Question →
                </button>
                {current.steps && current.steps.length > 0 && (
                  <button
                    onClick={onToggleSteps}
                    style={{
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #E2E8F0",
                      background: showSteps ? "#EFF6FF" : "#fff",
                      color: showSteps ? "#0369A1" : "#64748B",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {showSteps ? "Hide Steps" : "Show Steps"}
                  </button>
                )}
                <button
                  onClick={onTutorOpen}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #E2E8F0",
                    background: "#fff",
                    color: "#0F172A",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  🤖 AI Tutor
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Explanation box ── */}
        {confirmed && (
          <div style={{
            background: selected === correctIdx ? "#F0FDF4" : "#FFF7ED",
            border: `1px solid ${selected === correctIdx ? "#BBF7D0" : "#FED7AA"}`,
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 12,
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

            <button
              onClick={() => setReportModalOpen(true)}
              style={{
                display: "block",
                marginTop: 10,
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

      {/* ── AI Tutor drawer ── */}
      {tutorOpen && renderAITutor && renderAITutor()}

      {/* ── Report Error modal ── */}
      {reportModalOpen && current && (
        <ReportErrorModal
          questionId={current.id ?? 0}
          questionText={current.question}
          module={current.module ?? ""}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}
