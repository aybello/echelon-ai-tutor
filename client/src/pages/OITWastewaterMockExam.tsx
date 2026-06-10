// OIT WASTEWATER TREATMENT TIMED MOCK EXAM
// 50 questions · 1-hour timer · 70% pass threshold · 8-module breakdown
// Gate: requires oit-ww purchase pass
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import PurchaseGate from "@/components/PurchaseGate";
import { trpc } from "@/lib/trpc";
import ScoreHistory from "@/components/ScoreHistory";
import ReportErrorModal from "@/components/ReportErrorModal";
import ReviewAITutor from "@/components/ReviewAITutor";
import { toast } from "sonner";

const EXAM_DURATION  = 1 * 60 * 60; // 1 hour in seconds
const EXAM_QUESTIONS = 50;
const PASS_THRESHOLD = 0.7;

type ExamState = "intro" | "active" | "results";
interface ExamAnswer { questionIndex: number; selected: number | null; }

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Wastewater Characteristics & Sources": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Preliminary & Primary Treatment":      { bg: "#DCFCE7", color: "#15803D" },
  "Secondary & Biological Treatment":     { bg: "#EDE9FE", color: "#6D28D9" },
  "Disinfection & Effluent Quality":       { bg: "#FFEDD5", color: "#C2410C" },
  "Solids Handling & Biosolids":           { bg: "#FEE2E2", color: "#B91C1C" },
  "Wastewater Collection Systems":         { bg: "#CCFBF1", color: "#0F766E" },
  "Math & Calculations":                   { bg: "#FEF9C3", color: "#A16207" },
  "Pumping & Hydraulics":                  { bg: "#E0E7FF", color: "#4338CA" },
  "Ontario Regulations & Safety":          { bg: "#F0FDF4", color: "#166534" },
  "Lab & Monitoring":                      { bg: "#FDF2F8", color: "#9D174D" },
  "Nutrient Removal & Advanced Treatment": { bg: "#ECFDF5", color: "#047857" },
};

// Proportional module targets for 50 questions from 550-question bank
const EXAM_MODULE_TARGETS: Record<string, number> = {
  "Wastewater Characteristics & Sources": 5,
  "Preliminary & Primary Treatment":      5,
  "Secondary & Biological Treatment":     5,
  "Disinfection & Effluent Quality":       5,
  "Solids Handling & Biosolids":           5,
  "Wastewater Collection Systems":         5,
  "Math & Calculations":                   5,
  "Pumping & Hydraulics":                  4,
  "Ontario Regulations & Safety":          4,
  "Lab & Monitoring":                      4,
  "Nutrient Removal & Advanced Treatment": 3,
};

function selectExamQuestions(questionPool: DBQuestion[]): DBQuestion[] {
  const pool = [...questionPool].sort(() => Math.random() - 0.5);
  const selected: DBQuestion[] = [];
  for (const [mod, target] of Object.entries(EXAM_MODULE_TARGETS)) {
    const modQs = pool.filter((q: any) => q.module === mod).slice(0, target);
    selected.push(...modQs);
  }
  const selectedIds = new Set(selected.map((q: any) => q.id));
  const remaining = pool.filter((q: any) => !selectedIds.has(q.id));
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
  const key = "echelon_oit_ww_mock_session";
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

export default function OITWastewaterMockExam() {

  const { questions: allQuestions, modules: dbModules, moduleTargets: dbModuleTargets, isLoading: bankLoading, dbUnavailable } = useQuestionBank("oit-ww");
  
  usePageMeta({
    title: "OIT Wastewater Treatment Timed Mock Exam",
    description: "50-question timed mock exam for the Ontario OIT Wastewater Treatment operator certification. 1-hour timer, 70% pass threshold, and full module breakdown on results.",
    path: "/oit-ww-mock",
    keywords: "OIT wastewater treatment mock exam, Ontario operator exam, OWWCO OIT, O. Reg. 129/04 practice test",
  });

  const [examState, setExamState] = useState<ExamState>("intro");
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const [questions, setQuestions]   = useState<DBQuestion[]>([]);
  const [answers, setAnswers]       = useState<ExamAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(EXAM_DURATION);
  const [flagged, setFlagged]       = useState<number[]>([]);
  const [province, setProvince]     = useState("");
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveResult = trpc.exam.saveResult.useMutation();

  interface ResultsState {
    correct: number;
    total: number;
    passed: boolean;
    timeTaken: number;
    moduleBreakdown: Record<string, { correct: number; total: number }>;
  }
  const [results, setResults] = useState<ResultsState | null>(null);

  const startExam = useCallback(() => {
    const qs = selectExamQuestions(allQuestions);
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setFlagged([]);
    setTimeLeft(EXAM_DURATION);
    setExamState("active");
  }, []);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = answers.filter((a, i) => a.selected === (questions[i] as any)?.correctIndex).length;
    const passed  = correct / EXAM_QUESTIONS >= PASS_THRESHOLD;
    const timeTaken = EXAM_DURATION - timeLeft;

    const moduleBreakdown: Record<string, { correct: number; total: number }> = {};
    Object.keys(EXAM_MODULE_TARGETS).forEach(mod => {
      const modQs = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.module === mod);
      moduleBreakdown[mod] = {
        correct: modQs.filter(({ i }) => answers[i]?.selected === (questions[i] as any)?.correctIndex).length,
        total: modQs.length,
      };
    });

    setResults({ correct, total: EXAM_QUESTIONS, passed, timeTaken, moduleBreakdown });
    setExamState("results");

    saveResult.mutate({
      sessionId: SESSION_ID,
      examType: "oit-ww",
      stream: "wastewater",
      score: correct,
      total: EXAM_QUESTIONS,
      passed,
      timeTakenSeconds: timeTaken,
      moduleBreakdown,
    });
  }, [answers, questions, timeLeft, saveResult]);

  // Timer countdown
  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(); toast("⏱️ Time's up!", { description: "Your exam has been auto-submitted." }); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, handleSubmit]);

  const answered = answers.filter(a => a.selected !== null).length;
  const currentQ = questions[currentIdx];
  const isLastQ  = currentIdx === questions.length - 1;
  const isFlagged = flagged.includes(currentIdx);
  const isSelected = (i: number) => answers[currentIdx]?.selected === i;

  const toggleFlag = () => {
    setFlagged(f => f.includes(currentIdx) ? f.filter(x => x !== currentIdx) : [...f, currentIdx]);
  };

  const timerColor = useMemo(() => {
    if (timeLeft > 600) return "#0F766E";
    if (timeLeft > 300) return "#D97706";
    return "#DC2626";
  }, [timeLeft]);

  // ─── INTRO ───────────────────────────────────────────────────────────────────
  if (examState === "intro") {
    return (
      <PurchaseGate examType="oit-ww" productKey="oit-ww" productName="OIT Wastewater Practice Pass" price={49}>
        <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
          <SiteNav currentPath="/oit-ww-mock" />
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 16px" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #E2E8F0" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #065F46, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌿</div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#FFFFFF" }}>OIT Wastewater Treatment</h1>
                  <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>Timed Mock Exam · Ontario O. Reg. 129/04</p>
                </div>
              </div>

              {/* Exam stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Questions", value: "50", icon: "📝" },
                  { label: "Time Limit", value: "1 Hour", icon: "⏱️" },
                  { label: "Pass Mark", value: "70%", icon: "🎯" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: "#F0FDFA", borderRadius: 12, padding: "14px 12px", textAlign: "center", border: "1px solid #CCFBF1" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#065F46" }}>{value}</div>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Module coverage */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 10 }}>MODULE COVERAGE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(EXAM_MODULE_TARGETS).map(([mod, count]) => (
                    <span key={mod} style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: MODULE_COLORS[mod]?.bg ?? "#F1F5F9",
                      color: MODULE_COLORS[mod]?.color ?? "#E2E8F0",
                    }}>
                      {mod} ({count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Province selector */}
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="oit-ww-province-select" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                  Your Province / Territory <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional — for tailored tips)</span>
                </label>
                <select
                  id="oit-ww-province-select"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 14, color: "#FFFFFF", background: "#FFFFFF", fontFamily: "inherit" }}
                >
                  <option value="">Select province…</option>
                  {PROVINCE_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {province && PROVINCE_OPTIONS.find(p => p.value === province)?.regulator && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#0F766E" }}>
                    Regulator: <strong>{PROVINCE_OPTIONS.find(p => p.value === province)?.regulator}</strong>
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "14px 16px", marginBottom: 24, border: "1px solid #FDE68A" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>EXAM INSTRUCTIONS</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#78350F", lineHeight: 1.7 }}>
                  <li>50 multiple-choice questions drawn randomly from the OIT WW question bank</li>
                  <li>Timer starts immediately — 60 minutes total</li>
                  <li>Flag questions to review before submitting</li>
                  <li>You can navigate freely between questions</li>
                  <li>Exam auto-submits when time runs out</li>
                </ul>
              </div>

              {/* Score history */}
              <ScoreHistory sessionId={SESSION_ID} examType="oit-ww" />

              <button
                onClick={startExam}
                style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #065F46, #0F766E)", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
              >
                Start Exam →
              </button>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <Link href="/oit-ww" style={{ fontSize: 13, color: "#0F766E", textDecoration: "none" }}>
                  ← Back to OIT WW Practice Quiz
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PurchaseGate>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────────
  if (examState === "results" && results) {
    const pct = Math.round((results.correct / results.total) * 100);
    const passed = results.passed;
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
        <SiteNav currentPath="/oit-ww-mock" />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px" }}>
          {/* Score card */}
          <div style={{ background: passed ? "linear-gradient(135deg, #065F46, #0F766E)" : "linear-gradient(135deg, #991B1B, #B91C1C)", borderRadius: 20, padding: "32px", color: "#fff", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? "🎉" : "📚"}</div>
            <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 4 }}>{pct}%</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{passed ? "PASSED" : "NOT YET"}</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {results.correct} / {results.total} correct &nbsp;·&nbsp; Pass mark: 70%
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              Time used: {formatTime(results.timeTaken)}
            </div>
          </div>

          {/* Module breakdown */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 16 }}>MODULE BREAKDOWN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(results.moduleBreakdown).map(([mod, { correct: c, total: t }]) => {
                const modPct = t > 0 ? Math.round((c / t) * 100) : 0;
                const modColors = MODULE_COLORS[mod] ?? { bg: "#F8FAFC", color: "#64748B" };
                return (
                  <div key={mod}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{mod}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: modPct >= 70 ? "#15803D" : "#DC2626" }}>{c}/{t} ({modPct}%)</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#FFFFFF", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${modPct}%`, background: modPct >= 70 ? modColors.color : "#DC2626", borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score history */}
          <ScoreHistory sessionId={SESSION_ID} examType="oit-ww" />

          {/* Review all questions */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24, marginTop: 24, border: "1px solid #E2E8F0" }}>
            <button
              onClick={() => setShowReview(!showReview)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Review All Questions ({questions.length})</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>{showReview ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {showReview && (
              <div style={{ marginTop: 16 }}>
                {questions.map((q, i) => {
                  const userAns = answers[i]?.selected;
                  const isCorrect = userAns === ((q as any).correctIndex ?? (q as any).correct);
                  const isSkipped = userAns === null;
                  const isFlaggedQ = flagged.includes(i);
                  return (
                    <div key={i} style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, background: isSkipped ? "#F1F5F9" : isCorrect ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${isSkipped ? "#94A3B8" : isCorrect ? "#BBF7D0" : "#FED7AA"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Q{i + 1} · {q.module} {isFlaggedQ ? "🚩" : ""}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isSkipped ? "#E2E8F0" : isCorrect ? "#15803D" : "#C2410C" }}>
                          {isSkipped ? "Skipped" : isCorrect ? "✅ Correct" : "❌ Incorrect"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 8, lineHeight: 1.5 }}>{q.question}</div>
                      {!isSkipped && !isCorrect && (
                        <div style={{ fontSize: 12, color: "#92400E", marginBottom: 4 }}>
                          Your answer: <strong>{q.options[userAns!]}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#15803D", marginBottom: 6 }}>
                        Correct: <strong>{q.options[(q as any).correctIndex]}</strong>
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, whiteSpace: "pre-line", marginBottom: 4 }}>{q.explanation}</div>
                      )}
                      {(!isCorrect || isSkipped) && (
                        <ReviewAITutor
                          questionText={q.question}
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
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <button
              onClick={() => { setExamState("intro"); setResults(null); }}
              style={{ flex: 1, minWidth: 140, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #065F46, #0F766E)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              Retake Exam
            </button>
            <Link href="/oit-ww" style={{ flex: 1, minWidth: 140 }}>
              <button style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: "#FFFFFF", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                Practice Quiz
              </button>
            </Link>
            <Link href="/formulas-ww1" style={{ flex: 1, minWidth: 140 }}>
              <button style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #CCFBF1", background: "#F0FDFA", color: "#065F46", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                📐 Formula Sheet
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

  // ─── ACTIVE EXAM ─────────────────────────────────────────────────────────────
  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      {/* Sticky timer bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/oit-ww-mock" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 600 }}>
          🌿 OIT WW Mock
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#64748B" }}>{answered}/{EXAM_QUESTIONS} answered</span>
          <div style={{ background: timeLeft <= 300 ? "#FEE2E2" : "#F0FDFA", borderRadius: 10, padding: "6px 14px", border: `1.5px solid ${timerColor}` }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
          <button
            onClick={() => { if (confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
            style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#065F46", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "1fr 200px", gap: 20, alignItems: "start" }}>
        {/* DBQuestion card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0" }}>
          {currentQ && (
            <>
              {/* Module badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: MODULE_COLORS[currentQ.module]?.bg ?? "#F1F5F9",
                  color: MODULE_COLORS[currentQ.module]?.color ?? "#E2E8F0",
                }}>
                  {currentQ.module}
                </span>
                <span style={{ fontSize: 12, color: "#64748B" }}>Q{currentIdx + 1} of {EXAM_QUESTIONS}</span>
              </div>

              {/* DBQuestion text */}
              <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.6, marginBottom: 20 }}>
                {currentQ.question}
              </p>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {currentQ.options.map((opt, i) => {
                  const selected = isSelected(i);
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers(prev => prev.map((a, idx) => idx === currentIdx ? { ...a, selected: i } : a))}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "14px 16px", borderRadius: 12, textAlign: "left",
                        border: selected ? "2px solid #0F766E" : "1.5px solid #E2E8F0",
                        background: selected ? "#F0FDFA" : "#FAFAFA",
                        cursor: "pointer", fontFamily: "inherit", fontSize: 14, color: "#FFFFFF",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ marginRight: 10, fontWeight: 800, color: selected ? "#0F766E" : "#E2E8F0" }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: currentIdx === 0 ? "#94A3B8" : "#FFFFFF", fontWeight: 700, fontSize: 14, cursor: currentIdx === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  &laquo; Prev
                </button>
                <button
                  onClick={toggleFlag}
                  style={{ padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${isFlagged ? "#D97706" : "#94A3B8"}`, background: isFlagged ? "#FEF9C3" : "#fff", color: isFlagged ? "#A16207" : "#E2E8F0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {isFlagged ? "🚩 Flagged" : "🚩 Flag"}
                </button>
                {isLastQ ? (
                  <button
                    onClick={() => { if (confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
                    style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #065F46, #0F766E)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Submit Exam ✓
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                    style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, border: "none", background: "#0F766E", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Next &rarr;
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* DBQuestion navigator */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky", top: 70 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 10 }}>QUESTION NAVIGATOR</div>
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
                    border: isCurrent ? "2px solid #0F766E" : "1px solid #E2E8F0",
                    background: isCurrent ? "#F0FDFA" : isFlaggedQ ? "#FEF9C3" : isAnswered ? "#DCFCE7" : "#F8FAFC",
                    color: isCurrent ? "#0F766E" : isFlaggedQ ? "#A16207" : isAnswered ? "#15803D" : "#E2E8F0",
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
              { color: "#F8FAFC", textColor: "#E2E8F0", label: "Unanswered" },
            ].map(({ color, textColor, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: "1px solid #E2E8F0" }} />
                <span style={{ fontSize: 10, color: textColor, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { if (confirm(`Submit exam? You have answered ${answered}/${EXAM_QUESTIONS} questions.`)) handleSubmit(); }}
            style={{ width: "100%", marginTop: 14, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #065F46, #0F766E)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Submit Exam ✓
          </button>
        </div>
      </div>
    </div>
  );
}
