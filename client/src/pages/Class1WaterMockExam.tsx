// CLASS 1 WATER TREATMENT MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold · 8-module breakdown
// Mirrors OITMockExam.tsx structure

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import {
  CLASS1_WATER_QUESTIONS,
  CLASS1_WATER_MODULE_TARGETS,
  type Class1WaterQuestion,
} from "@/lib/class1WaterQuestions";
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
  "Water Sources & Quality":    { bg: "#DBEAFE", color: "#1D4ED8" },
  "Coagulation & Flocculation": { bg: "#FEF9C3", color: "#A16207" },
  "Sedimentation":              { bg: "#DCFCE7", color: "#15803D" },
  "Filtration":                 { bg: "#EDE9FE", color: "#6D28D9" },
  "Disinfection":               { bg: "#CCFBF1", color: "#0F766E" },
  "Chemical Feed & Dosing":     { bg: "#FFEDD5", color: "#C2410C" },
  "Iron & Manganese Removal":   { bg: "#FEE2E2", color: "#B91C1C" },
  "Water Quality & Regulations":{ bg: "#F0FDF4", color: "#166534" },
};

// Proportional module targets for 100 questions from 563-question bank
// Actual bank distribution:
//   Water Sources & Quality ~70, Coag/Floc ~55, Sedimentation ~55, Filtration ~70,
//   Disinfection ~70, Chem Feed ~60, Iron/Mn ~55, WQ&Regs ~55+
// Scale to 100 proportionally, rounding to exactly 100 total
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Water Sources & Quality":    13,
  "Coagulation & Flocculation": 12,
  "Sedimentation":              11,
  "Filtration":                 14,
  "Disinfection":               14,
  "Chemical Feed & Dosing":     12,
  "Iron & Manganese Removal":   12,
  "Water Quality & Regulations":12,
};

function selectExamQuestions(): Class1WaterQuestion[] {
  const pool = [...CLASS1_WATER_QUESTIONS].sort(() => Math.random() - 0.5);
  const selected: Class1WaterQuestion[] = [];
  for (const [mod, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const modQs = pool.filter(q => q.module === mod).slice(0, target);
    selected.push(...modQs);
  }
  // Top up to 100 if any module was short
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
  const key = "echelon_class1water_mock_session";
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

export default function Class1WaterMockExam() {
  usePageMeta({
    title: "Class 1 Water Treatment Timed Mock Exam",
    description: "100-question timed mock exam for the Ontario Class 1 Water Treatment operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results.",
    path: "/class1-water-mock",
    keywords: "Class 1 water treatment mock exam, Ontario operator exam, OWWCO Class 1, O. Reg. 128/04 practice test",
  });

  const [examState, setExamState]   = useState<ExamState>("intro");
  const [questions, setQuestions]   = useState<Class1WaterQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]       = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft]     = useState(EXAM_DURATION);
  const [flagged, setFlagged]       = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
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
      const modQs     = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.module === mod);
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
      examType: "class1",
      score: results.correct,
      total: EXAM_QUESTIONS,
      passed: results.passed,
      timeTakenSeconds: timeUsed,
      moduleBreakdown: moduleBreakdownRecord,
    });
  }, [examState, results]); // eslint-disable-line react-hooks/exhaustive-deps

  const timerColor = timeLeft < 600 ? "#DC2626" : timeLeft < 1800 ? "#D97706" : "#0369A1";
  const answered   = answers.filter(a => a.selected !== null).length;

  // -- INTRO SCREEN --
  if (examState === "intro") {
    return (
      <PurchaseGate examType="class1-water" productKey="class1-water" productName="Class 1 Water Treatment Practice Pass" price={149}>
        <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
          <SiteNav currentPath="/class1-water-mock" />
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 20px" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #0369A1, #0E7490)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>📝</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Class 1 Water Treatment Mock Exam</h1>
              <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20, lineHeight: 1.6 }}>
                Simulates the Ontario Class 1 Water Treatment certification exam. Covers all 8 exam modules proportionally.
              </p>

              {/* Province selector */}
              <div style={{ marginBottom: 24, textAlign: "left" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR PROVINCE</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PROVINCE_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedProvince(p.value)}
                      style={{
                        padding: "7px 12px", borderRadius: 20,
                        border: `2px solid ${selectedProvince === p.value ? "#0369A1" : "#E2E8F0"}`,
                        background: selectedProvince === p.value ? "#EFF6FF" : "#F8FAFC",
                        color: selectedProvince === p.value ? "#0369A1" : "#64748B",
                        fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
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

              {/* Exam stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "📝", label: "Questions",  value: "100 MCQ" },
                  { icon: "⏱️", label: "Time Limit", value: "2 Hours" },
                  { icon: "🎯", label: "Pass Mark",  value: "70% (70/100)" },
                  { icon: "📊", label: "Modules",    value: "8 Topics" },
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
                  {Object.entries(EXAM_MODULE_TARGETS).map(([mod, n]) => (
                    <span key={mod} style={{ padding: "3px 8px", borderRadius: 20, background: MODULE_COLORS[mod]?.bg ?? "#E0F2FE", color: MODULE_COLORS[mod]?.color ?? "#0369A1", fontSize: 10, fontWeight: 600 }}>
                      {mod}: {n}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={startExam}
                style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                🚀 Start Exam
              </button>
              <div style={{ marginTop: 16 }}>
                <Link href="/class1-water" style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>
                  &laquo; Back to Class 1 Water Practice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PurchaseGate>
    );
  }

  // -- RESULTS SCREEN --
  if (examState === "results" && results) {
    const { correct, score, passed, moduleBreakdown } = results;
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/class1-water-mock" />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 80px" }}>
          {/* Score hero */}
          <div style={{ background: passed ? "linear-gradient(135deg, #0369A1, #0E7490)" : "linear-gradient(135deg, #DC2626, #9B1C1C)", borderRadius: 20, padding: "36px 32px", textAlign: "center", color: "#fff", marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>{passed ? "🎉" : "📚"}</div>
            <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 4 }}>{Math.round(score * 100)}%</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{passed ? "PASSED" : "NOT YET"}</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {correct} / {EXAM_QUESTIONS} correct · {passed ? "You met the 70% pass threshold" : "70% required to pass"}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Correct",   value: correct, color: "#059669", bg: "#DCFCE7" },
              { label: "Incorrect", value: EXAM_QUESTIONS - correct - answers.filter(a => a.selected === null).length, color: "#DC2626", bg: "#FEE2E2" },
              { label: "Skipped",   value: answers.filter(a => a.selected === null).length, color: "#D97706", bg: "#FEF9C3" },
              { label: "Flagged",   value: flagged.length, color: "#7C3AED", bg: "#EDE9FE" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Score history */}
          <ScoreHistory sessionId={SESSION_ID} examType="class1" stream="water" />

          {/* Module breakdown */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>📊 Module Breakdown (Weakest First)</div>
            {moduleBreakdown.map(({ module, correct: mc, total, pct }) => {
              const ms       = MODULE_COLORS[module] ?? { bg: "#E0F2FE", color: "#0369A1" };
              const barColor = pct >= 0.7 ? "#22C55E" : pct >= 0.5 ? "#F59E0B" : "#EF4444";
              return (
                <div key={module} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ms.color }}>{module}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{mc}/{total} ({Math.round(pct * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Question review */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setShowReview(v => !v)}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "transparent", color: "#0F172A", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              {showReview ? "▲ Hide Question Review" : "▼ Review All Questions"}
            </button>
            {showReview && (
              <div style={{ marginTop: 16 }}>
                {questions.map((q, i) => {
                  const a         = answers[i];
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
                      <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginBottom: 4 }}>✓ {q.options[q.correct]}</div>
                      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, whiteSpace: "pre-line" }}>{q.explanation}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => { resultSavedRef.current = false; startExam(); }}
              style={{ flex: 1, minWidth: 140, padding: "14px 24px", borderRadius: 14, background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              🔄 Retake Exam
            </button>
            <Link href="/class1-water" style={{ flex: 1, minWidth: 140 }}>
              <button style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: "#fff", color: "#0369A1", fontWeight: 700, fontSize: 15, border: "1.5px solid #0369A1", cursor: "pointer", fontFamily: "inherit" }}>
                📝 Practice Mode
              </button>
            </Link>
            <Link href="/formulas-water1" target="_blank" style={{ flex: 1, minWidth: 140 }}>
              <button style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: "#F0FDF4", color: "#15803D", fontWeight: 700, fontSize: 15, border: "1.5px solid #22C55E", cursor: "pointer", fontFamily: "inherit" }}>
                📐 Water1 Formulas
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

  // -- ACTIVE EXAM SCREEN --
  if (!currentQ) return null;
  const isFlagged = flagged.includes(currentIdx);
  const isLastQ   = currentIdx === questions.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/class1-water-mock" />

      {/* Sticky exam header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
          Q {currentIdx + 1} <span style={{ color: "#94A3B8" }}>/ {EXAM_QUESTIONS}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>{answered}/{EXAM_QUESTIONS} answered</span>
          <div style={{ padding: "6px 14px", borderRadius: 20, background: timeLeft < 600 ? "#FEE2E2" : "#EFF6FF", color: timerColor, fontWeight: 800, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 80px", display: "grid", gridTemplateColumns: "1fr 240px", gap: 20, alignItems: "start" }}>
        {/* Question card */}
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ padding: "3px 10px", borderRadius: 100, background: MODULE_COLORS[currentQ.module]?.bg ?? "#E0F2FE", color: MODULE_COLORS[currentQ.module]?.color ?? "#0369A1", fontSize: 10, fontWeight: 700 }}>
                {currentQ.module}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: 100, background: currentQ.difficulty === "hard" ? "#FEE2E2" : currentQ.difficulty === "medium" ? "#FEF9C3" : "#DCFCE7", color: currentQ.difficulty === "hard" ? "#B91C1C" : currentQ.difficulty === "medium" ? "#A16207" : "#15803D", fontSize: 10, fontWeight: 700 }}>
                {currentQ.difficulty}
              </span>
              {isFlagged && <span style={{ padding: "3px 10px", borderRadius: 100, background: "#FEF9C3", color: "#A16207", fontSize: 10, fontWeight: 700 }}>🚩 Flagged</span>}
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", lineHeight: 1.65, marginBottom: 24 }}>
              {currentQ.question}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = currentAnswer === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    style={{
                      padding: "14px 18px", borderRadius: 12, textAlign: "left",
                      border: isSelected ? "2px solid #0369A1" : "1.5px solid #E2E8F0",
                      background: isSelected ? "#EFF6FF" : "#FAFAFA",
                      color: isSelected ? "#0369A1" : "#0F172A",
                      fontWeight: isSelected ? 700 : 500, fontSize: 14,
                      cursor: "pointer", fontFamily: "inherit", lineHeight: 1.5, transition: "all 0.1s",
                    }}
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
