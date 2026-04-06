// WPI CLASS IV WATER TREATMENT MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold
// Used for: BC (EOCP Level I), Alberta (AWWOA Class I), Saskatchewan, Manitoba

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  wpiClass4WaterQuestions,
  WPI_CLASS4_WATER_MODULES,
  type WpiClass4WaterQuestion,
} from "@/lib/wpiClass4WaterQuestions";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import PurchaseGate from "@/components/PurchaseGate";
import { trpc } from "@/lib/trpc";
import ScoreHistory from "@/components/ScoreHistory";

const EXAM_DURATION  = 2 * 60 * 60; // 2 hours in seconds
const EXAM_QUESTIONS = 100;
const PASS_THRESHOLD = 0.7;

type ExamState = "intro" | "active" | "results";
interface ExamAnswer { questionIndex: number; selected: number | null; }

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Plant Management & Leadership":                { bg: "#CCFBF1", color: "#0F766E" },
  "Emergency Response & Contingency Planning":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Advanced Process Control":                     { bg: "#DBEAFE", color: "#1D4ED8" },
  "Regulatory Compliance & Reporting":            { bg: "#FFEDD5", color: "#C2410C" },
  "Advanced Water Quality":                       { bg: "#DCFCE7", color: "#15803D" },
};

// WPI Class IV exam blueprint: proportional module targets
// Plant Management ~32%, Emergency Response ~20%, Advanced Process Control ~20%, Regulatory ~18%, Water Quality ~10%
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Plant Management & Leadership":                32,
  "Emergency Response & Contingency Planning":    20,
  "Advanced Process Control":                     20,
  "Regulatory Compliance & Reporting":            18,
  "Advanced Water Quality":                       10,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam(): WpiClass4WaterQuestion[] {
  const selected: WpiClass4WaterQuestion[] = [];
  for (const [module, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const pool = shuffle(wpiClass4WaterQuestions.filter((q) => q.module === module));
    selected.push(...pool.slice(0, target));
  }
  return shuffle(selected);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WpiClass4WaterMockExam() {
  usePageMeta({
    title: "WPI Class IV Water Treatment Mock Exam — 100 Questions",
    description:
      "Timed 100-question mock exam for the WPI Class IV Water Treatment certification. BC EOCP Level I, Alberta AWWOA Class I, Saskatchewan, Manitoba. 2-hour timer, 70% pass threshold.",
    path: "/wpi-class4-water-mock",
    keywords:
      "WPI Class IV mock exam, BC EOCP Level IV exam, Alberta AWWOA Class IV exam, water treatment mock exam, WPI practice exam",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<WpiClass4WaterQuestion[]>([]);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveScore = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    const qs = buildExam();
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setFlagged(new Set());
    setShowReview(false);
    setExamState("active");
  }, []);

  // Timer
  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
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

  function handleAnswer(idx: number) {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIdx ? { ...a, selected: idx } : a))
    );
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  }

  function submitExam() {
    clearInterval(timerRef.current!);
    const score = answers.filter(
      (a, i) => a.selected === questions[i]?.correctAnswer
    ).length;
    saveScore.mutate({
      examType: "wpi-class4-water",
      score,
      total: EXAM_QUESTIONS,
      passed: score / EXAM_QUESTIONS >= PASS_THRESHOLD,
      timeTakenSeconds: EXAM_DURATION - timeLeft,
      sessionId: "wpi-class4-water",
      stream: "water",
    });
    setExamState("results");
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (examState !== "results") return null;
    const correct = answers.filter((a, i) => a.selected === questions[i]?.correctAnswer).length;
    const pct = correct / EXAM_QUESTIONS;
    const passed = pct >= PASS_THRESHOLD;

    const byModule: Record<string, { correct: number; total: number }> = {};
    for (const m of WPI_CLASS4_WATER_MODULES) byModule[m] = { correct: 0, total: 0 };
    answers.forEach((a, i) => {
      const q = questions[i];
      if (!q) return;
      if (!byModule[q.module]) byModule[q.module] = { correct: 0, total: 0 };
      byModule[q.module].total++;
      if (a.selected === q.correctAnswer) byModule[q.module].correct++;
    });

    return { correct, pct, passed, byModule };
  }, [examState, answers, questions]);

  // ── Intro screen ─────────────────────────────────────────────────────────────
  if (examState === "intro") {
    return (
      <PurchaseGate
      backPath="/wpi"
        examType="wpi-class4-water"
        productKey="wpi-class4-water"
        productName="WPI Class IV Water Treatment Practice Pass"
        price={149}
        features={[
          "592 WPI Class IV questions — unlimited practice",
          "Timed mock exam (100 questions, 2 hrs)",
          "Module-by-module performance breakdown",
          "AI Tutor explanations on every question",
        ]}
      >
        <div
          style={{
            fontFamily: "Sora, Nunito, sans-serif",
            background: "#F8FAFC",
            minHeight: "100vh",
          }}
        >
          <SiteNav currentPath="/wpi-class4-water-mock" />
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #E2E8F0",
                padding: "48px 40px",
                textAlign: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div
                style={{
                  display: "inline-block",
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "4px 14px",
                  borderRadius: 20,
                  marginBottom: 16,
                  textTransform: "uppercase",
                }}
              >
                WPI Class IV · Water Treatment
              </div>
              <h1
                style={{
                  fontSize: "clamp(22px, 4vw, 32px)",
                  fontWeight: 900,
                  color: "#0F172A",
                  margin: "0 0 12px",
                  letterSpacing: "-0.5px",
                }}
              >
                Mock Exam
              </h1>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, margin: "0 0 32px" }}>
                100 questions · 2-hour time limit · 70% to pass
                <br />
                BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                  marginBottom: 32,
                  textAlign: "left",
                }}
              >
                {Object.entries(EXAM_MODULE_TARGETS).map(([module, count]) => {
                  const mc = MODULE_COLORS[module] ?? { bg: "#F1F5F9", color: "#475569" };
                  return (
                    <div
                      key={module}
                      style={{
                        background: mc.bg,
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: mc.color, marginBottom: 4 }}>
                        {module}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{count}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>questions</div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={startExam}
                style={{
                  padding: "16px 48px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff",
                  border: "none",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "-0.2px",
                }}
              >
                Start Exam →
              </button>

              <div style={{ marginTop: 20 }}>
                <Link href="/wpi-class4-water">
                  <span style={{ fontSize: 13, color: "#64748B", cursor: "pointer" }}>
                    ← Back to Practice Quiz
                  </span>
                </Link>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <ScoreHistory examType="wpi-class4-water" sessionId="wpi-class4-water" />
            </div>
          </div>
        </div>
      </PurchaseGate>
    );
  }

  // ── Active exam ──────────────────────────────────────────────────────────────
  if (examState === "active") {
    const q = questions[currentIdx];
    const answered = answers.filter((a) => a.selected !== null).length;
    const timeWarning = timeLeft < 600; // < 10 min

    return (
      <div
        style={{
          fontFamily: "Sora, Nunito, sans-serif",
          background: "#F8FAFC",
          minHeight: "100vh",
        }}
      >
        {/* ── Exam header ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "#0F172A",
            padding: "0 24px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
            WPI Class IV Water Treatment Mock Exam
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#94A3B8" }}>
              {answered}/{EXAM_QUESTIONS} answered
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: timeWarning ? "#F87171" : "#34D399",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setShowReview(!showReview)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Review
            </button>
            <button
              onClick={submitExam}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Submit
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 16px 80px" }}>
          {/* ── Review panel ── */}
          {showReview && (
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                padding: "20px",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
                Question Navigator
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {questions.map((_, i) => {
                  const ans = answers[i];
                  const isCurrent = i === currentIdx;
                  const isAnswered = ans?.selected !== null;
                  const isFlagged = flagged.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => { setCurrentIdx(i); setShowReview(false); }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: isCurrent ? "2px solid #1D4ED8" : "1px solid #E2E8F0",
                        background: isFlagged ? "#FEF9C3" : isAnswered ? "#DCFCE7" : "#F8FAFC",
                        color: isCurrent ? "#1D4ED8" : "#0F172A",
                        fontSize: 12,
                        fontWeight: isCurrent ? 800 : 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#64748B" }}>
                <span>🟢 Answered</span>
                <span>🟡 Flagged</span>
                <span>⬜ Unanswered</span>
              </div>
            </div>
          )}

          {/* ── Question ── */}
          {q && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                padding: "28px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span
                  style={{
                    background: MODULE_COLORS[q.module]?.bg ?? "#F1F5F9",
                    color: MODULE_COLORS[q.module]?.color ?? "#475569",
                    borderRadius: 20,
                    padding: "3px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {q.module}
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>
                    Q{currentIdx + 1} / {EXAM_QUESTIONS}
                  </span>
                  <button
                    onClick={toggleFlag}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: flagged.has(currentIdx) ? "#FEF9C3" : "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      color: flagged.has(currentIdx) ? "#A16207" : "#94A3B8",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {flagged.has(currentIdx) ? "🚩 Flagged" : "⚑ Flag"}
                  </button>
                </div>
              </div>

              <p
                style={{
                  fontSize: "clamp(15px, 2.5vw, 17px)",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.55,
                  margin: "0 0 20px",
                }}
              >
                {q.text}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, idx) => {
                  const isSelected = answers[currentIdx]?.selected === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      style={{
                        padding: "13px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${isSelected ? "#93C5FD" : "#E2E8F0"}`,
                        background: isSelected ? "#EFF6FF" : "#F8FAFC",
                        color: isSelected ? "#1D4ED8" : "#0F172A",
                        fontSize: 14,
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        lineHeight: 1.45,
                        transition: "all 0.1s",
                      }}
                    >
                      <span style={{ opacity: 0.5, marginRight: 8, fontSize: 12 }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "1.5px solid #E2E8F0",
                    background: "#fff",
                    color: currentIdx === 0 ? "#CBD5E1" : "#0F172A",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ← Previous
                </button>
                {currentIdx < EXAM_QUESTIONS - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((i) => Math.min(EXAM_QUESTIONS - 1, i + 1))}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                      color: "#fff",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitExam}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #059669, #0F766E)",
                      color: "#fff",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Submit Exam ✓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────────
  if (examState === "results" && results) {
    return (
      <div
        style={{
          fontFamily: "Sora, Nunito, sans-serif",
          background: "#F8FAFC",
          minHeight: "100vh",
        }}
      >
        <SiteNav currentPath="/wpi-class4-water-mock" />
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
          {/* Score card */}
          <div
            style={{
              background: results.passed
                ? "linear-gradient(135deg, #DCFCE7, #F0FDF4)"
                : "linear-gradient(135deg, #FEE2E2, #FFF7ED)",
              borderRadius: 20,
              border: `1px solid ${results.passed ? "#BBF7D0" : "#FCA5A5"}`,
              padding: "40px 32px",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {results.passed ? "🎉" : "📚"}
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 900,
                color: "#0F172A",
                margin: "0 0 8px",
                letterSpacing: "-1px",
              }}
            >
              {Math.round(results.pct * 100)}%
            </h1>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: results.passed ? "#15803D" : "#B91C1C",
                marginBottom: 8,
              }}
            >
              {results.passed ? "PASS" : "NOT YET PASSED"}
            </div>
            <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
              {results.correct} / {EXAM_QUESTIONS} correct · Pass threshold: 70%
            </p>
          </div>

          {/* Module breakdown */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              padding: "24px",
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>
              Module Breakdown
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {WPI_CLASS4_WATER_MODULES.filter((module) => (results.byModule[module]?.total ?? 0) > 0).map((module) => {
                const stat = results.byModule[module] ?? { correct: 0, total: 0 };
                const pct = stat.total > 0 ? stat.correct / stat.total : 0;
                const mc = MODULE_COLORS[module] ?? { bg: "#F1F5F9", color: "#475569" };
                return (
                  <div key={module}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#0F172A" }}>{module}</span>
                      <span style={{ color: pct >= 0.7 ? "#15803D" : "#B91C1C", fontWeight: 700 }}>
                        {stat.correct}/{stat.total} ({Math.round(pct * 100)}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "#F1F5F9",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct * 100}%`,
                          background: pct >= 0.7 ? "#22C55E" : "#F87171",
                          borderRadius: 4,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={startExam}
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: 12,
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                minWidth: 160,
              }}
            >
              Retake Exam
            </button>
            <Link href="/wpi-class4-water">
              <button
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 12,
                  background: "#fff",
                  color: "#0F172A",
                  border: "1.5px solid #E2E8F0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  minWidth: 160,
                }}
              >
                ← Practice Quiz
              </button>
            </Link>
          </div>

          <div style={{ marginTop: 24 }}>
              <ScoreHistory examType="wpi-class4-water" sessionId="wpi-class4-water" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
