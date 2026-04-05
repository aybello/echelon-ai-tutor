// Class 3 Wastewater Treatment Timed Mock Exam
// 100 questions · 2-hour timer · 70% pass threshold · 5-module breakdown
// Mirrors Class2WastewaterMockExam.tsx structure
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  CLASS3_WW_QUESTIONS,
  type C3WWQuestion,
} from "@/lib/class3WastewaterQuestions";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import PurchaseGate from "@/components/PurchaseGate";
import { trpc } from "@/lib/trpc";
import ScoreHistory from "@/components/ScoreHistory";
import ReportErrorModal from "@/components/ReportErrorModal";

const EXAM_DURATION  = 2 * 60 * 60; // 2 hours
const EXAM_QUESTIONS = 100;
const PASS_THRESHOLD = 0.7;

type ExamState = "intro" | "active" | "results";
interface ExamAnswer { questionIndex: number; selected: number | null; }

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process Monitoring":        { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation":                 { bg: "#DCFCE7", color: "#15803D" },
  "Equipment Evaluation & Maintenance":  { bg: "#FFEDD5", color: "#C2410C" },
  "Laboratory Analysis":                 { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety & Admin":            { bg: "#FEE2E2", color: "#B91C1C" },
};

// Proportional module targets for 100 questions
// Bank: Treatment Process 161, Equipment Operation 112, Equipment E&M 76, Lab 98, Safety 55
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Treatment Process Monitoring":        32,
  "Equipment Operation":                 22,
  "Equipment Evaluation & Maintenance":  15,
  "Laboratory Analysis":                 20,
  "Security, Safety & Admin":            11,
};

function selectExamQuestions(): C3WWQuestion[] {
  const pool = [...CLASS3_WW_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected: C3WWQuestion[] = [];
  for (const [mod, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const modQs = pool.filter(q => q.module === mod).slice(0, target);
    selected.push(...modQs);
  }
  const selectedIds = new Set(selected.map(q => q.id));
  const remaining = pool.filter(q => !selectedIds.has(q.id));
  while (selected.length < EXAM_QUESTIONS && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }
  return selected.slice(0, EXAM_QUESTIONS).sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Class3WastewaterMockExam() {
  usePageMeta({
    title: "Class 3 Wastewater Mock Exam",
    description: "Simulate the Ontario Class 3 Wastewater Treatment operator exam with 100 timed questions, proportional module sampling, and detailed results.",
    path: "/class3-ww-mock",
    keywords: "Class 3 wastewater mock exam, Ontario operator certification, OWWCO, timed practice test",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<C3WWQuestion[]>([]);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionId] = useState(() => `c3ww-mock-${Date.now()}`);

  const saveResult = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    const qs = selectExamQuestions();
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setShowReview(false);
    setFlagged(new Set());
    setExamState("active");
  }, []);

  const submitExam = useCallback((qs: C3WWQuestion[], ans: ExamAnswer[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = ans.filter((a) => a.selected !== null && qs[a.questionIndex]?.correct === a.selected).length;
    const passed = score / EXAM_QUESTIONS >= PASS_THRESHOLD;
    saveResult.mutate({
      sessionId,
      examType: "class3-ww",
      score,
      total: EXAM_QUESTIONS,
      passed,
      stream: "wastewater",
    });
    setExamState("results");
  }, [sessionId, saveResult]);

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

  const score = useMemo(() =>
    answers.filter((a) => a.selected !== null && questions[a.questionIndex]?.correct === a.selected).length,
    [answers, questions]
  );
  const passed = score / EXAM_QUESTIONS >= PASS_THRESHOLD;

  const moduleBreakdown = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!stats[q.module]) stats[q.module] = { correct: 0, total: 0 };
      stats[q.module].total++;
      if (answers[i]?.selected === q.correct) stats[q.module].correct++;
    });
    return stats;
  }, [questions, answers]);

  const currentQ = questions[currentIdx];
  const currentAnswer = answers[currentIdx];

  const setAnswer = (idx: number) => {
    setAnswers((prev) => prev.map((a, i) => i === currentIdx ? { ...a, selected: idx } : a));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(currentIdx) ? next.delete(currentIdx) : next.add(currentIdx);
      return next;
    });
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (examState === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        <SiteNav currentPath="/class3-ww-mock" />
        <PurchaseGate examType="class3-ww" productKey="class3-ww" productName="Class 3 Wastewater Treatment" price={129}>
          <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 16px" }}>
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "40px 36px", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🏭</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0E7490", marginBottom: 8 }}>Class 3 Wastewater Mock Exam</h1>
              <p style={{ color: "#64748B", marginBottom: 24, lineHeight: 1.6 }}>
                Simulate the Ontario Class 3 Wastewater Treatment certification exam. 100 questions drawn proportionally from all 5 modules. 2-hour time limit. 70% to pass.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                {Object.entries(EXAM_MODULE_TARGETS).map(([mod, count]) => (
                  <div key={mod} style={{ background: MODULE_COLORS[mod]?.bg ?? "#F1F5F9", borderRadius: 10, padding: "10px 14px", textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: MODULE_COLORS[mod]?.color ?? "#475569" }}>{mod}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{count} questions</div>
                  </div>
                ))}
              </div>
              <button
                onClick={startExam}
                style={{ width: "100%", padding: "15px", borderRadius: 12, background: "linear-gradient(135deg, #0E7490, #0F766E)", color: "#fff", border: "none", fontSize: 16, fontWeight: 800, cursor: "pointer" }}
              >
                Start Exam →
              </button>
              <ScoreHistory sessionId={sessionId} examType="class3-ww" stream="wastewater" />
            </div>
          </div>
        </PurchaseGate>
      </div>
    );
  }

  // ── ACTIVE EXAM ────────────────────────────────────────────────────────────
  if (examState === "active" && currentQ) {
    const answered = answers.filter((a) => a.selected !== null).length;
    const pct = Math.round((answered / EXAM_QUESTIONS) * 100);
    const urgentTime = timeLeft < 600;

    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        {/* Timer bar */}
        <div style={{ background: urgentTime ? "#DC2626" : "#0E7490", color: "#fff", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Class 3 WW Mock Exam</span>
          <span style={{ fontWeight: 800, fontSize: 18, fontFamily: "monospace" }}>{formatTime(timeLeft)}</span>
          <span style={{ fontSize: 13 }}>{answered}/{EXAM_QUESTIONS} answered</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#E2E8F0" }}>
          <div style={{ height: "100%", background: "#0E7490", width: `${pct}%`, transition: "width 0.3s" }} />
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px", display: "flex", gap: 20 }}>
          {/* Question */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Question {currentIdx + 1} of {EXAM_QUESTIONS}</span>
                <button onClick={toggleFlag} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>
                  {flagged.has(currentIdx) ? "🚩" : "⚑"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <span style={{ background: MODULE_COLORS[currentQ.module]?.bg ?? "#F1F5F9", color: MODULE_COLORS[currentQ.module]?.color ?? "#475569", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  {currentQ.module}
                </span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.6, marginBottom: 18 }}>
                {currentQ.question}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {currentQ.options.map((opt, i) => {
                  const isSelected = currentAnswer?.selected === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(i)}
                      style={{
                        background: isSelected ? "#EFF6FF" : "#F8FAFC",
                        border: `2px solid ${isSelected ? "#3B82F6" : "#E2E8F0"}`,
                        color: isSelected ? "#1D4ED8" : "#1E293B",
                        borderRadius: 10, padding: "12px 16px", textAlign: "left",
                        fontSize: 14, cursor: "pointer", fontWeight: isSelected ? 700 : 400,
                      }}
                    >
                      <span style={{ marginRight: 8, opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "transparent", color: "#64748B", fontSize: 13, fontWeight: 700, cursor: currentIdx === 0 ? "not-allowed" : "pointer" }}
                >
                  ← Previous
                </button>
                {currentIdx < EXAM_QUESTIONS - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(currentIdx + 1)}
                    style={{ flex: 2, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg, #0E7490, #0F766E)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => submitExam(questions, answers)}
                    style={{ flex: 2, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg, #059669, #047857)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Submit Exam ✓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question navigator */}
          <div style={{ width: 180, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 10 }}>NAVIGATOR</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                {questions.map((_, i) => {
                  const isAnswered = answers[i]?.selected !== null;
                  const isFlagged = flagged.has(i);
                  const isCurrent = i === currentIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: isCurrent ? "#0E7490" : isAnswered ? "#DCFCE7" : "#F1F5F9",
                        border: isFlagged ? "2px solid #EF4444" : "1px solid transparent",
                        color: isCurrent ? "#fff" : isAnswered ? "#166534" : "#94A3B8",
                        fontSize: 10, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: "#94A3B8" }}>
                <div>🟩 Answered</div>
                <div>🟥 Flagged</div>
                <div>🔵 Current</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (examState === "results") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        <SiteNav currentPath="/class3-ww-mock" />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
          {/* Score card */}
          <div style={{ background: passed ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #DC2626, #B91C1C)", borderRadius: 20, padding: "32px", color: "#fff", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{passed ? "🎉" : "📚"}</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 4px" }}>{score}/{EXAM_QUESTIONS}</h1>
            <p style={{ fontSize: 18, margin: "0 0 8px", opacity: 0.9 }}>{Math.round((score / EXAM_QUESTIONS) * 100)}%</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{passed ? "PASSED ✓" : "NOT PASSED"}</p>
            <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Pass threshold: 70% (70 questions)</p>
          </div>

          {/* Module breakdown */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 16 }}>Module Breakdown</h2>
            {Object.entries(moduleBreakdown).map(([mod, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={mod} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{mod}</span>
                    <span style={{ fontSize: 13, color: pct >= 70 ? "#059669" : "#DC2626", fontWeight: 700 }}>{stats.correct}/{stats.total} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}>
                    <div style={{ height: "100%", background: pct >= 70 ? "#059669" : "#DC2626", borderRadius: 3, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review wrong answers */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <button
              onClick={() => setShowReview(!showReview)}
              style={{ background: "none", border: "none", fontSize: 15, fontWeight: 700, color: "#0E7490", cursor: "pointer", padding: 0 }}
            >
              {showReview ? "▼" : "▶"} Review Wrong Answers ({answers.filter((a, i) => a.selected !== null && questions[i]?.correct !== a.selected).length})
            </button>
            {showReview && (
              <div style={{ marginTop: 16 }}>
                {questions.map((q, i) => {
                  const a = answers[i];
                  if (a.selected === null || a.selected === q.correct) return null;
                  return (
                    <div key={i} style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 16, marginBottom: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 8 }}>Q{i + 1}. {q.question}</p>
                      <p style={{ fontSize: 12, color: "#DC2626", margin: "0 0 4px" }}>✗ Your answer: {q.options[a.selected!]}</p>
                      <p style={{ fontSize: 12, color: "#059669", margin: "0 0 8px" }}>✓ Correct: {q.options[q.correct]}</p>
                      <p style={{ fontSize: 12, color: "#475569", background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>💡 <span style={{ whiteSpace: "pre-line" }}>{q.explanation}</span></p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={startExam}
              style={{ flex: 1, padding: "13px", borderRadius: 12, background: "linear-gradient(135deg, #0E7490, #0F766E)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              Retake Exam
            </button>
            <Link href="/class3-ww">
              <button style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #0E7490", background: "transparent", color: "#0E7490", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Practice Mode
              </button>
            </Link>
            <Link href="/formulas-ww3" target="_blank">
              <button style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #22C55E", background: "#F0FDF4", color: "#15803D", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                📐 WW3 Formulas
              </button>
            </Link>
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

  return null;
}
