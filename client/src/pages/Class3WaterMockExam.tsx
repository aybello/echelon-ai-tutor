// CLASS 3 WATER TREATMENT MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold · 5-module breakdown
// Based on ABC/WPI Need-to-Know Criteria for Water Treatment Class 3
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  QUESTIONS as CLASS3_WATER_QUESTIONS,
  type Question as Class3WaterQuestion,
} from "@/lib/class3WaterQuestions";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import PurchaseGate from "@/components/PurchaseGate";
import { trpc } from "@/lib/trpc";
import ScoreHistory from "@/components/ScoreHistory";

const EXAM_DURATION  = 2 * 60 * 60; // 2 hours
const EXAM_QUESTIONS = 100;
const PASS_THRESHOLD = 0.7;

type ExamState = "intro" | "active" | "results";
interface ExamAnswer { questionIndex: number; selected: number | null; }

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":           { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":         { bg: "#FEF9C3", color: "#A16207" },
  "Equipment O&M":               { bg: "#DCFCE7", color: "#15803D" },
  "Source Water Characteristics":{ bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety & Admin":    { bg: "#FEE2E2", color: "#B91C1C" },
};

// Official Class 3 Water Treatment exam blueprint (ABC/WPI NTK)
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Treatment Process":           33,
  "Laboratory Analysis":         16,
  "Equipment O&M":               23,
  "Source Water Characteristics":15,
  "Security, Safety & Admin":    13,
};

function selectExamQuestions(): Class3WaterQuestion[] {
  const pool = [...CLASS3_WATER_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected: Class3WaterQuestion[] = [];
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
  const key = "echelon_class3water_mock_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
})();

const PROVINCE_OPTIONS = [
  { value: "Ontario",          label: "🍁 Ontario",          regulator: "OWWCO / MECP" },
  { value: "British Columbia", label: "🏔️ British Columbia", regulator: "EOCP" },
  { value: "Alberta",          label: "🛢️ Alberta",          regulator: "Alberta EPA" },
  { value: "Saskatchewan",     label: "🌾 Saskatchewan" },
  { value: "Manitoba",         label: "🦬 Manitoba" },
  { value: "Quebec",           label: "⚜️ Quebec" },
  { value: "Nova Scotia",      label: "🦞 Nova Scotia" },
  { value: "New Brunswick",    label: "🌲 New Brunswick" },
  { value: "Other",            label: "🌍 Other" },
];

export default function Class3WaterMockExam() {
  usePageMeta({
    title: "Class 3 Water Treatment Mock Exam — 100 Questions, 2 Hours",
    description: "Simulate the Ontario Class 3 Water Treatment certification exam with 100 timed questions across 5 modules. Proportional sampling based on the official ABC/WPI exam blueprint.",
    path: "/class3-water-mock",
    keywords: "Class 3 water treatment mock exam, Ontario operator certification, timed practice exam, OWWCO Class 3",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<Class3WaterQuestion[]>([]);
  const [answers, setAnswers]     = useState<ExamAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]   = useState(EXAM_DURATION);
  const [province, setProvince]   = useState("Ontario");
  const [showReview, setShowReview] = useState(false);
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

  const submitExam = useCallback((qs: Class3WaterQuestion[], ans: ExamAnswer[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = ans.filter(a => a.selected !== null && qs[a.questionIndex]?.correct === a.selected).length;
    saveResult.mutate({
      examType: "class3-water",
      stream: "water",
      score,
      total: EXAM_QUESTIONS,
      passed: score / EXAM_QUESTIONS >= 0.70,
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

  if (examState === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        <SiteNav currentPath="/class3-water-mock" />
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px" }}>
          <PurchaseGate examType="class3-water" productKey="class3-water" productName="Class 3 Water Treatment Practice Pass" price={129}>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 32 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#1E293B" }}>
                  Class 3 Water Treatment
                </h1>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1E40AF", marginBottom: 8 }}>
                  Simulated Certification Exam
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                  100 questions · 2-hour time limit · 70% to pass
                </p>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
                  📊 Exam Blueprint (ABC/WPI NTK)
                </div>
                {Object.entries(EXAM_MODULE_TARGETS).map(([mod, count]) => (
                  <div key={mod} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{mod}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>{count} questions</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Your Province / Territory
                </label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1E293B", background: "#fff" }}
                >
                  {PROVINCE_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: "#FFF7ED", borderRadius: 10, padding: 16, marginBottom: 24, border: "1px solid #FED7AA" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C2410C", marginBottom: 6 }}>⚠️ Exam Conditions</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#7C2D12", lineHeight: 1.8 }}>
                  <li>Timer starts immediately when you begin</li>
                  <li>You cannot pause the exam once started</li>
                  <li>Unanswered questions count as incorrect</li>
                  <li>Exam auto-submits when time expires</li>
                </ul>
              </div>

              <button
                onClick={startExam}
                style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #1E40AF, #1D4ED8)", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer" }}
              >
                Start Exam →
              </button>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <Link href="/class3-water" style={{ flex: 1 }}>
                  <button style={{ width: "100%", padding: "10px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ← Practice Mode
                  </button>
                </Link>
                <Link href="/formulas-water3" style={{ flex: 1 }}>
                  <button style={{ width: "100%", padding: "10px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    📐 Formula Sheet
                  </button>
                </Link>
              </div>

              <div style={{ marginTop: 24 }}>
                <ScoreHistory sessionId={SESSION_ID} examType="class3-water" stream="water" />
              </div>
            </div>
          </PurchaseGate>
        </div>
      </div>
    );
  }

  if (examState === "active") {
    const q = questions[currentIdx];
    const ans = answers[currentIdx];
    const moduleColor = MODULE_COLORS[q?.module] ?? { bg: "#F1F5F9", color: "#475569" };
    const timerColor = timeLeft < 600 ? "#DC2626" : timeLeft < 1800 ? "#D97706" : "#15803D";
    const answeredCount = answers.filter(a => a.selected !== null).length;

    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        {/* Exam header */}
        <div style={{ background: "linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)", color: "#fff", padding: "12px 16px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Class 3 Water — Mock Exam
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                {answeredCount}/{EXAM_QUESTIONS} answered
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: timerColor === "#DC2626" ? "#FCA5A5" : timerColor === "#D97706" ? "#FDE68A" : "#A7F3D0" }}>
                ⏱ {formatTime(timeLeft)}
              </div>
              <button
                onClick={() => submitExam(questions, answers)}
                style={{ padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
          {/* Question navigator */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>
              Question Navigator
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {questions.map((_, i) => {
                const isAnswered = answers[i]?.selected !== null;
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: isCurrent ? "#1E40AF" : isAnswered ? "#DBEAFE" : "#F1F5F9",
                      color: isCurrent ? "#fff" : isAnswered ? "#1D4ED8" : "#94A3B8",
                      border: isCurrent ? "2px solid #1E40AF" : "1px solid transparent",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question card */}
          {q && (
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 10px", background: moduleColor.bg, color: moduleColor.color, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {q.module}
                </span>
                <span style={{ fontSize: 13, color: "#94A3B8", marginLeft: "auto" }}>
                  Q{currentIdx + 1} of {EXAM_QUESTIONS}
                </span>
              </div>
              <div style={{ padding: "20px 20px 16px" }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: "#1E293B" }}>
                  {q.question}
                </p>
              </div>
              <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, i) => {
                  const isSelected = ans?.selected === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers(prev => prev.map((a, idx) => idx === currentIdx ? { ...a, selected: i } : a))}
                      style={{
                        padding: "12px 16px",
                        background: isSelected ? "#EFF6FF" : "#F8FAFC",
                        border: `2px solid ${isSelected ? "#93C5FD" : "#E2E8F0"}`,
                        borderRadius: 10, textAlign: "left",
                        fontSize: 14, color: isSelected ? "#1D4ED8" : "#1E293B",
                        fontWeight: isSelected ? 600 : 400,
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
                  style={{ flex: 1, padding: "10px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: currentIdx === 0 ? "not-allowed" : "pointer", opacity: currentIdx === 0 ? 0.5 : 1 }}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => currentIdx < EXAM_QUESTIONS - 1 ? setCurrentIdx(i => i + 1) : submitExam(questions, answers)}
                  style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #1E40AF, #1D4ED8)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  {currentIdx < EXAM_QUESTIONS - 1 ? "Next →" : "Submit Exam"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  const pct = Math.round((score / EXAM_QUESTIONS) * 100);
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/class3-water-mock" />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
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
              style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #1E40AF, #1D4ED8)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Retake Exam
            </button>
            <Link href="/formulas-water3" target="_blank">
              <button style={{ flex: 1, padding: "12px", background: "#F0FDF4", color: "#15803D", border: "1.5px solid #22C55E", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                📐 Water3 Formulas
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
