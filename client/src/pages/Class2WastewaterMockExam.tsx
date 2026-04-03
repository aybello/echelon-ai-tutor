// Class 2 Wastewater Treatment Timed Mock Exam
// 100 questions · 2-hour timer · 70% pass threshold · 5-module breakdown
// Mirrors Class1WastewaterMockExam.tsx structure
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  CLASS2_WW_QUESTIONS,
  type WastewaterQuestion,
} from "@/lib/class2WastewaterQuestions";
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
  "Treatment Process":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection Systems":      { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":     { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Administration": { bg: "#FEE2E2", color: "#B91C1C" },
  "Equipment O&M":           { bg: "#FFEDD5", color: "#C2410C" },
};

// Proportional module targets for 100 questions
// Bank: Treatment Process 171, Collection Systems 55, Lab 72, Safety 47, Equipment 50
// Scale to 100 proportionally
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Treatment Process":       43,
  "Collection Systems":      14,
  "Laboratory Analysis":     18,
  "Safety & Administration": 12,
  "Equipment O&M":           13,
};

function selectExamQuestions(): WastewaterQuestion[] {
  const pool = [...CLASS2_WW_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected: WastewaterQuestion[] = [];
  for (const [mod, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const modQs = pool.filter(q => q.module === mod).slice(0, target);
    selected.push(...modQs);
  }
  // Top up to 100 if any module was short
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
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SESSION_ID = (() => {
  const key = "echelon_class2ww_mock_session";
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
  { value: "New Brunswick",    label: "🌲 New Brunswick" },
  { value: "Nova Scotia",      label: "⚓ Nova Scotia" },
  { value: "Other",            label: "🇨🇦 Other Province / Territory" },
];

const BRAND = "#0F766E";
const BRAND_LIGHT = "#F0FDFA";

export default function Class2WastewaterMockExam() {
  usePageMeta({
    title: "Class 2 Wastewater Treatment Timed Mock Exam",
    description: "100-question timed mock exam for the Ontario Class 2 Wastewater Treatment operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results.",
    path: "/class2-ww-mock",
    keywords: "Class 2 wastewater treatment mock exam, Ontario operator exam, OWWCO Class 2, O. Reg. 128/04 practice test, activated sludge, nutrient removal",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [province, setProvince] = useState("Ontario");
  const [questions, setQuestions] = useState<WastewaterQuestion[]>([]);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authUser = trpc.auth.me.useQuery();
  const saveResult = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    const qs = selectExamQuestions();
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setFlagged([]);
    setSubmitted(false);
    setExamState("active");
  }, []);

  useEffect(() => {
    if (examState !== "active" || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, submitted]);

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const score = answers.filter((a, i) => a.selected === questions[i]?.correct).length;
    const pct = score / EXAM_QUESTIONS;

    saveResult.mutate({
      sessionId: SESSION_ID,
      examType: "class2-ww",
      score,
      total: EXAM_QUESTIONS,
      passed: pct >= PASS_THRESHOLD,
    });
    setExamState("results");
  }, [submitted, answers, questions, saveResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQ = questions[currentIdx];
  const isFlagged = flagged.includes(currentIdx);
  const isLastQ = currentIdx === questions.length - 1;
  const answered = answers.filter(a => a.selected !== null).length;
  const timeWarning = timeLeft < 600;

  // Results
  const score = useMemo(() => answers.filter((a, i) => a.selected === questions[i]?.correct).length, [answers, questions]);
  const pct = score / EXAM_QUESTIONS;
  const passed = pct >= PASS_THRESHOLD;

  const moduleResults = useMemo(() => {
    const res: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!res[q.module]) res[q.module] = { correct: 0, total: 0 };
      res[q.module].total++;
      if (answers[i]?.selected === q.correct) res[q.module].correct++;
    });
    return res;
  }, [questions, answers]);

  // ── PURCHASE GATE ────────────────────────────────────────────────────────
  return (
    <PurchaseGate
      examType="class2-ww"
      productKey="class2-ww"
      productName="Class 2 Wastewater Treatment Practice Pass"
      price={99}
    >
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        <SiteNav currentPath="/class2-ww-mock" />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 16px 40px" }}>

          {/* ── INTRO ─────────────────────────────────────────────────────── */}
          {examState === "intro" && (
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <Link href="/class2-ww" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: 12, color: "#94A3B8", cursor: "pointer" }}>← Back to Practice</span>
              </Link>
              <div style={{ background: "#fff", borderRadius: 20, padding: "32px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginTop: 16 }}>
                <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>📋</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 8 }}>Class 2 Wastewater Treatment</h1>
                <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 24 }}>Timed Mock Exam</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "Questions", value: "100" },
                    { label: "Time Limit", value: "2 Hours" },
                    { label: "Pass Mark", value: "70%" },
                    { label: "Modules", value: "5" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: BRAND_LIGHT, borderRadius: 12, padding: "14px", textAlign: "center", border: `1px solid ${BRAND}30` }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: BRAND }}>{value}</div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Province / Territory</label>
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#fff" }}
                  >
                    {PROVINCE_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: "#FEF9C3", borderRadius: 10, padding: "12px 14px", marginBottom: 24, border: "1px solid #FDE047" }}>
                  <p style={{ fontSize: 12, color: "#713F12", margin: 0, lineHeight: 1.5 }}>
                    <strong>⚠️ Exam Tips:</strong> Read each question carefully. Flag questions you are unsure about and return to them. You can navigate freely between questions. The exam auto-submits when time expires.
                  </p>
                </div>

                <button
                  onClick={startExam}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Start Exam →
                </button>
              </div>

              {authUser.data && (
                <div style={{ marginTop: 24 }}>
                  <ScoreHistory sessionId={SESSION_ID} examType="class2-ww" />
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVE EXAM ───────────────────────────────────────────────── */}
          {examState === "active" && currentQ && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 20, alignItems: "start" }}>
              {/* Main question area */}
              <div>
                {/* Timer bar */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: `1px solid ${timeWarning ? "#FCA5A5" : "#E2E8F0"}`, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Q {currentIdx + 1} / {EXAM_QUESTIONS}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: timeWarning ? "#DC2626" : BRAND, fontVariantNumeric: "tabular-nums" }}>
                    ⏱ {formatTime(timeLeft)}
                  </span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{answered} answered</span>
                </div>

                {/* Question card */}
                <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: MODULE_COLORS[currentQ.module]?.bg || "#F1F5F9", color: MODULE_COLORS[currentQ.module]?.color || "#475569" }}>
                      {currentQ.module}
                    </span>
                  </div>

                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", lineHeight: 1.6, marginBottom: 18 }}>{currentQ.question}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentQ.options.map((opt, i) => {
                      const isSelected = answers[currentIdx]?.selected === i;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const newAnswers = [...answers];
                            newAnswers[currentIdx] = { questionIndex: currentIdx, selected: i };
                            setAnswers(newAnswers);
                          }}
                          style={{
                            padding: "12px 14px", borderRadius: 10,
                            border: `1.5px solid ${isSelected ? BRAND : "#E2E8F0"}`,
                            background: isSelected ? BRAND_LIGHT : "#F8FAFC",
                            color: isSelected ? BRAND : "#334155",
                            fontSize: 13, fontWeight: 600, textAlign: "left",
                            cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "flex-start", gap: 10, transition: "all 0.15s",
                          }}
                        >
                          <span style={{ marginRight: 10, fontWeight: 800, color: isSelected ? BRAND : "#94A3B8" }}>
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
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
                    onClick={() => setFlagged(f => f.includes(currentIdx) ? f.filter(x => x !== currentIdx) : [...f, currentIdx])}
                    style={{ padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${isFlagged ? "#D97706" : "#E2E8F0"}`, background: isFlagged ? "#FEF9C3" : "#fff", color: isFlagged ? "#A16207" : "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {isFlagged ? "🚩 Flagged" : "🚩 Flag"}
                  </button>
                  {isLastQ ? (
                    <button
                      onClick={() => { if (window.confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
                      style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Submit Exam ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                      style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: BRAND, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
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
                    const isCurrent  = i === currentIdx;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        style={{
                          padding: "6px 0", borderRadius: 6,
                          border: isCurrent ? `2px solid ${BRAND}` : "1px solid #E2E8F0",
                          background: isCurrent ? BRAND_LIGHT : isFlaggedQ ? "#FEF9C3" : isAnswered ? "#DCFCE7" : "#F8FAFC",
                          color: isCurrent ? BRAND : isFlaggedQ ? "#A16207" : isAnswered ? "#15803D" : "#94A3B8",
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
                  style={{ width: "100%", marginTop: 14, padding: "10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Submit Exam ✓
                </button>
              </div>
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────────────────────── */}
          {examState === "results" && (
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: "32px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 64, marginBottom: 12 }}>{passed ? "🎉" : "📚"}</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
                  {passed ? "Congratulations!" : "Keep Studying!"}
                </h2>
                <div style={{ fontSize: 48, fontWeight: 900, color: passed ? "#059669" : "#DC2626", marginBottom: 4 }}>
                  {score}/{EXAM_QUESTIONS}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: passed ? "#059669" : "#DC2626", marginBottom: 16 }}>
                  {Math.round(pct * 100)}% — {passed ? "PASS" : "FAIL"}
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>
                  Pass mark: 70% ({Math.ceil(EXAM_QUESTIONS * PASS_THRESHOLD)} questions)
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setExamState("intro")}
                    style={{ padding: "12px 24px", borderRadius: 12, background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Retake Exam
                  </button>
                  <Link href="/class2-ww">
                    <button style={{ padding: "12px 24px", borderRadius: 12, border: `1.5px solid ${BRAND}`, background: "#fff", color: BRAND, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                      Back to Practice
                    </button>
                  </Link>
                  <Link href="/formulas-ww2" target="_blank">
                    <button style={{ padding: "12px 24px", borderRadius: 12, border: "1.5px solid #22C55E", background: "#F0FDF4", color: "#15803D", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                      📐 WW2 Formulas
                    </button>
                  </Link>
                </div>
              </div>

              {/* Module breakdown */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #E2E8F0", marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Module Breakdown</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {Object.entries(moduleResults).map(([mod, stat]) => {
                    const modPct = stat.total > 0 ? stat.correct / stat.total : 0;
                    const mc = MODULE_COLORS[mod] || { bg: "#F1F5F9", color: "#475569" };
                    return (
                      <div key={mod}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{mod}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: modPct >= 0.7 ? "#059669" : "#DC2626" }}>
                            {stat.correct}/{stat.total} ({Math.round(modPct * 100)}%)
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${modPct * 100}%`, background: modPct >= 0.7 ? "#059669" : "#DC2626", borderRadius: 3, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review wrong answers */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #E2E8F0" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Review Incorrect Answers</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {questions.map((q, i) => {
                    const userAns = answers[i]?.selected;
                    if (userAns === q.correct) return null;
                    return (
                      <div key={i} style={{ padding: "14px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>Q{i + 1} · {q.module}</div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>{q.question}</p>
                        <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 4 }}>
                          Your answer: {userAns !== null ? `${String.fromCharCode(65 + userAns)}. ${q.options[userAns]}` : "Not answered"}
                        </div>
                        <div style={{ fontSize: 12, color: "#166534", marginBottom: 8 }}>
                          Correct: {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                        </div>
                        <div style={{ fontSize: 12, color: "#374151", background: "#F0FDFA", padding: "8px 10px", borderRadius: 8, border: "1px solid #99F6E4" }}>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PurchaseGate>
  );
}
