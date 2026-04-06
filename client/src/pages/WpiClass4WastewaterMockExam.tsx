// WPI CLASS IV WASTEWATER TREATMENT MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold
// Used for: BC (EOCP Level IV), Alberta (AWWOA Class IV), Saskatchewan, Manitoba
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  wpiClass4WastewaterQuestions,
  WPI_CLASS4_WASTEWATER_MODULES,
  type WpiClass4WastewaterQuestion,
} from "@/lib/wpiClass4WastewaterQuestions";
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
  "Advanced Process Control & Optimization":           { bg: "#DBEAFE", color: "#1D4ED8" },
  "Advanced Nutrient Removal & Resource Recovery":     { bg: "#DCFCE7", color: "#15803D" },
  "Emerging Technologies & Innovation":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Plant Management, Asset Management & Leadership":   { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulatory Compliance, Reporting & Environmental Management": { bg: "#FEF9C3", color: "#A16207" },
  "Emergency Response & Resilience Planning":          { bg: "#FFEDD5", color: "#C2410C" },
  "Health, Safety & Environmental Stewardship":        { bg: "#F1F5F9", color: "#475569" },
};

// Exam blueprint — proportional module targets (total = 100)
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Advanced Process Control & Optimization":           20,
  "Advanced Nutrient Removal & Resource Recovery":     18,
  "Emerging Technologies & Innovation":                12,
  "Plant Management, Asset Management & Leadership":   15,
  "Regulatory Compliance, Reporting & Environmental Management": 15,
  "Emergency Response & Resilience Planning":          12,
  "Health, Safety & Environmental Stewardship":        8,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam(): WpiClass4WastewaterQuestion[] {
  const selected: WpiClass4WastewaterQuestion[] = [];
  for (const [module, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const pool = shuffle(wpiClass4WastewaterQuestions.filter((q) => q.module === module));
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

export default function WpiClass4WastewaterMockExam() {
  usePageMeta({
    title: "WPI Class IV Wastewater Treatment Mock Exam — 100 Questions, 2 Hours",
    description:
      "Simulate the WPI Class IV Wastewater Treatment exam with a 100-question, 2-hour timed mock exam. Covers advanced process control, nutrient recovery, emerging technologies, plant management, and regulatory compliance. 70% pass threshold.",
    path: "/wpi-class4-wastewater-mock",
    keywords:
      "WPI Class IV wastewater mock exam, BC EOCP Level IV, Alberta AWWOA Class IV, timed practice exam, chief operator, advanced process control, nutrient recovery",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<WpiClass4WastewaterQuestion[]>([]);
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

  const submitExam = useCallback((qs: WpiClass4WastewaterQuestion[], ans: ExamAnswer[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = ans.filter((a, i) => a.selected === qs[i].correctAnswer).length;
    saveScore.mutate({
      sessionId: "wpi-class4-wastewater",
      examType: "wpi-class4-wastewater",
      score: correct,
      total: qs.length,
      passed: correct / qs.length >= PASS_THRESHOLD,
    });
    setExamState("results");
  }, [saveScore]);

  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          submitExam(questions, answers);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, questions, answers, submitExam]);

  const handleAnswer = useCallback((optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], selected: optionIndex };
      return next;
    });
  }, [currentIndex]);

  const moduleBreakdown = useMemo(() => {
    const bd: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!bd[q.module]) bd[q.module] = { correct: 0, total: 0 };
      bd[q.module].total++;
      if (answers[i]?.selected === q.correctAnswer) bd[q.module].correct++;
    });
    return bd;
  }, [questions, answers]);

  const score = useMemo(() => {
    if (examState !== "results") return 0;
    return answers.filter((a, i) => a.selected === questions[i]?.correctAnswer).length;
  }, [examState, answers, questions]);

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = pct >= PASS_THRESHOLD * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/wpi-class4-wastewater-mock" />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Link href="/wpi">
            <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              ← WPI Exams
            </button>
          </Link>
          <span style={{ color: "#CBD5E1" }}>·</span>
          <Link href="/wpi-class4-wastewater">
            <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              Class IV Wastewater Practice
            </button>
          </Link>
          <span style={{ color: "#CBD5E1" }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", background: "#EDE9FE", padding: "2px 10px", borderRadius: 20 }}>
            Mock Exam
          </span>
        </div>

        <PurchaseGate
      backPath="/wpi"
          examType="wpi-class4-wastewater"
          productKey="wpi-class4-wastewater"
          productName="WPI Class IV Wastewater Practice Pass"
          price={149}
          features={[
            "607 WPI Class IV questions — unlimited practice",
            "Timed mock exam (100 questions, 2 hrs)",
            "Module-by-module performance breakdown",
            "AI Tutor explanations on every question",
          ]}>
          {/* ── INTRO ── */}
          {examState === "intro" && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "40px 32px", border: "1px solid #E2E8F0", textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
                background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
              }}>
                🏛️
              </div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 900, color: "#0F172A", margin: "0 0 10px" }}>
                WPI Class IV Wastewater Mock Exam
              </h1>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px", lineHeight: 1.6 }}>
                BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB · <strong>Chief Operator Level</strong>
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
                {[
                  { icon: "📝", label: "100 Questions", sub: "Proportional to exam blueprint" },
                  { icon: "⏱️", label: "2 Hours", sub: "120 minutes timed" },
                  { icon: "🎯", label: "70% to Pass", sub: "70 correct required" },
                  { icon: "🏛️", label: "Chief Operator", sub: "Highest certification level" },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: "#F8FAFC", borderRadius: 14, padding: "16px 20px",
                    border: "1px solid #E2E8F0", minWidth: 130, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{
                background: "#F5F3FF", borderRadius: 12, padding: "16px 20px",
                border: "1px solid #DDD6FE", marginBottom: 28, textAlign: "left",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5B21B6", marginBottom: 8 }}>
                  📋 Exam Blueprint
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                  {Object.entries(EXAM_MODULE_TARGETS).map(([mod, count]) => (
                    <div key={mod} style={{ fontSize: 12, color: "#374151" }}>
                      <span style={{ fontWeight: 600 }}>{count}q</span> — {mod}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={startExam}
                style={{
                  padding: "14px 40px", borderRadius: 12,
                  background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  color: "#fff", border: "none", fontSize: 16, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Start Exam →
              </button>
              <ScoreHistory examType="wpi-class4-wastewater" sessionId="wpi-class4-wastewater" />
            </div>
          )}

          {/* ── ACTIVE EXAM ── */}
          {examState === "active" && questions.length > 0 && (
            <div>
              {/* Timer & progress */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "14px 20px",
                border: "1px solid #E2E8F0", marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>
                    Q {currentIndex + 1} / {questions.length}
                  </span>
                  <div style={{ width: 120, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${((currentIndex + 1) / questions.length) * 100}%`,
                      background: "linear-gradient(90deg, #7C3AED, #4F46E5)",
                      borderRadius: 3, transition: "width 0.3s",
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 800, fontFamily: "monospace",
                  color: timeLeft < 600 ? "#DC2626" : "#0F172A",
                  background: timeLeft < 600 ? "#FEF2F2" : "#F8FAFC",
                  padding: "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
                }}>
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>

              {/* Question card */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #E2E8F0", marginBottom: 16 }}>
                {(() => {
                  const q = questions[currentIndex];
                  const mc = MODULE_COLORS[q.module] ?? { bg: "#F1F5F9", color: "#475569" };
                  return (
                    <>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: mc.color,
                        background: mc.bg, padding: "3px 10px", borderRadius: 20,
                        display: "inline-block", marginBottom: 12,
                      }}>
                        {q.module}
                      </span>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", lineHeight: 1.6, margin: "0 0 20px" }}>
                        {q.text}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                        {q.options.map((opt, i) => {
                          const isSelected = answers[currentIndex]?.selected === i;
                          return (
                            <button
                              key={i}
                              onClick={() => handleAnswer(i)}
                              style={{
                                padding: "12px 16px", borderRadius: 10,
                                background: isSelected ? "#EEF2FF" : "#F8FAFC",
                                border: `1.5px solid ${isSelected ? "#818CF8" : "#E2E8F0"}`,
                                color: isSelected ? "#3730A3" : "#0F172A",
                                fontSize: 14, fontWeight: isSelected ? 600 : 500,
                                cursor: "pointer", textAlign: "left", fontFamily: "inherit", lineHeight: 1.5,
                              }}
                            >
                              <span style={{ fontWeight: 700, marginRight: 8 }}>{["A", "B", "C", "D"][i]}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  style={{
                    padding: "11px 22px", borderRadius: 10, background: "#fff",
                    border: "1.5px solid #E2E8F0", color: "#0F172A", fontSize: 13,
                    fontWeight: 600, cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit", opacity: currentIndex === 0 ? 0.4 : 1,
                  }}
                >
                  ← Previous
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((i) => i + 1)}
                      style={{
                        padding: "11px 22px", borderRadius: 10,
                        background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                        color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => submitExam(questions, answers)}
                      style={{
                        padding: "11px 22px", borderRadius: 10,
                        background: "linear-gradient(135deg, #059669, #0891B2)",
                        color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Submit Exam ✓
                    </button>
                  )}
                </div>
              </div>

              {/* Question nav grid */}
              <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: "16px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 10 }}>Question Navigator</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {questions.map((_, i) => {
                    const isAnswered = answers[i]?.selected !== null;
                    const isCurrent = i === currentIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", border: "none",
                          background: isCurrent ? "#7C3AED" : isAnswered ? "#DCFCE7" : "#F1F5F9",
                          color: isCurrent ? "#fff" : isAnswered ? "#15803D" : "#94A3B8",
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#94A3B8" }}>
                  {answers.filter((a) => a.selected !== null).length} / {questions.length} answered
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {examState === "results" && (
            <div>
              {/* Score card */}
              <div style={{
                background: passed
                  ? "linear-gradient(135deg, #F0FDF4, #ECFEFF)"
                  : "linear-gradient(135deg, #FFF1F2, #FFF7ED)",
                borderRadius: 20, padding: "40px 32px", border: `1.5px solid ${passed ? "#86EFAC" : "#FECACA"}`,
                textAlign: "center", marginBottom: 24,
              }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>{passed ? "🏆" : "📚"}</div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>
                  {passed ? "Exam Passed!" : "Keep Studying"}
                </h2>
                <div style={{ fontSize: 48, fontWeight: 900, color: passed ? "#15803D" : "#DC2626", margin: "8px 0" }}>
                  {pct}%
                </div>
                <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px" }}>
                  {score} / {questions.length} correct · {passed ? "Above" : "Below"} 70% pass threshold
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setExamState("intro"); setShowReview(false); }}
                    style={{
                      padding: "12px 28px", borderRadius: 10,
                      background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                      color: "#fff", border: "none", fontSize: 14,
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Retake Exam
                  </button>
                  <button
                    onClick={() => setShowReview((v) => !v)}
                    style={{
                      padding: "12px 28px", borderRadius: 10, background: "#fff",
                      color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 14,
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {showReview ? "Hide" : "Review"} Answers
                  </button>
                  <Link href="/wpi-class4-wastewater">
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
                  {WPI_CLASS4_WASTEWATER_MODULES.filter((mod) => (moduleBreakdown[mod]?.total ?? 0) > 0).map((mod) => {
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
