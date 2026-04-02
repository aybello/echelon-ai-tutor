// Class 1 Wastewater Treatment Timed Mock Exam
// 100 questions · 2-hour timer · 70% pass threshold · 8-module breakdown
// Mirrors Class1WaterMockExam.tsx structure

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  CLASS1_WASTEWATER_QUESTIONS,
  type Class1WastewaterQuestion,
} from "@/lib/class1WastewaterQuestions";
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
  "Wastewater Characteristics & Preliminary Treatment": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Primary Treatment":      { bg: "#DCFCE7", color: "#15803D" },
  "Secondary Treatment":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Biological Nutrient Removal": { bg: "#CCFBF1", color: "#0F766E" },
  "Tertiary Treatment & Filtration": { bg: "#FEF9C3", color: "#A16207" },
  "Disinfection":           { bg: "#FFEDD5", color: "#C2410C" },
  "Solids Handling & Biosolids": { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulations, Safety & Operations": { bg: "#F0FDF4", color: "#166534" },
};

// Proportional module targets for 100 questions from 600-question bank
// Bank distribution: Regs 101, Secondary 91, WW Char 85, Solids 76, Primary 69, BNR 69, Tertiary 58, Disinfection 51
// Scale to 100 proportionally
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Wastewater Characteristics & Preliminary Treatment": 14,
  "Primary Treatment":      12,
  "Secondary Treatment":    15,
  "Biological Nutrient Removal": 12,
  "Tertiary Treatment & Filtration": 10,
  "Disinfection":           10,
  "Solids Handling & Biosolids": 13,
  "Regulations, Safety & Operations": 14,
};

function selectExamQuestions(): Class1WastewaterQuestion[] {
  const pool = [...CLASS1_WASTEWATER_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected: Class1WastewaterQuestion[] = [];
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
  const key = "echelon_class1ww_mock_session";
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

export default function Class1WastewaterMockExam() {
  usePageMeta({
    title: "Class 1 Wastewater Treatment Timed Mock Exam",
    description: "100-question timed mock exam for the Ontario Class 1 Wastewater Treatment operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results.",
    path: "/class1-ww-mock",
    keywords: "Class 1 wastewater treatment mock exam, Ontario operator exam, OWWCO Class 1, O. Reg. 128/04 practice test",
  });

  const [examState, setExamState]   = useState<ExamState>("intro");
  const [questions, setQuestions]   = useState<Class1WastewaterQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]       = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft]     = useState(EXAM_DURATION);
  const [flagged, setFlagged]       = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>(() =>
    localStorage.getItem("echelon_province") ?? "Ontario"
  );

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultSavedRef  = useRef(false);
  const saveResult      = trpc.exam.saveResult.useMutation();

  const startExam = useCallback(() => {
    localStorage.setItem("echelon_province", selectedProvince);
    const qs = selectExamQuestions();
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setFlagged([]);
    setShowReview(false);
    resultSavedRef.current = false;
    setExamState("active");
  }, [selectedProvince]);

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

  const currentQ      = questions[currentIdx];
  const currentAnswer = answers[currentIdx]?.selected ?? null;

  const handleAnswer = useCallback((idx: number) => {
    setAnswers(prev => prev.map((a, i) => i === currentIdx ? { ...a, selected: idx } : a));
  }, [currentIdx]);

  const toggleFlag = useCallback(() => {
    setFlagged(prev => prev.includes(currentIdx) ? prev.filter(i => i !== currentIdx) : [...prev, currentIdx]);
  }, [currentIdx]);

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current!);
    setExamState("results");
  }, []);

  const results = useMemo(() => {
    if (examState !== "results" || questions.length === 0) return null;
    const correct = answers.filter((a, i) => a.selected === questions[i]?.correct).length;
    const score   = correct / EXAM_QUESTIONS;
    const passed  = score >= PASS_THRESHOLD;
    const moduleBreakdown = Object.keys(EXAM_MODULE_TARGETS).map(mod => {
      const modQs      = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.module === mod);
      const modCorrect = modQs.filter(({ i }) => answers[i]?.selected === questions[i]?.correct).length;
      return { module: mod, correct: modCorrect, total: modQs.length, pct: modQs.length > 0 ? modCorrect / modQs.length : 0 };
    }).filter(m => m.total > 0).sort((a, b) => a.pct - b.pct);
    return { correct, score, passed, moduleBreakdown };
  }, [examState, questions, answers]);

  // Save result to DB
  useEffect(() => {
    if (examState !== "results" || resultSavedRef.current || !results) return;
    resultSavedRef.current = true;
    const timeUsed = EXAM_DURATION - timeLeft;
    const moduleBreakdownRecord: Record<string, { correct: number; total: number }> = {};
    results.moduleBreakdown.forEach(m => {
      moduleBreakdownRecord[m.module] = { correct: m.correct, total: m.total };
    });
    saveResult.mutate({
      sessionId: SESSION_ID,
      examType: "class1-ww",
      score: results.correct,
      total: EXAM_QUESTIONS,
      passed: results.passed,
      timeTakenSeconds: timeUsed,
      moduleBreakdown: moduleBreakdownRecord,
    });
  }, [examState, results]); // eslint-disable-line react-hooks/exhaustive-deps

  const timerColor = timeLeft < 600 ? "#DC2626" : timeLeft < 1800 ? "#D97706" : "#0369A1";
  const answered   = answers.filter(a => a.selected !== null).length;

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (examState === "intro") {
    return (
      <PurchaseGate examType="class1-ww" productKey="class1-ww" productName="Class 1 Wastewater Practice Pass" price={79}>
        <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
          <SiteNav currentPath="/class1-ww-mock" />
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 16px 80px" }}>
            <Link href="/class1-ww" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
              ← Back to Practice Quiz
            </Link>
            <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🦠</div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>Class 1 Wastewater Treatment</h1>
                <p style={{ fontSize: 15, color: "#64748B", marginBottom: 0 }}>Timed Mock Exam — Ontario Operator Certification</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "❓", label: "Questions", value: "100" },
                  { icon: "⏱️", label: "Time Limit", value: "2 Hours" },
                  { icon: "✅", label: "Pass Mark", value: "70%" },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 12px", textAlign: "center", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em" }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B" }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "14px 16px", marginBottom: 24, border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 8 }}>MODULES COVERED</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.keys(EXAM_MODULE_TARGETS).map(mod => (
                    <span key={mod} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: MODULE_COLORS[mod]?.bg ?? "#E2E8F0", color: MODULE_COLORS[mod]?.color ?? "#475569", fontWeight: 600 }}>
                      {mod} ({EXAM_MODULE_TARGETS[mod]})
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Your Province / Territory</label>
                <select
                  value={selectedProvince}
                  onChange={e => setSelectedProvince(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, color: "#1E293B", background: "#fff", fontFamily: "inherit" }}
                >
                  {PROVINCE_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={startExam}
                style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 17, cursor: "pointer", fontFamily: "inherit" }}
              >
                Start Exam
              </button>
              <div style={{ marginTop: 20 }}>
                <ScoreHistory sessionId={SESSION_ID} examType="class1-ww" />
              </div>
            </div>
          </div>
        </div>
      </PurchaseGate>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (examState === "results" && results) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/class1-ww-mock" />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 16px 80px" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{results.passed ? "🎉" : "📚"}</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: results.passed ? "#15803D" : "#DC2626", marginBottom: 8 }}>
                {results.passed ? "Exam Passed!" : "Keep Practising"}
              </h2>
              <div style={{ fontSize: 48, fontWeight: 900, color: results.passed ? "#15803D" : "#DC2626" }}>
                {Math.round(results.score * 100)}%
              </div>
              <p style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
                {results.correct} / {EXAM_QUESTIONS} correct &nbsp;·&nbsp; Pass mark: 70%
              </p>
            </div>
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>Module Breakdown (weakest first)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.moduleBreakdown.map(m => (
                  <div key={m.module}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{m.module}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.pct >= 0.7 ? "#059669" : "#DC2626" }}>
                        {m.correct}/{m.total} ({Math.round(m.pct * 100)}%)
                      </span>
                    </div>
                    <div style={{ background: "#E2E8F0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: m.pct >= 0.7 ? "#22C55E" : "#EF4444", width: `${m.pct * 100}%`, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => { resultSavedRef.current = false; setExamState("intro"); }}
                style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
              >
                Take Another Exam
              </button>
              <Link href="/class1-ww" style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: "#0369A1", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Practice Weak Modules
              </Link>
            </div>
            <div style={{ marginTop: 20 }}>
              <ScoreHistory sessionId={SESSION_ID} examType="class1-ww" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active exam screen ────────────────────────────────────────────────────
  const isFlagged = flagged.includes(currentIdx);
  const isLastQ   = currentIdx === questions.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/class1-ww-mock" />
      {/* Timer bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
          Class 1 Wastewater Treatment Mock Exam
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#64748B" }}>{answered}/{EXAM_QUESTIONS} answered</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 80px", display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
        {/* Question panel */}
        <div>
          {currentQ && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", border: "1px solid #E2E8F0", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: MODULE_COLORS[currentQ.module]?.bg ?? "#F1F5F9", color: MODULE_COLORS[currentQ.module]?.color ?? "#475569", letterSpacing: "0.06em" }}>
                  {currentQ.module}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8" }}>
                  Question {currentIdx + 1} of {EXAM_QUESTIONS}
                </span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.6, marginBottom: 20 }}>
                {currentQ.question}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentQ.options.map((opt, i) => {
                  const isSelected = currentAnswer === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      style={{ padding: "13px 16px", borderRadius: 12, background: isSelected ? "#EFF6FF" : "#F8FAFC", border: `1.5px solid ${isSelected ? "#0369A1" : "#E2E8F0"}`, color: isSelected ? "#0369A1" : "#1E293B", fontWeight: 600, fontSize: 14, textAlign: "left", cursor: "pointer", fontFamily: "inherit", lineHeight: 1.5 }}
                    >
                      <span style={{ marginRight: 10, fontWeight: 800, color: isSelected ? "#0369A1" : "#94A3B8" }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
            {isLastQ ? (
              <button
                onClick={() => { if (confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
                style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >
                Submit Exam ✓
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: "#0369A1", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
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
                    border: isCurrent ? "2px solid #0369A1" : "1px solid #E2E8F0",
                    background: isCurrent ? "#EFF6FF" : isFlaggedQ ? "#FEF9C3" : isAnswered ? "#DCFCE7" : "#F8FAFC",
                    color: isCurrent ? "#0369A1" : isFlaggedQ ? "#A16207" : isAnswered ? "#15803D" : "#94A3B8",
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
            onClick={() => { if (confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
            style={{ width: "100%", marginTop: 14, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Submit Exam ✓
          </button>
        </div>
      </div>
    </div>
  );
}
