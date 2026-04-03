// CLASS 4 WATER TREATMENT MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold · 5-module breakdown
// Based on Ontario MECP Class 4 Water Treatment Operator exam criteria
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  QUESTIONS as CLASS4_WATER_QUESTIONS,
  type Question as Class4WaterQuestion,
} from "@/lib/class4WaterQuestions";
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
  "Treatment Process":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":     { bg: "#FEF9C3", color: "#A16207" },
  "Equipment O&M":           { bg: "#DCFCE7", color: "#15803D" },
  "Regulations & Management":{ bg: "#FEE2E2", color: "#B91C1C" },
  "Source Water & Quality":  { bg: "#EDE9FE", color: "#6D28D9" },
};

// Class 4 Water exam blueprint — proportional to question bank distribution
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Treatment Process":       40,
  "Regulations & Management":24,
  "Equipment O&M":           18,
  "Laboratory Analysis":     13,
  "Source Water & Quality":   5,
};

function selectExamQuestions(): Class4WaterQuestion[] {
  const pool = [...CLASS4_WATER_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected: Class4WaterQuestion[] = [];
  for (const [mod, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const modQs = pool.filter(q => q.module === mod).slice(0, target);
    selected.push(...modQs);
  }
  const remaining = pool.filter(q => !selected.includes(q));
  while (selected.length < EXAM_QUESTIONS && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }
  return selected.slice(0, EXAM_QUESTIONS).sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SESSION_ID = (() => {
  const key = "echelon_class4water_mock_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
})();

export default function Class4WaterMockExam() {
  usePageMeta({
    title: "Class 4 Water Treatment Mock Exam — 100 Questions, 2 Hours",
    description: "Simulate the Ontario Class 4 Water Treatment certification exam with 100 timed questions across 5 modules. Proportional sampling based on the official exam blueprint.",
    path: "/class4-water-mock",
    keywords: "Class 4 water treatment mock exam, Ontario operator certification, advanced water treatment exam, MECP Class 4",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<Class4WaterQuestion[]>([]);
  const [answers, setAnswers]     = useState<ExamAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]   = useState(EXAM_DURATION);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveResult = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    const qs = selectExamQuestions();
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setExamState("active");
  }, []);

  const submitExam = useCallback((qs: Class4WaterQuestion[], ans: ExamAnswer[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = ans.filter(a => a.selected !== null && qs[a.questionIndex]?.correct === a.selected).length;
    saveResult.mutate({
      examType: "class4-water",
      stream: "water",
      score,
      total: EXAM_QUESTIONS,
      passed: score / EXAM_QUESTIONS >= PASS_THRESHOLD,
      sessionId: SESSION_ID,
    });
    setExamState("results");
  }, [saveResult]);

  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          submitExam(questions, answers);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, questions, answers, submitExam]);

  const score = useMemo(() => {
    if (examState !== "results") return 0;
    return answers.filter(a => a.selected !== null && questions[a.questionIndex]?.correct === a.selected).length;
  }, [examState, answers, questions]);

  const passed = score / EXAM_QUESTIONS >= PASS_THRESHOLD;

  const moduleBreakdown = useMemo(() => {
    if (examState !== "results") return {};
    const breakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!breakdown[q.module]) breakdown[q.module] = { correct: 0, total: 0 };
      breakdown[q.module].total++;
      if (answers[i]?.selected === q.correct) breakdown[q.module].correct++;
    });
    return breakdown;
  }, [examState, questions, answers]);

  const pct = Math.round((score / EXAM_QUESTIONS) * 100);
  const currentQ = questions[currentIdx];

  // Intro screen
  if (examState === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        <SiteNav currentPath="/class4-water-mock" />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <PurchaseGate examType="class4-water" productKey="class4-water" productName="Class 4 Water Treatment Practice Pass" price={149}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 32 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#1E293B" }}>
                  Class 4 Water Treatment
                </h1>
                <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#475569" }}>
                  Mock Exam
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  { icon: "❓", label: "Questions", value: "100" },
                  { icon: "⏱️", label: "Time Limit", value: "2 Hours" },
                  { icon: "✅", label: "Pass Mark", value: "70%" },
                  { icon: "📊", label: "Difficulty", value: "Advanced" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Module Distribution</div>
                {Object.entries(EXAM_MODULE_TARGETS).map(([mod, count]) => {
                  const mc = MODULE_COLORS[mod] ?? { bg: "#F1F5F9", color: "#475569" };
                  return (
                    <div key={mod} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ background: mc.bg, color: mc.color, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, minWidth: 200 }}>{mod}</div>
                      <div style={{ flex: 1, height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${count}%`, background: mc.color, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 30 }}>{count}q</div>
                    </div>
                  );
                })}
              </div>
              <ScoreHistory sessionId={SESSION_ID} examType="class4-water" stream="water" />
              <button
                onClick={startExam}
                style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 16 }}
              >
                Start Exam →
              </button>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <Link href="/class4-water" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>
                  ← Back to Practice Quiz
                </Link>
              </div>
            </div>
          </PurchaseGate>
        </div>
      </div>
    );
  }

  // Active exam
  if (examState === "active" && currentQ) {
    const timeWarning = timeLeft < 600;
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        <SiteNav currentPath="/class4-water-mock" />
        {/* Exam header */}
        <div style={{ background: timeWarning ? "linear-gradient(135deg, #7F1D1D, #DC2626)" : "linear-gradient(135deg, #1E3A5F, #1D4ED8)", color: "#fff", padding: "16px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.75, textTransform: "uppercase" }}>Class 4 Water Mock Exam</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                Question {currentIdx + 1} of {EXAM_QUESTIONS}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace" }}>{formatTime(timeLeft)}</div>
                <div style={{ fontSize: 10, opacity: 0.75, textTransform: "uppercase" }}>Time Left</div>
              </div>
              <button
                onClick={() => submitExam(questions, answers)}
                style={{ padding: "8px 16px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Submit Exam
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ maxWidth: 720, margin: "8px auto 0", height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${((currentIdx + 1) / EXAM_QUESTIONS) * 100}%`, background: "#fff", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
          {/* Question navigator */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16 }}>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: i === currentIdx ? "#1D4ED8" : answers[i]?.selected !== null ? "#22C55E" : "#E2E8F0",
                  color: i === currentIdx || answers[i]?.selected !== null ? "#fff" : "#64748B",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question card */}
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: MODULE_COLORS[currentQ.module]?.bg ?? "#F1F5F9", color: MODULE_COLORS[currentQ.module]?.color ?? "#475569", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                {currentQ.module}
              </div>
            </div>
            <div style={{ padding: "20px 20px 16px" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.65 }}>
                {currentQ.question}
              </p>
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentIdx]?.selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setAnswers(prev => prev.map((a, idx) => idx === currentIdx ? { ...a, selected: i } : a));
                    }}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: isSelected ? "#EFF6FF" : "#F8FAFC",
                      border: `1.5px solid ${isSelected ? "#93C5FD" : "#E2E8F0"}`,
                      borderRadius: 10, color: isSelected ? "#1D4ED8" : "#374151",
                      textAlign: "left", fontSize: 14, fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer", transition: "all 0.15s", lineHeight: 1.5,
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                style={{ flex: 1, padding: "12px", background: "#F1F5F9", color: "#374151", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: currentIdx === 0 ? "not-allowed" : "pointer", opacity: currentIdx === 0 ? 0.5 : 1 }}
              >
                ← Previous
              </button>
              {currentIdx < EXAM_QUESTIONS - 1 ? (
                <button
                  onClick={() => setCurrentIdx(i => Math.min(EXAM_QUESTIONS - 1, i + 1))}
                  style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => submitExam(questions, answers)}
                  style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #15803D, #22C55E)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Submit Exam ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/class4-water-mock" />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{passed ? "🎉" : "📚"}</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: passed ? "#15803D" : "#B91C1C" }}>
              {passed ? "Exam Passed!" : "Keep Studying"}
            </h2>
            <div style={{ fontSize: 48, fontWeight: 900, color: passed ? "#15803D" : "#B91C1C", marginBottom: 4 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 16, color: "#64748B" }}>
              {score} / {EXAM_QUESTIONS} correct · Pass mark: 70%
            </div>
          </div>
          {/* Module breakdown */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              Module Breakdown
            </div>
            {Object.entries(moduleBreakdown).map(([mod, { correct, total }]) => {
              const modPct = Math.round((correct / total) * 100);
              const mc = MODULE_COLORS[mod] ?? { bg: "#F1F5F9", color: "#475569" };
              return (
                <div key={mod} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{mod}</span>
                    <span style={{ fontSize: 13, color: modPct >= 70 ? "#15803D" : "#B91C1C", fontWeight: 700 }}>
                      {correct}/{total} ({modPct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${modPct}%`, background: modPct >= 70 ? "#22C55E" : "#EF4444", borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Review wrong answers */}
          <button
            onClick={() => setShowReview(v => !v)}
            style={{ width: "100%", padding: "12px", background: "#F1F5F9", color: "#374151", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}
          >
            {showReview ? "Hide" : "Review"} Wrong Answers ({answers.filter((a, i) => a.selected !== questions[i]?.correct).length})
          </button>
          {showReview && (
            <div style={{ marginBottom: 20, maxHeight: 400, overflowY: "auto" }}>
              {questions.map((q, i) => {
                const a = answers[i];
                if (a?.selected === q.correct) return null;
                return (
                  <div key={i} style={{ background: "#FFF1F2", borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid #FECDD3" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#B91C1C", marginBottom: 6 }}>Q{i + 1} — {q.module}</div>
                    <div style={{ fontSize: 13, color: "#1E293B", marginBottom: 8, lineHeight: 1.5 }}>{q.question}</div>
                    <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 4 }}>
                      Your answer: {a?.selected !== null && a?.selected !== undefined ? q.options[a.selected] : "Not answered"}
                    </div>
                    <div style={{ fontSize: 12, color: "#15803D", marginBottom: 8 }}>
                      Correct: {q.options[q.correct]}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => { setExamState("intro"); setShowReview(false); }}
              style={{ flex: 1, padding: "12px", background: "#F1F5F9", color: "#374151", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              ← Back
            </button>
            <button
              onClick={startExam}
              style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Retake Exam
            </button>
            <Link href="/formulas-water4" target="_blank">
              <button style={{ flex: 1, padding: "12px", background: "#F0FDF4", color: "#15803D", border: "1.5px solid #22C55E", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                📐 Formulas
              </button>
            </Link>
          </div>
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
