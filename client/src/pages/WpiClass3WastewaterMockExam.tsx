// WPI CLASS III WASTEWATER TREATMENT MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold
// Used for: BC (EOCP Level III), Alberta (AWWOA Class III), Saskatchewan, Manitoba
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  wpiClass3WastewaterQuestions,
  WPI_CLASS3_WASTEWATER_MODULES,
  type WpiClass3WastewaterQuestion,
} from "@/lib/wpiClass3WastewaterQuestions";
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
  "Advanced Biological Treatment":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Biological Nutrient Removal":           { bg: "#DCFCE7", color: "#15803D" },
  "Membrane Bioreactors & Advanced Processes": { bg: "#EDE9FE", color: "#6D28D9" },
  "Industrial Pretreatment & Toxicity":    { bg: "#FEE2E2", color: "#B91C1C" },
  "Advanced Biosolids Management":         { bg: "#CCFBF1", color: "#0F766E" },
  "Regulatory Compliance & Reporting":     { bg: "#FEF9C3", color: "#A16207" },
  "Advanced Process Control & Troubleshooting": { bg: "#FFEDD5", color: "#C2410C" },
  "Health, Safety & Environmental Management": { bg: "#F1F5F9", color: "#475569" },
};

// Exam blueprint — proportional module targets (total = 100)
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Advanced Biological Treatment":         17,
  "Biological Nutrient Removal":           17,
  "Membrane Bioreactors & Advanced Processes": 6,
  "Industrial Pretreatment & Toxicity":    11,
  "Advanced Biosolids Management":         17,
  "Regulatory Compliance & Reporting":     10,
  "Advanced Process Control & Troubleshooting": 6,
  "Health, Safety & Environmental Management": 16,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam(): WpiClass3WastewaterQuestion[] {
  const selected: WpiClass3WastewaterQuestion[] = [];
  for (const [module, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const pool = shuffle(wpiClass3WastewaterQuestions.filter((q) => q.module === module));
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

export default function WpiClass3WastewaterMockExam() {
  usePageMeta({
    title: "WPI Class III Wastewater Treatment Mock Exam — 100 Questions, 2 Hours",
    description:
      "Simulate the WPI Class III Wastewater Treatment exam with a 100-question, 2-hour timed mock exam. Covers BNR, biosolids, industrial pretreatment, advanced processes, and regulatory compliance. 70% pass threshold.",
    path: "/wpi-class3-wastewater-mock",
    keywords:
      "WPI Class III wastewater mock exam, BC EOCP Level III, Alberta AWWOA Class III, timed practice exam, BNR, biosolids, industrial pretreatment",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<WpiClass3WastewaterQuestion[]>([]);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveScore = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    const qs = buildExam();
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIndex(0);
    setTimeLeft(EXAM_DURATION);
    setExamState("active");
  }, []);

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamState("results");
    const score = answers.filter((a, i) => a.selected === questions[i]?.correctAnswer).length;
    saveScore.mutate({
      sessionId: "wpi-class3-wastewater",
      examType: "wpi-class3-wastewater",
      score,
      total: EXAM_QUESTIONS,
      passed: score / EXAM_QUESTIONS >= PASS_THRESHOLD,
    });
  }, [answers, questions, saveScore]);

  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, submitExam]);

  const score = useMemo(
    () => answers.filter((a, i) => a.selected === questions[i]?.correctAnswer).length,
    [answers, questions]
  );
  const pct = questions.length > 0 ? Math.round((score / EXAM_QUESTIONS) * 100) : 0;
  const passed = pct >= PASS_THRESHOLD * 100;

  const moduleBreakdown = useMemo(() => {
    const breakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!breakdown[q.module]) breakdown[q.module] = { correct: 0, total: 0 };
      breakdown[q.module].total++;
      if (answers[i]?.selected === q.correctAnswer) breakdown[q.module].correct++;
    });
    return breakdown;
  }, [questions, answers]);

  const answeredCount = answers.filter((a) => a.selected !== null).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/wpi-class3-wastewater-mock" />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 80px" }}>
        <PurchaseGate
      backPath="/wpi"
          examType="wpi-class3-wastewater"
          productKey="wpi-class3-wastewater"
          productName="WPI Class III Wastewater Practice Pass"
          price={99}
        >
          {/* ── INTRO ── */}
          {examState === "intro" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <Link href="/wpi-class3-wastewater">
                  <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                    ← Practice Quiz
                  </button>
                </Link>
              </div>
              <div style={{
                background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0",
                padding: "40px 32px", textAlign: "center", marginBottom: 24,
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>♻️</div>
                <h1 style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 900,
                  color: "#0F172A", margin: "0 0 8px",
                }}>
                  WPI Class III Wastewater Mock Exam
                </h1>
                <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 32px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                  Simulate the real WPI Class III exam. 100 questions drawn proportionally from all 8 modules. 2-hour time limit. 70% to pass.
                </p>
                <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
                  {[
                    { label: "Questions", value: "100" },
                    { label: "Time Limit", value: "2:00:00" },
                    { label: "Pass Mark", value: "70%" },
                    { label: "Question Bank", value: "501" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#0F766E" }}>{value}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={startExam}
                  style={{
                    padding: "14px 48px", borderRadius: 12,
                    background: "linear-gradient(135deg, #0F766E, #0891B2)",
                    color: "#fff", border: "none", fontSize: 16, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Start Exam →
                </button>
              </div>

              {/* Module breakdown preview */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "24px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>
                  Exam Blueprint
                </h3>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {Object.entries(EXAM_MODULE_TARGETS).map(([mod, count]) => {
                    const mc = MODULE_COLORS[mod] ?? { bg: "#F1F5F9", color: "#475569" };
                    return (
                      <div key={mod} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, color: "#374151", flex: 1, fontWeight: 500 }}>{mod}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: mc.color, background: mc.bg, padding: "2px 10px", borderRadius: 20 }}>
                          {count} questions
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score history */}
              <div style={{ marginTop: 24 }}>
                <ScoreHistory examType="wpi-class3-wastewater" sessionId="wpi-class3-wastewater" />
              </div>
            </div>
          )}

          {/* ── ACTIVE EXAM ── */}
          {examState === "active" && questions.length > 0 && (
            <div>
              {/* Timer bar */}
              <div style={{
                position: "sticky" as const, top: 0, zIndex: 10,
                background: "#fff", borderBottom: "1px solid #E2E8F0",
                padding: "12px 16px", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderRadius: "0 0 12px 12px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Q {currentIndex + 1} / {EXAM_QUESTIONS}
                  <span style={{ color: "#94A3B8", marginLeft: 8 }}>
                    ({answeredCount} answered)
                  </span>
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 800,
                  color: timeLeft < 600 ? "#DC2626" : "#0F766E",
                  fontFamily: "'Sora', sans-serif",
                }}>
                  ⏱ {formatTime(timeLeft)}
                </div>
                <button
                  onClick={submitExam}
                  style={{
                    padding: "8px 16px", borderRadius: 8,
                    background: "#0F766E", color: "#fff",
                    border: "none", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Submit
                </button>
              </div>

              {/* Progress */}
              <div style={{ height: 4, background: "#E2E8F0", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${((currentIndex + 1) / EXAM_QUESTIONS) * 100}%`,
                  background: "linear-gradient(90deg, #0F766E, #0891B2)",
                  borderRadius: 2, transition: "width 0.3s",
                }} />
              </div>

              {/* Question */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "28px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                    letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 20,
                    background: (MODULE_COLORS[questions[currentIndex].module] ?? { bg: "#F1F5F9" }).bg,
                    color: (MODULE_COLORS[questions[currentIndex].module] ?? { color: "#475569" }).color,
                  }}>
                    {questions[currentIndex].module}
                  </span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", lineHeight: 1.6, margin: "0 0 20px" }}>
                  {questions[currentIndex].text}
                </p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  {questions[currentIndex].options.map((opt, i) => {
                    const isSelected = answers[currentIndex]?.selected === i;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[currentIndex] = { ...next[currentIndex], selected: i };
                            return next;
                          });
                        }}
                        style={{
                          padding: "12px 16px", borderRadius: 10,
                          border: `1.5px solid ${isSelected ? "#0F766E" : "#E2E8F0"}`,
                          background: isSelected ? "#F0FDFA" : "#F8FAFC",
                          color: isSelected ? "#0F766E" : "#0F172A",
                          fontSize: 14, fontWeight: isSelected ? 600 : 400,
                          cursor: "pointer", textAlign: "left" as const,
                          fontFamily: "inherit", lineHeight: 1.5, transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  style={{
                    padding: "10px 20px", borderRadius: 10, background: "#fff",
                    color: "#374151", border: "1.5px solid #E2E8F0", fontSize: 13,
                    fontWeight: 600, cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    opacity: currentIndex === 0 ? 0.4 : 1, fontFamily: "inherit",
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => {
                    if (currentIndex < EXAM_QUESTIONS - 1) setCurrentIndex((i) => i + 1);
                    else submitExam();
                  }}
                  style={{
                    padding: "10px 20px", borderRadius: 10,
                    background: "linear-gradient(135deg, #0F766E, #0891B2)",
                    color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {currentIndex < EXAM_QUESTIONS - 1 ? "Next →" : "Submit Exam →"}
                </button>
              </div>

              {/* Question grid */}
              <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "20px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 12 }}>
                  Question Navigator ({answeredCount}/{EXAM_QUESTIONS} answered)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: "1.5px solid",
                        borderColor: i === currentIndex ? "#0F766E" : answers[i]?.selected !== null ? "#0F766E" : "#E2E8F0",
                        background: i === currentIndex ? "#0F766E" : answers[i]?.selected !== null ? "#F0FDFA" : "#F8FAFC",
                        color: i === currentIndex ? "#fff" : answers[i]?.selected !== null ? "#0F766E" : "#94A3B8",
                        fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {examState === "results" && (
            <div>
              <div style={{
                background: passed ? "linear-gradient(135deg, #F0FDF4, #ECFEFF)" : "linear-gradient(135deg, #FFF7ED, #FEF2F2)",
                border: `2px solid ${passed ? "#86EFAC" : "#FCA5A5"}`,
                borderRadius: 20, padding: "40px 32px", textAlign: "center", marginBottom: 24,
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>{passed ? "🎉" : "📚"}</div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>
                  {passed ? "Exam Passed!" : "Keep Studying"}
                </h2>
                <div style={{ fontSize: 48, fontWeight: 900, color: passed ? "#0F766E" : "#DC2626", margin: "16px 0 8px" }}>
                  {pct}%
                </div>
                <div style={{ fontSize: 15, color: "#64748B", marginBottom: 24 }}>
                  {score} / {EXAM_QUESTIONS} correct · {passed ? "Pass" : "Fail"} (70% required)
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setExamState("intro"); setShowReview(false); }}
                    style={{
                      padding: "12px 28px", borderRadius: 10,
                      background: "linear-gradient(135deg, #0F766E, #0891B2)",
                      color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Retake Exam
                  </button>
                  <button
                    onClick={() => setShowReview(!showReview)}
                    style={{
                      padding: "12px 28px", borderRadius: 10, background: "#fff",
                      color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 14,
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {showReview ? "Hide" : "Review"} Answers
                  </button>
                  <Link href="/wpi-class3-wastewater">
                    <button style={{
                      padding: "12px 28px", borderRadius: 10, background: "#fff",
                      color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 14,
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      Back to Practice
                    </button>
                  </Link>
                </div>
              </div>

              {/* Module breakdown */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "24px", marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>
                  Module Breakdown
                </h3>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  {WPI_CLASS3_WASTEWATER_MODULES.map((mod) => {
                    const bd = moduleBreakdown[mod] ?? { correct: 0, total: 0 };
                    if (bd.total === 0) return null;
                    const modPct = Math.round((bd.correct / bd.total) * 100);
                    const mc = MODULE_COLORS[mod] ?? { bg: "#F1F5F9", color: "#475569" };
                    return (
                      <div key={mod}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{mod}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: modPct >= 70 ? "#15803D" : "#B91C1C" }}>
                            {bd.correct}/{bd.total} ({modPct}%)
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${modPct}%`,
                            background: modPct >= 70 ? "#22C55E" : "#EF4444",
                            borderRadius: 3, transition: "width 0.5s",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Answer review */}
              {showReview && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                  {questions.map((q, i) => {
                    const userAnswer = answers[i]?.selected;
                    const isCorrect = userAnswer === q.correctAnswer;
                    return (
                      <div key={i} style={{
                        background: "#fff", borderRadius: 14, border: `1.5px solid ${isCorrect ? "#BBF7D0" : "#FECACA"}`,
                        padding: "20px",
                      }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isCorrect ? "#15803D" : "#B91C1C" }}>
                            {isCorrect ? "✓" : "✗"} Q{i + 1}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                            background: (MODULE_COLORS[q.module] ?? { bg: "#F1F5F9" }).bg,
                            color: (MODULE_COLORS[q.module] ?? { color: "#475569" }).color,
                          }}>
                            {q.module}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: "0 0 10px", lineHeight: 1.5 }}>
                          {q.text}
                        </p>
                        {!isCorrect && userAnswer !== null && (
                          <p style={{ fontSize: 12, color: "#B91C1C", margin: "0 0 4px" }}>
                            Your answer: {q.options[userAnswer]}
                          </p>
                        )}
                        <p style={{ fontSize: 12, color: "#15803D", margin: "0 0 8px", fontWeight: 600 }}>
                          Correct: {q.options[q.correctAnswer]}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                          <span style={{ whiteSpace: "pre-line" }}>{q.explanation}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </PurchaseGate>
      </div>
    </div>
  );
}
