// MockExamShell — unified mock exam UI shared by all Ontario and WPI exam pages.
// Full feature parity: ScoreHistory, usePageMeta, stats grid, weakest-first module sort,
// timer colour changes, province selector, report modal, flag/review system.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import PurchaseGate from "@/components/PurchaseGate";
import ReportErrorModal from "@/components/ReportErrorModal";
import ScoreHistory from "@/components/ScoreHistory";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Normalised question shape used internally by the shell */
export interface ExamQuestion {
  id: number;
  module: string;
  /** Question stem text */
  question: string;
  options: string[];
  /** 0-based index of the correct option */
  correct: number;
  explanation?: string;
}

export interface ModuleColorConfig {
  bg: string;
  color: string;
}

export interface ProvinceOption {
  value: string;
  label: string;
  regulator?: string;
}

export type ExamProductKey =
  | "class1" | "wqa" | "oit" | "oit-ww"
  | "class1-water" | "class1-ww" | "class2-water" | "class2-ww"
  | "class3-water" | "class3-ww" | "class4-water" | "class4-ww"
  | "wpi-class1-water" | "wpi-class2-water" | "wpi-class3-water" | "wpi-class4-water"
  | "wpi-class1-wastewater" | "wpi-class2-wastewater" | "wpi-class3-wastewater" | "wpi-class4-wastewater";

export interface MockExamConfig {
  /** Page title shown in intro card, e.g. "Class 2 Water Treatment Mock Exam" */
  title: string;
  /** Short subtitle badge, e.g. "ONTARIO CLASS II · WATER TREATMENT" */
  badge: string;
  /** SEO meta description */
  metaDescription?: string;
  /** SEO keywords */
  metaKeywords?: string;
  /** Number of questions to draw per exam session */
  examQuestions: number;
  /** Duration in seconds */
  examDuration: number;
  /** Pass threshold 0–1, e.g. 0.7 */
  passThreshold: number;
  /** Module name → target question count for proportional sampling */
  moduleTargets: Record<string, number>;
  /** Module name → colour config for badges and progress bars */
  moduleColors: Record<string, ModuleColorConfig>;
  /** Full question pool (all questions in the bank) */
  questionPool: ExamQuestion[];
  /** Stripe / PurchaseGate product key */
  productKey: ExamProductKey;
  /** Human-readable product name for paywall */
  productName: string;
  /** Price in USD cents (displayed as $XX) */
  price: number;
  /** Optional feature bullets for paywall */
  features?: string[];
  /** Path to navigate back to on paywall close */
  backPath?: string;
  /** Path to the practice quiz page (shown in results) */
  practicePath: string;
  /** Label for the practice button, e.g. "Class 2 Water Practice" */
  practiceLabel: string;
  /** Optional formula sheet link */
  formulaPath?: string;
  /** Optional formula sheet label */
  formulaLabel?: string;
  /** Accent colour for the exam (default: Ontario blue #0369A1) */
  accentColor?: string;
  /** Secondary accent (default: #0E7490) */
  accentColor2?: string;
  /** Whether to show the province selector */
  showProvinceSelector?: boolean;
  /** Province options (if showProvinceSelector is true) */
  provinceOptions?: ProvinceOption[];
  /** Current path for SiteNav */
  currentPath: string;
  /** Extra info line shown in intro, e.g. "502 questions · BC (EOCP Level I)" */
  infoLine?: string;
  /** Number of modules shown in stats grid (defaults to moduleTargets count) */
  moduleCount?: number;
  /** Stream for ScoreHistory ("water" | "wastewater") */
  stream?: "water" | "wastewater";
}

interface ExamAnswer {
  questionIndex: number;
  selected: number | null;
}

type ExamState = "intro" | "active" | "results";

// ─── Question selector ────────────────────────────────────────────────────────

function selectExamQuestions(
  pool: ExamQuestion[],
  moduleTargets: Record<string, number>,
  total: number
): ExamQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected: ExamQuestion[] = [];
  const byModule: Record<string, ExamQuestion[]> = {};
  for (const q of shuffled) {
    if (!byModule[q.module]) byModule[q.module] = [];
    byModule[q.module].push(q);
  }
  for (const [mod, target] of Object.entries(moduleTargets)) {
    const available = byModule[mod] ?? [];
    selected.push(...available.slice(0, target));
  }
  const selectedIds = new Set(selected.map(q => q.id));
  const remaining = shuffled.filter(q => !selectedIds.has(q.id));
  while (selected.length < total && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }
  return selected.sort(() => Math.random() - 0.5).slice(0, total);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Province options default ─────────────────────────────────────────────────

const PROVINCE_OPTIONS_DEFAULT: ProvinceOption[] = [
  { value: "Ontario",          label: "🍁 Ontario",          regulator: "OWWCO / MECP" },
  { value: "British Columbia", label: "🏔️ British Columbia", regulator: "EOCP" },
  { value: "Alberta",          label: "🛢️ Alberta",          regulator: "Alberta EPA" },
  { value: "Saskatchewan",     label: "🌾 Saskatchewan" },
  { value: "Manitoba",         label: "🦬 Manitoba" },
  { value: "Quebec",           label: "⚜️ Quebec" },
  { value: "New Brunswick",    label: "🌲 New Brunswick" },
  { value: "Nova Scotia",      label: "⚓ Nova Scotia" },
  { value: "Other",            label: "🇨🇦 Other Province / Territory" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MockExamShell({
  title,
  badge,
  metaDescription,
  metaKeywords,
  examQuestions: EXAM_QUESTIONS,
  examDuration: EXAM_DURATION,
  passThreshold,
  moduleTargets,
  moduleColors,
  questionPool,
  productKey,
  productName,
  price,
  features,
  backPath = "/",
  practicePath,
  practiceLabel,
  formulaPath,
  formulaLabel,
  accentColor = "#0369A1",
  accentColor2 = "#0E7490",
  showProvinceSelector = false,
  provinceOptions = PROVINCE_OPTIONS_DEFAULT,
  currentPath,
  infoLine,
  moduleCount,
  stream,
}: MockExamConfig) {
  const { user } = useAuth();

  usePageMeta({
    title,
    description: metaDescription ?? `${title} — ${EXAM_QUESTIONS} questions, ${Math.round(EXAM_DURATION / 3600)}-hour timer, ${Math.round(passThreshold * 100)}% pass threshold.`,
    keywords: metaKeywords,
    path: currentPath,
  });

  const sessionId = useRef(`mock-${productKey}-${Math.random().toString(36).slice(2)}`).current;

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>(() =>
    typeof localStorage !== "undefined" ? (localStorage.getItem("echelon_province") ?? "Ontario") : "Ontario"
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultSavedRef = useRef(false);
  const saveResult = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    if (showProvinceSelector) {
      try { localStorage.setItem("echelon_province", selectedProvince); } catch {}
    }
    const qs = selectExamQuestions(questionPool, moduleTargets, EXAM_QUESTIONS);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setTimeLeft(EXAM_DURATION);
    setFlagged([]);
    setShowReview(false);
    resultSavedRef.current = false;
    setExamState("active");
  }, [questionPool, moduleTargets, EXAM_QUESTIONS, EXAM_DURATION, showProvinceSelector, selectedProvince]);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamState("results");
  }, []);

  // Timer
  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setExamState("results");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [examState]);

  const results = useMemo(() => {
    if (examState !== "results" || questions.length === 0) return null;
    let correct = 0;
    const moduleBreakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!moduleBreakdown[q.module]) moduleBreakdown[q.module] = { correct: 0, total: 0 };
      moduleBreakdown[q.module].total++;
      if (answers[i]?.selected === q.correct) {
        correct++;
        moduleBreakdown[q.module].correct++;
      }
    });
    const score = correct / EXAM_QUESTIONS;
    const pct = Math.round(score * 100);
    const passed = pct >= Math.round(passThreshold * 100);
    // Sort modules weakest first
    const sortedModules = Object.entries(moduleBreakdown)
      .filter(([, bd]) => bd.total > 0)
      .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total));
    return { correct, score, pct, passed, moduleBreakdown, sortedModules };
  }, [examState, questions, answers, EXAM_QUESTIONS, passThreshold]);

  // Save result once
  useEffect(() => {
    if (examState !== "results" || !results || resultSavedRef.current) return;
    resultSavedRef.current = true;
    saveResult.mutate({
      sessionId,
      examType: productKey,
      score: results.correct,
      total: EXAM_QUESTIONS,
      passed: results.passed,
      timeTakenSeconds: EXAM_DURATION - timeLeft,
      moduleBreakdown: results.moduleBreakdown,
      ...(stream ? { stream } : {}),
    });
  }, [examState, results]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQ = questions[currentIdx];
  const answered = answers.filter(a => a.selected !== null).length;
  const timerColor = timeLeft < 600 ? "#DC2626" : timeLeft < 1800 ? "#D97706" : accentColor;

  const toggleFlag = () => {
    setFlagged(f =>
      f.includes(currentIdx) ? f.filter(i => i !== currentIdx) : [...f, currentIdx]
    );
  };

  // ── INTRO SCREEN ────────────────────────────────────────────────────────────
  if (examState === "intro") {
    return (
      <PurchaseGate
        examType={productKey}
        productKey={productKey}
        productName={productName}
        price={price}
        features={features}
        backPath={backPath}
      >
        <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
          <SiteNav currentPath={currentPath} />
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 20px 80px" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
              {/* Icon + badge */}
              <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>📝</div>
              <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${accentColor}18`, color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>
                {badge}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>{title}</h1>
              {infoLine && <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 24px", lineHeight: 1.6 }}>{infoLine}</p>}

              {/* Province selector */}
              {showProvinceSelector && (
                <div style={{ marginBottom: 24, textAlign: "left" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR PROVINCE</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {provinceOptions.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setSelectedProvince(p.value)}
                        style={{
                          padding: "7px 12px", borderRadius: 20,
                          border: `2px solid ${selectedProvince === p.value ? accentColor : "#E2E8F0"}`,
                          background: selectedProvince === p.value ? `${accentColor}12` : "#F8FAFC",
                          color: selectedProvince === p.value ? accentColor : "#64748B",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        {p.label}
                        {p.regulator && selectedProvince === p.value && (
                          <span style={{ marginLeft: 4, opacity: 0.7, fontWeight: 500 }}>· {p.regulator}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedProvince !== "Ontario" && (
                    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: 12, color: "#92400E" }}>
                      📌 The question bank is currently optimised for Ontario. Province-specific content for {selectedProvince} is coming soon.
                    </div>
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "📝", label: "Questions",  value: `${EXAM_QUESTIONS} MCQ` },
                  { icon: "⏱️", label: "Time Limit", value: `${Math.round(EXAM_DURATION / 3600)} Hour${EXAM_DURATION >= 7200 ? "s" : ""}` },
                  { icon: "🎯", label: "Pass Mark",  value: `${Math.round(passThreshold * 100)}% (${Math.round(passThreshold * EXAM_QUESTIONS)}/${EXAM_QUESTIONS})` },
                  { icon: "📊", label: "Modules",    value: `${moduleCount ?? Object.keys(moduleTargets).length} Topics` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ padding: "14px 16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Module distribution */}
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", marginBottom: 28, textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 10 }}>EXAM DISTRIBUTION</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(moduleTargets).map(([mod, n]) => (
                    <span key={mod} style={{ padding: "3px 8px", borderRadius: 20, background: moduleColors[mod]?.bg ?? "#E0F2FE", color: moduleColors[mod]?.color ?? accentColor, fontSize: 10, fontWeight: 600 }}>
                      {mod}: {n}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={startExam}
                style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})`, color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                🚀 Start Exam
              </button>
              <div style={{ marginTop: 16 }}>
                <Link href={practicePath} style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>
                  &laquo; Back to {practiceLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PurchaseGate>
    );
  }

  // ── RESULTS SCREEN ──────────────────────────────────────────────────────────
  if (examState === "results" && results) {
    const { correct, pct, passed, sortedModules } = results;
    const skipped = answers.filter(a => a.selected === null).length;
    const incorrect = EXAM_QUESTIONS - correct - skipped;
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath={currentPath} />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 80px" }}>
          {/* Score hero */}
          <div style={{
            background: passed
              ? `linear-gradient(135deg, ${accentColor}, ${accentColor2})`
              : "linear-gradient(135deg, #DC2626, #9B1C1C)",
            borderRadius: 20, padding: "36px 32px", textAlign: "center", color: "#fff",
            marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>{passed ? "🎉" : "📚"}</div>
            <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 4 }}>{pct}%</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{passed ? "PASSED" : "NOT YET"}</div>
            <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 24 }}>
              {correct} / {EXAM_QUESTIONS} correct · {passed ? `You met the ${Math.round(passThreshold * 100)}% pass threshold` : `${Math.round(passThreshold * 100)}% required to pass`}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { resultSavedRef.current = false; startExam(); }}
                style={{ padding: "12px 28px", borderRadius: 10, background: "rgba(255,255,255,0.2)", color: "#fff", border: "2px solid rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                🔄 Retake Exam
              </button>
              <button
                onClick={() => setShowReview(v => !v)}
                style={{ padding: "12px 28px", borderRadius: 10, background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                {showReview ? "Hide" : "Review"} Answers
              </button>
              <Link href={practicePath}>
                <button style={{ padding: "12px 28px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#fff", border: "2px solid rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  📝 Practice Mode
                </button>
              </Link>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Correct",   value: correct,   color: "#059669", bg: "#DCFCE7" },
              { label: "Incorrect", value: incorrect, color: "#DC2626", bg: "#FEE2E2" },
              { label: "Skipped",   value: skipped,   color: "#D97706", bg: "#FEF9C3" },
              { label: "Flagged",   value: flagged.length, color: "#7C3AED", bg: "#EDE9FE" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Score history */}
          <ScoreHistory sessionId={sessionId} examType={productKey} stream={stream} />

          {/* Module breakdown — weakest first */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>📊 Module Breakdown (Weakest First)</div>
            {sortedModules.map(([module, bd]) => {
              const modPct = bd.total > 0 ? bd.correct / bd.total : 0;
              const barColor = modPct >= 0.7 ? "#22C55E" : modPct >= 0.5 ? "#F59E0B" : "#EF4444";
              const ms = moduleColors[module] ?? { bg: "#F1F5F9", color: "#475569" };
              return (
                <div key={module} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ms.color }}>{module}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{bd.correct}/{bd.total} ({Math.round(modPct * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${modPct * 100}%`, background: barColor, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Question review */}
          {showReview && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Question Review</div>
              {questions.map((q, i) => {
                const a = answers[i];
                const isCorrect = a?.selected === q.correct;
                const wasSkipped = a?.selected === null;
                return (
                  <div key={q.id} style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, background: wasSkipped ? "#FFF7ED" : isCorrect ? "#F0FDF4" : "#FFF1F2", border: `1px solid ${wasSkipped ? "#FED7AA" : isCorrect ? "#BBF7D0" : "#FECDD3"}` }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{wasSkipped ? "⏭️" : isCorrect ? "✅" : "❌"}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.5 }}>Q{i + 1}. {q.question}</div>
                    </div>
                    {!wasSkipped && !isCorrect && (
                      <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 4 }}>Your answer: {q.options[a.selected!]}</div>
                    )}
                    <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginBottom: q.explanation ? 4 : 0 }}>✓ {q.options[q.correct]}</div>
                    {q.explanation && (
                      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, whiteSpace: "pre-line" }}>{q.explanation}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Formula link */}
          {formulaPath && formulaLabel && (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Link href={formulaPath} target="_blank" style={{ fontSize: 13, color: accentColor, fontWeight: 600, textDecoration: "none" }}>
                📐 {formulaLabel} →
              </Link>
            </div>
          )}
        </div>
        {reportModal && (
          <ReportErrorModal
            questionId={reportModal.id}
            questionText={reportModal.text}
            module={reportModal.module}
            onClose={() => setReportModal(null)}
          />
        )}
      </div>
    );
  }

  // ── ACTIVE EXAM SCREEN ──────────────────────────────────────────────────────
  if (!currentQ) return null;
  const isFlagged = flagged.includes(currentIdx);
  const isLastQ = currentIdx === questions.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath={currentPath} />
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
            Q{currentIdx + 1} / {questions.length}
            <span style={{ marginLeft: 12, fontSize: 12, color: "#64748B", fontWeight: 500 }}>
              {answered} answered · {flagged.length} flagged
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => { if (window.confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
              style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              Submit ✓
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px", display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, alignItems: "start" }}>
        {/* Question card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {/* Module badge */}
          <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: moduleColors[currentQ.module]?.bg ?? "#E0F2FE", color: moduleColors[currentQ.module]?.color ?? accentColor, fontSize: 11, fontWeight: 700, marginBottom: 16 }}>
            {currentQ.module}
          </div>
          {/* Question text */}
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.6, marginBottom: 24 }}>
            {currentQ.question}
          </div>
          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentIdx]?.selected === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers(prev => prev.map((a, idx) => idx === currentIdx ? { ...a, selected: i } : a))}
                  style={{
                    padding: "14px 18px", borderRadius: 12, textAlign: "left",
                    border: `2px solid ${isSelected ? accentColor : "#E2E8F0"}`,
                    background: isSelected ? `${accentColor}10` : "#F8FAFC",
                    color: "#0F172A", fontSize: 14, fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span style={{ marginRight: 10, fontWeight: 800, color: isSelected ? accentColor : "#94A3B8" }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: currentIdx === 0 ? "#CBD5E1" : "#0F172A", fontWeight: 700, fontSize: 14, cursor: currentIdx === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              &laquo; Prev
            </button>
            <button
              onClick={toggleFlag}
              style={{ padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${isFlagged ? "#D97706" : "#E2E8F0"}`, background: isFlagged ? "#FEF9C3" : "#fff", color: isFlagged ? "#A16207" : "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              {isFlagged ? "🚩 Flagged" : "🚩 Flag"}
            </button>
            <button
              onClick={() => setReportModal({ id: currentQ.id, text: currentQ.question, module: currentQ.module })}
              style={{ padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: "#94A3B8", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              title="Report an error"
            >
              ⚑
            </button>
            {isLastQ ? (
              <button
                onClick={() => { if (window.confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
                style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >
                Submit Exam ✓
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: accentColor, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >
                Next &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky", top: 70 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 10 }}>QUESTION NAVIGATOR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
            {questions.map((_, i) => {
              const isAnswered = answers[i]?.selected !== null;
              const isFlaggedQ = flagged.includes(i);
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    padding: "6px 0", borderRadius: 6,
                    border: isCurrent ? `2px solid ${accentColor}` : "1px solid #E2E8F0",
                    background: isCurrent ? `${accentColor}18` : isFlaggedQ ? "#FEF9C3" : isAnswered ? "#DCFCE7" : "#F8FAFC",
                    color: isCurrent ? accentColor : isFlaggedQ ? "#A16207" : isAnswered ? "#15803D" : "#94A3B8",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { color: "#DCFCE7", textColor: "#15803D", label: "Answered" },
              { color: "#FEF9C3", textColor: "#A16207", label: "Flagged" },
              { color: "#F8FAFC", textColor: "#94A3B8", label: "Unanswered" },
            ].map(({ color, textColor, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: "1px solid #E2E8F0" }} />
                <span style={{ fontSize: 10, color: textColor, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { if (window.confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
            style={{ width: "100%", marginTop: 14, padding: "10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})`, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Submit Exam ✓
          </button>
        </div>
      </div>

      {reportModal && (
        <ReportErrorModal
          questionId={reportModal.id}
          questionText={reportModal.text}
          module={reportModal.module}
          onClose={() => setReportModal(null)}
        />
      )}
    </div>
  );
}
