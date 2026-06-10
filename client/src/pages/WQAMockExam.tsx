// WQA MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold · module breakdown
// Based on Ontario Water Quality Analyst (WQA) exam format (O. Reg. 248/03)
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import ScoreHistory from "@/components/ScoreHistory";
import { isTrialUnlocked } from "@/components/QuizGate";
import PurchaseGate from "@/components/PurchaseGate";
import { usePageMeta } from "@/hooks/usePageMeta";
import ReportErrorModal from "@/components/ReportErrorModal";
import ReviewAITutor from "@/components/ReviewAITutor";
import { toast } from "sonner";

const EXAM_DURATION  = 2 * 60 * 60; // 2 hours in seconds
const EXAM_QUESTIONS = 100;
const PASS_THRESHOLD = 0.7; // 70%

type ExamState = "intro" | "active" | "results";

interface ExamAnswer {
  questionIndex: number;
  selected: number | null;
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Math":                               { bg: "#EDE9FE", color: "#6D28D9" },
  "Science":                            { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory & Sampling":              { bg: "#E0F2FE", color: "#0369A1" },
  "Safety":                             { bg: "#FEE2E2", color: "#B91C1C" },
  "Water Characteristics":              { bg: "#DCFCE7", color: "#15803D" },
  "Bacteriological Testing":            { bg: "#FEF9C3", color: "#A16207" },
  "Chemical Testing":                   { bg: "#FFEDD5", color: "#C2410C" },
  "Disinfection":                       { bg: "#CCFBF1", color: "#0F766E" },
  "Quality Assurance & Quality Control":{ bg: "#F0FDF4", color: "#166534" },
  "Regulation":                         { bg: "#F5F3FF", color: "#5B21B6" },
};

// Convert DBQuestion → DBQuestion (for display compatibility)
let _idCounter = 91000;
const idMap = new Map<string, number>();
// Reverse map: numeric DBQuestion.id → original WQA string ID (for formula deep-links)
const reverseIdMap = new Map<number, string>();
function toQ(q: any): any {
  if (!idMap.has(String(q.id))) {
    idMap.set(String(q.id), _idCounter);
    reverseIdMap.set(_idCounter, String(q.id));
    _idCounter++;
  }
  return {
    id: idMap.get(String(q.id))!,
    module: q.module,
    type: "conceptual",
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correct: q.correctIndex,
    explanation: q.explanation,
    tip: "",
  };
}

function selectExamQuestions(allQuestions: any[], dbMods: string[]): any[] {
  // Proportional allocation matching the real WQA exam distribution
  const targetPerModule: Record<string, number> = {
    "Math":                               6,
    "Science":                            14,
    "Laboratory & Sampling":              19,
    "Safety":                             9,
    "Water Characteristics":              15,
    "Bacteriological Testing":            9,
    "Chemical Testing":                   6,
    "Disinfection":                       8,
    "Quality Assurance & Quality Control":11,
    "Regulation":                         3,
  };
  const selected: DBQuestion[] = [];
  for (const mod of dbMods) {
    const pool = allQuestions.filter((q: any) => q.module === mod).sort(() => Math.random() - 0.5);
    const n = targetPerModule[mod] ?? 5;
    selected.push(...pool.slice(0, n).map(toQ));
  }
  // Fill remaining to reach 100 if any module was short
  const usedIds = new Set(selected.map((q: any) => q.id));
  const remaining = allQuestions.map(toQ).filter((q: any) => !usedIds.has(q.id)).sort(() => Math.random() - 0.5);
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

export default function WQAMockExam() {

  const { questions: allQuestions, modules: dbModules, moduleTargets: dbModuleTargets, formulaLinks, isLoading: bankLoading, dbUnavailable } = useQuestionBank("wqa");
  
  usePageMeta({
    title: "WQA Timed Mock Exam — Water Quality Analyst",
    description: "100-question timed mock exam for the Ontario Water Quality Analyst (WQA) certification. 2-hour timer, 70% pass threshold, module breakdown on results.",
    path: "/wqa-mock",
    keywords: "WQA mock exam, Water Quality Analyst practice test, O. Reg. 248/03 exam, Ontario water quality certification",
  });

  // Persistent anonymous session ID for score history
  const [sessionId] = useState<string>(() => {
    const key = "echelon_session_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(key, id);
    }
    return id;
  });
  const saveResult = trpc.exam.saveResult.useMutation();
  const resultSavedRef = useRef(false);
  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlocked = isTrialUnlocked();

  const startExam = useCallback(() => {
    const qs = selectExamQuestions(allQuestions, dbModules);
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setFlagged([]);
    setShowReview(false);
    setExamState("active");
  }, []);

  // Timer
  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setExamState("results");
          toast("⏱️ Time's up!", { description: "Your exam has been auto-submitted." });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [examState]);

  const currentQ = questions[currentIdx];
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

  // Results calculations
  const results = useMemo(() => {
    if (examState !== "results" || questions.length === 0) return null;
    const correct = answers.filter((a, i) => a.selected === (questions[i] as any)?.correctIndex).length;
    const score = correct / EXAM_QUESTIONS;
    const passed = score >= PASS_THRESHOLD;
    const moduleBreakdown = dbModules.map(mod => {
      const modQs = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.module === mod);
      const modCorrect = modQs.filter(({ i }) => answers[i]?.selected === (questions[i] as any)?.correctIndex).length;
      return { module: mod, correct: modCorrect, total: modQs.length, pct: modQs.length > 0 ? modCorrect / modQs.length : 0 };
    }).filter(m => m.total > 0).sort((a, b) => a.pct - b.pct);
    return { correct, score, passed, moduleBreakdown };
  }, [examState, questions, answers]);

  // Save result to DB when exam transitions to results screen
  useEffect(() => {
    if (examState !== "results" || resultSavedRef.current || !results) return;
    resultSavedRef.current = true;
    const timeUsed = EXAM_DURATION - timeLeft;
    const moduleBreakdownRecord: Record<string, { correct: number; total: number }> = {};
    results.moduleBreakdown.forEach(m => {
      moduleBreakdownRecord[m.module] = { correct: m.correct, total: m.total };
    });
    saveResult.mutate({
      sessionId,
      examType: "wqa",
      score: results.correct,
      total: EXAM_QUESTIONS,
      passed: results.passed,
      timeTakenSeconds: timeUsed,
      moduleBreakdown: moduleBreakdownRecord,
    });
  }, [examState, results]); // eslint-disable-line react-hooks/exhaustive-deps

  const timerColor = timeLeft < 600 ? "#DC2626" : timeLeft < 1800 ? "#D97706" : "#0369A1";
  const answered = answers.filter(a => a.selected !== null).length;

  // -- INTRO SCREEN ----------------------------------------─  // -- INTRO SCREEN --
  if (examState === "intro") {
    return (
      <PurchaseGate examType="wqa" productKey="wqa" productName="WQA Practice Pass" price={149}>
      <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/wqa-mock" />   <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 20px" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #0369A1, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>🧪</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>WQA Mock Exam</h1>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 28, lineHeight: 1.6 }}>
              Simulates the Ontario Water Quality Analyst certification exam format under O. Reg. 248/03.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              {[
                { icon: "📝", label: "Questions", value: "100 MCQ" },
                { icon: "⏱️", label: "Time Limit", value: "2 Hours" },
                { icon: "🎯", label: "Pass Mark", value: "70% (70/100)" },
                { icon: "📊", label: "Modules", value: "10 Topics" },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ padding: "14px 16px", borderRadius: 12, background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>{value}</div>
                </div>
              ))}
            </div>
            {/* Module distribution */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "14px 16px", marginBottom: 28, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 10 }}>EXAM DISTRIBUTION</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  { mod: "Math", n: 6 }, { mod: "Science", n: 14 }, { mod: "Lab & Sampling", n: 19 },
                  { mod: "Safety", n: 9 }, { mod: "Water Characteristics", n: 15 }, { mod: "Bacteriological", n: 9 },
                  { mod: "Chemical Testing", n: 6 }, { mod: "Disinfection", n: 8 }, { mod: "QA/QC", n: 11 }, { mod: "Regulation", n: 3 },
                ].map(({ mod, n }) => (
                  <span key={mod} style={{ padding: "3px 8px", borderRadius: 20, background: "#E0F2FE", color: "#0369A1", fontSize: 10, fontWeight: 600 }}>
                    {mod}: {n}
                  </span>
                ))}
              </div>
            </div>
            {unlocked ? (
              <button onClick={startExam} style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: "linear-gradient(135deg, #0369A1, #0F766E)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                🚀 Start Exam
              </button>
            ) : (
              <div>
                <div style={{ padding: "14px 16px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FED7AA", marginBottom: 16, fontSize: 13, color: "#92400E" }}>
                  ⚠️ Complete 15 practice questions to unlock the mock exam.
                </div>
                <Link href="/wqa">
                  <button style={{ width: "100%", padding: "14px 24px", borderRadius: 14, background: "linear-gradient(135deg, #0369A1, #0F766E)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    🧪 Go to Practice Mode
                  </button>
                </Link>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Link href="/wqa" style={{ fontSize: 12, color: "#64748B", textDecoration: "none" }}>← Back to Practice Mode</Link>
            </div>
          </div>
        </div>
      </div>
      </PurchaseGate>
    );
  }

  // -- RESULTS SCREEN --------------------------------------------------------
  if (examState === "results" && results) {
    const { correct, score, passed, moduleBreakdown } = results;
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/wqa-mock" />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 80px" }}>
          {/* Score hero */}
          <div style={{ background: passed ? "linear-gradient(135deg, #0369A1, #0F766E)" : "linear-gradient(135deg, #DC2626, #9B1C1C)", borderRadius: 20, padding: "36px 32px", textAlign: "center", color: "#fff", marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
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
              { label: "Correct", value: correct, color: "#059669", bg: "#DCFCE7" },
              { label: "Incorrect", value: EXAM_QUESTIONS - correct - answers.filter(a => a.selected === null).length, color: "#DC2626", bg: "#FEE2E2" },
              { label: "Skipped", value: answers.filter(a => a.selected === null).length, color: "#D97706", bg: "#FEF9C3" },
              { label: "Flagged", value: flagged.length, color: "#7C3AED", bg: "#EDE9FE" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Module breakdown */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", marginBottom: 16 }}>📊 Module Breakdown (Weakest First)</div>
            {moduleBreakdown.map(({ module, correct: mc, total, pct }) => {
              const ms = MODULE_COLORS[module] ?? { bg: "#E0F2FE", color: "#0369A1" };
              const barColor = pct >= 0.7 ? "#22C55E" : pct >= 0.5 ? "#F59E0B" : "#EF4444";
              return (
                <div key={module} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ms.color }}>{module}</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{mc}/{total} ({Math.round(pct * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#FFFFFF", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score history */}
          <ScoreHistory sessionId={sessionId} examType="wqa" />

          {/* DBQuestion review */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setShowReview(!showReview)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>📋 Full DBQuestion Review</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>{showReview ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {showReview && (
              <div style={{ marginTop: 16 }}>
                {questions.map((q, i) => {
                  const userAns = answers[i]?.selected;
                  const isCorrect = userAns === ((q as any).correctIndex ?? (q as any).correct);
                  const isSkipped = userAns === null;
                  const isFlagged = flagged.includes(i);
                  return (
                    <div key={i} style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, background: isSkipped ? "#F1F5F9" : isCorrect ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${isSkipped ? "#94A3B8" : isCorrect ? "#BBF7D0" : "#FED7AA"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Q{i + 1} · {q.module} {isFlagged ? "🚩" : ""}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isSkipped ? "#E2E8F0" : isCorrect ? "#15803D" : "#C2410C" }}>
                          {isSkipped ? "Skipped" : isCorrect ? "✅ Correct" : "❌ Incorrect"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 8, lineHeight: 1.5 }}>{(q as any).question}</div>
                      {!isSkipped && !isCorrect && (
                        <div style={{ fontSize: 12, color: "#92400E", marginBottom: 4 }}>
                          Your answer: <strong>{q.options[userAns!]}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#15803D", marginBottom: 6 }}>
                        Correct: <strong>{q.options[(q as any).correctIndex]}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, whiteSpace: "pre-line" }}>{q.explanation}</div>
                      {/* Formula deep-link */}
                      {(() => {
                        const wqaId = reverseIdMap.get(q.id);
                        const formulaHref = wqaId ? (formulaLinks ?? {})[wqaId] : undefined;
                        if (!formulaHref) return null;
                        return (
                          <a
                            href={formulaHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "5px 12px", borderRadius: 8, background: "#CCFBF1", border: "1px solid #99F6E4", color: "#0F766E", fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}
                          >
                            📐 View formula sheet ↗
                          </a>
                        );
                      })()}
                      {(!isCorrect || isSkipped) && (
                        <ReviewAITutor
                          questionText={(q as any).question}
                          options={q.options}
                          correctIndex={(q as any).correctIndex}
                          userAnswerIndex={isSkipped ? null : (userAns ?? null)}
                          explanation={q.explanation}
                          module={q.module}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={startExam} style={{ flex: 1, padding: "14px 20px", borderRadius: 14, background: "linear-gradient(135deg, #0369A1, #0F766E)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              🔄 Retake Exam
            </button>
            <Link href="/wqa" style={{ flex: 1 }}>
              <button style={{ width: "100%", padding: "14px 20px", borderRadius: 14, background: "#EDE9FE", color: "#6D28D9", fontWeight: 700, fontSize: 14, border: "1px solid #C4B5FD", cursor: "pointer", fontFamily: "inherit" }}>
                🧪 Practice Mode
              </button>
            </Link>
            <Link href="/formulas-wqa" style={{ flex: 1 }}>
              <button style={{ width: "100%", padding: "14px 20px", borderRadius: 14, background: "#CCFBF1", color: "#0F766E", fontWeight: 700, fontSize: 14, border: "1px solid #99F6E4", cursor: "pointer", fontFamily: "inherit" }}>
                📐 WQA Formulas
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

  // -- ACTIVE EXAM ----------------------------------------------------------─
  if (!currentQ) return null;

  const modStyle = MODULE_COLORS[currentQ.module] ?? { bg: "#E0F2FE", color: "#0369A1" };
  const isFlagged = flagged.includes(currentIdx);

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        .wqa-exam-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        @media (max-width: 640px) {
          .wqa-exam-grid { grid-template-columns: repeat(8, 1fr) !important; }
          .wqa-exam-main { padding: 16px 14px 80px !important; }
        }
      `}</style>

      {/* Sticky header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0369A1, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>E</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#FFFFFF" }}>WQA MOCK EXAM</div>
              <div style={{ fontSize: 10, color: "#64748B" }}>Q{currentIdx + 1}/{EXAM_QUESTIONS} · {answered} answered</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: timerColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <Link href="/formulas-wqa" target="_blank">
              <button style={{ padding: "8px 14px", borderRadius: 10, background: "#CCFBF1", color: "#0F766E", fontWeight: 700, fontSize: 12, border: "1px solid #99F6E4", cursor: "pointer", fontFamily: "inherit" }}>
                📐 Formulas
              </button>
            </Link>
            <button
              onClick={() => { if (window.confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
              style={{ padding: "8px 16px", borderRadius: 10, background: "#FEE2E2", color: "#B91C1C", fontWeight: 700, fontSize: 12, border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" }}
            >
              Submit
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#94A3B8" }}>
          <div style={{ height: "100%", width: `${(answered / EXAM_QUESTIONS) * 100}%`, background: "linear-gradient(90deg, #0369A1, #0F766E)", transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div className="wqa-exam-main" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px", display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, alignItems: "start" }}>

        {/* DBQuestion panel */}
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 12 }}>
            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: modStyle.bg, color: modStyle.color, fontSize: 10, fontWeight: 700 }}>{currentQ.module}</span>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: (currentQ.difficulty ?? 'medium') === "easy" ? "#DCFCE7" : (currentQ.difficulty ?? 'medium') === "medium" ? "#FEF9C3" : "#FEE2E2", color: (currentQ.difficulty ?? 'medium') === "easy" ? "#15803D" : (currentQ.difficulty ?? 'medium') === "medium" ? "#A16207" : "#B91C1C", fontSize: 10, fontWeight: 700 }}>{(currentQ.difficulty ?? 'medium').toUpperCase()}</span>
              </div>
              <button onClick={toggleFlag} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${isFlagged ? "#7C3AED" : "#94A3B8"}`, background: isFlagged ? "#EDE9FE" : "#F8FAFC", color: isFlagged ? "#7C3AED" : "#E2E8F0", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isFlagged ? "🚩 Flagged" : "⚑ Flag"}
              </button>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.6, marginBottom: 20 }}>{currentQ.question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentAnswer === idx;
                return (
                  <button
                    key={idx}
                    className="wqa-exam-opt"
                    onClick={() => handleAnswer(idx)}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${isSelected ? "#0369A1" : "#94A3B8"}`, background: isSelected ? "#E0F2FE" : "#F8FAFC", color: isSelected ? "#0369A1" : "#E2E8F0", fontSize: 13, fontWeight: 600, textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", lineHeight: 1.5 }}
                  >
                    <span style={{ fontWeight: 800, marginRight: 8, opacity: 0.5 }}>{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 700, fontSize: 13, cursor: currentIdx === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: currentIdx === 0 ? 0.4 : 1 }}>
              ← Previous
            </button>
            <button onClick={() => setCurrentIdx(i => Math.min(EXAM_QUESTIONS - 1, i + 1))} disabled={currentIdx === EXAM_QUESTIONS - 1} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "linear-gradient(135deg, #0369A1, #0F766E)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: currentIdx === EXAM_QUESTIONS - 1 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: currentIdx === EXAM_QUESTIONS - 1 ? 0.5 : 1 }}>
              Next →
            </button>
          </div>
        </div>

        {/* DBQuestion navigator */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky", top: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 10 }}>NAVIGATOR</div>
          <div className="wqa-exam-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 14 }}>
            {Array.from({ length: EXAM_QUESTIONS }, (_, i) => {
              const isAnswered = answers[i]?.selected !== null;
              const isCurrent = i === currentIdx;
              const isFl = flagged.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{ width: "100%", aspectRatio: "1", borderRadius: 6, border: `1.5px solid ${isCurrent ? "#0369A1" : isFl ? "#7C3AED" : isAnswered ? "#22C55E" : "#94A3B8"}`, background: isCurrent ? "#E0F2FE" : isFl ? "#EDE9FE" : isAnswered ? "#F0FDF4" : "#F8FAFC", color: isCurrent ? "#0369A1" : isFl ? "#7C3AED" : isAnswered ? "#15803D" : "#E2E8F0", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.8 }}>
            <div>🟩 Answered ({answered})</div>
            <div>⬜ Unanswered ({EXAM_QUESTIONS - answered})</div>
            <div>🟪 Flagged ({flagged.length})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
