// Class 3 Wastewater Treatment Practice Quiz
// 502-question bank · 15-question free trial · paid full access via QuizGate
// Mirrors Class2WastewaterQuiz structure
import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  CLASS3_WW_QUESTIONS,
  CLASS3_WW_MODULES,
  type C3WWQuestion,
} from "@/lib/class3WastewaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";
import { CLASS3_WW_FORMULA_LINKS } from "@/lib/formulaLinks";

type QCompat = C3WWQuestion & { q: string };
function toCompat(q: C3WWQuestion): QCompat {
  return { ...q, q: q.question };
}

const DIFF_COLOR: Record<string, string> = {
  easy: "#059669",
  medium: "#D97706",
  hard: "#DC2626",
};
const DIFF_BG: Record<string, string> = {
  easy: "#DCFCE7",
  medium: "#FEF9C3",
  hard: "#FEE2E2",
};
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process Monitoring":        { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation":                 { bg: "#DCFCE7", color: "#15803D" },
  "Equipment Evaluation & Maintenance":  { bg: "#FFEDD5", color: "#C2410C" },
  "Laboratory Analysis":                 { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety & Admin":            { bg: "#FEE2E2", color: "#B91C1C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Treatment Process Monitoring":        "🔬",
  "Equipment Operation":                 "⚙️",
  "Equipment Evaluation & Maintenance":  "🔧",
  "Laboratory Analysis":                 "🧪",
  "Security, Safety & Admin":            "📋",
};

const SESSION_SIZE = 15;
const FREE_TRIAL_POOL = 60;

type HistoryEntry = {
  q: QCompat;
  selected: number;
  confidence: number;
  correct: boolean;
};

function getNextQ(history: HistoryEntry[], trialUnlocked: boolean, calcOnly = false): QCompat | null {
  const usedIds = new Set(history.map((h) => h.q.id));
  const pool = trialUnlocked
    ? CLASS3_WW_QUESTIONS
    : CLASS3_WW_QUESTIONS.slice(0, FREE_TRIAL_POOL);
  const calcPool = calcOnly ? pool.filter((q) => q.steps && q.steps.length > 0) : pool;
  const remaining = calcPool.filter((q) => !usedIds.has(q.id));
  if (remaining.length === 0) return null;
  const shuffled = shuffle([...remaining]);
  return toCompat(shuffled[0]);
}

export default function Class3WastewaterQuiz() {
  usePageMeta({
    title: "Class 3 Wastewater Treatment Practice",
    description: "Practice for your Ontario Class 3 Wastewater Treatment operator exam with 500+ questions, AI Tutor explanations, and a full 100-question mock exam.",
    path: "/class3-ww",
    keywords: "Class 3 wastewater treatment exam prep, Ontario operator certification, OWWCO, O. Reg. 128/04, BNR, MBR, anaerobic digestion, biosolids",
  });

  const [trialUnlockedState, setTrialUnlockedState] = useState(() => isTrialUnlocked());
  const [calcOnly, setCalcOnly] = useState(false);
  const initialQ = useMemo(() => toCompat(CLASS3_WW_QUESTIONS[0]), []);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [current, setCurrent] = useState<QCompat | null>(initialQ);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const [filterDiff, setFilterDiff] = useState<string | null>(null);

  const sessionCount = history.length;
  const trialDone = !trialUnlockedState && sessionCount >= SESSION_SIZE;

  const confirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const correct = selected === current.correct;
    setHistory((h) => [...h, { q: current, selected, confidence, correct }]);
    setConfirmed(true);
  }, [selected, confidence, current]);

  const next = useCallback(() => {
    if (trialDone) return;
    let pool = CLASS3_WW_QUESTIONS;
    if (!trialUnlockedState) pool = pool.slice(0, FREE_TRIAL_POOL);
    if (filterModule) pool = pool.filter((q) => q.module === filterModule);
    if (filterDiff) pool = pool.filter((q) => q.difficulty === filterDiff);
    const usedIds = new Set(history.map((h) => h.q.id));
    const remaining = pool.filter((q) => !usedIds.has(q.id));
    const shuffled = shuffle([...remaining]);
    setCurrent(shuffled.length > 0 ? toCompat(shuffled[0]) : null);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setReportOpen(false);
  }, [history, trialUnlockedState, trialDone, filterModule, filterDiff]);

  const sessionCorrect = history.filter((h) => h.correct).length;
  const accuracy = sessionCount > 0 ? Math.round((sessionCorrect / sessionCount) * 100) : null;

  const weakModules = useMemo(() => {
    const modStats: Record<string, { correct: number; total: number }> = {};
    for (const h of history) {
      const m = h.q.module;
      if (!modStats[m]) modStats[m] = { correct: 0, total: 0 };
      modStats[m].total++;
      if (h.correct) modStats[m].correct++;
    }
    return Object.entries(modStats)
      .filter(([, s]) => s.total >= 3 && s.correct / s.total < 0.6)
      .map(([m]) => m);
  }, [history]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/class3-ww" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0E7490 0%, #0F766E 100%)", padding: "32px 24px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🏭</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Class 3 Wastewater Treatment</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>Ontario Operator Certification — Advanced Level</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
              502 Questions
            </span>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
              5 Modules
            </span>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
              AI Tutor Included
            </span>
            <Link href="/formulas-ww3">
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", color: "#fff" }}>
                📐 Formula Sheet →
              </span>
            </Link>
            <Link href="/class3-ww-mock">
              <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", color: "#fff" }}>
                📋 Mock Exam →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>

        {/* Stats bar */}
        {sessionCount > 0 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", flex: 1, minWidth: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0E7490" }}>{sessionCount}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Answered</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", flex: 1, minWidth: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{sessionCorrect}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Correct</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", flex: 1, minWidth: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: accuracy !== null && accuracy >= 70 ? "#059669" : "#DC2626" }}>{accuracy ?? "--"}%</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Accuracy</div>
            </div>
          </div>
        )}

        {/* Weak module alert */}
        {weakModules.length > 0 && (
          <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400E" }}>
            ⚠️ <strong>Focus area:</strong> {weakModules.join(", ")} — below 60% accuracy
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <select
            value={filterModule ?? ""}
            onChange={(e) => setFilterModule(e.target.value || null)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, background: "#fff", cursor: "pointer" }}
          >
            <option value="">All Modules</option>
            {CLASS3_WW_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterDiff ?? ""}
            onChange={(e) => setFilterDiff(e.target.value || null)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, background: "#fff", cursor: "pointer" }}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <Link href="/class3-ww-mock">
            <button style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #0E7490", background: "transparent", color: "#0E7490", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              📝 Mock Exam
            </button>
          <button
            onClick={() => setCalcOnly(v => !v)}
            style={{ padding: "8px 14px", background: calcOnly ? "#EDE9FE" : "#fff", color: calcOnly ? "#7C3AED" : "#475569", border: calcOnly ? "1px solid #7C3AED" : "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            🧮 Calc Only
          </button>
          </Link>
        </div>

        {/* Trial gate overlay */}
        {trialDone && (
          <QuizGate
            questionsAnswered={sessionCount}
            productKey="class3-ww"
            productName="Class 3 Wastewater Treatment"
            priceLabel="CA$129"
            paidFeatures={[
              "502 questions across 5 modules",
              "Advanced process control & troubleshooting",
              "BNR, MBR, anaerobic digestion, biosolids",
              "AI Tutor explanations for every question",
              "Full 100-question timed mock exam",
              "Class 3-level difficulty calibration",
            ]}
            onUnlocked={() => {
              setTrialUnlocked();
              setTrialUnlockedState(true);
            }}
          />
        )}

        {/* Question card */}
        {!trialDone && current && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "24px", marginBottom: 16 }}>
            {/* Module + difficulty badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{
                background: MODULE_COLORS[current.module]?.bg ?? "#F1F5F9",
                color: MODULE_COLORS[current.module]?.color ?? "#475569",
                borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
              }}>
                {MODULE_ICONS[current.module] ?? "📚"} {current.module}
              </span>
              <span style={{
                background: DIFF_BG[current.difficulty],
                color: DIFF_COLOR[current.difficulty],
                borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
              }}>
                {current.difficulty.charAt(0).toUpperCase() + current.difficulty.slice(1)}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>Q {sessionCount + 1}</span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.6, marginBottom: 18 }}>
              {current.question}
            </p>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {current.options.map((opt, i) => {
                let bg = "#F8FAFC", border = "#E2E8F0", color = "#1E293B";
                if (confirmed) {
                  if (i === current.correct) { bg = "#DCFCE7"; border = "#22C55E"; color = "#166534"; }
                  else if (i === selected) { bg = "#FEE2E2"; border = "#EF4444"; color = "#991B1B"; }
                } else if (i === selected) { bg = "#EFF6FF"; border = "#3B82F6"; color = "#1D4ED8"; }
                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    style={{
                      background: bg, border: `2px solid ${border}`, color,
                      borderRadius: 10, padding: "12px 16px", textAlign: "left",
                      fontSize: 14, cursor: confirmed ? "default" : "pointer",
                      fontWeight: i === selected || (confirmed && i === current.correct) ? 700 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ marginRight: 8, opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {confirmed && i === current.correct && " ✓"}
                    {confirmed && i === selected && i !== current.correct && " ✗"}
                  </button>
                );
              })}
            </div>

            {/* Confidence meter */}
            {!confirmed && selected !== null && (
              <div style={{ marginBottom: 16 }}>
                <ConfidenceMeter value={confidence ?? 50} onChange={setConfidence} />
              </div>
            )}

            {/* Confirm / Next buttons */}
            {!confirmed ? (
              <button
                onClick={confirm}
                disabled={selected === null || confidence === null}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10,
                  background: selected !== null && confidence !== null ? "linear-gradient(135deg, #0E7490, #0F766E)" : "#E2E8F0",
                  color: selected !== null && confidence !== null ? "#fff" : "#94A3B8",
                  border: "none", fontSize: 15, fontWeight: 700, cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed",
                }}
              >
                Confirm Answer
              </button>
            ) : (
              <div>
                {/* Explanation */}
                <div style={{ background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#134E4A", lineHeight: 1.6 }}>
                    💡 <strong>Explanation:</strong> {current.explanation}
                  </p>
                  {CLASS3_WW_FORMULA_LINKS[current.id] && (
                    <a
                      href={CLASS3_WW_FORMULA_LINKS[current.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "7px 14px", borderRadius: 8, background: "#CCFBF1", border: "1px solid #99F6E4", color: "#0F766E", fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}
                    >
                      📐 View formula sheet ↗
                    </a>
                  )}
                </div>

                {/* Step solution toggle */}
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  style={{ background: "none", border: "none", color: "#0E7490", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 8 }}
                >
                  {showSteps ? "▼ Hide" : "▶ Show"} detailed breakdown
                </button>
                {showSteps && (
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px", marginBottom: 12, fontSize: 13, color: "#475569" }}>
                    <strong>Module:</strong> {current.module}<br />
                    <strong>Difficulty:</strong> {current.difficulty}<br />
                    <strong>Correct answer:</strong> {String.fromCharCode(65 + current.correct)}. {current.options[current.correct]}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setTutorOpen(!tutorOpen)}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #0E7490", background: "transparent", color: "#0E7490", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    🤖 Ask AI Tutor
                  </button>
                  <button
                    onClick={() => setReportOpen(true)}
                    style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "transparent", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}
                  >
                    🚩
                  </button>
                  <button
                    onClick={next}
                    style={{ flex: 2, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg, #0E7490, #0F766E)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Next Question →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Tutor */}
        {tutorOpen && confirmed && current && (
          <div style={{ marginBottom: 16 }}>
            <AITutor
              question={current as any}
              userAnswer={selected}
              history={[]}
              patternMode={false}
              onClose={() => setTutorOpen(false)}
            />
          </div>
        )}

        {/* Report error modal */}
        {reportOpen && current && (
          <ReportErrorModal
            questionId={current.id}
            questionText={current.question}
            module={current.module}
            onClose={() => setReportOpen(false)}
          />
        )}

        {/* No more questions */}
        {!trialDone && !current && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: "#0E7490", marginBottom: 8 }}>Session Complete!</h2>
            <p style={{ color: "#64748B", marginBottom: 20 }}>
              {sessionCorrect} / {sessionCount} correct ({accuracy}% accuracy)
            </p>
            <button
              onClick={() => { setHistory([]); setCurrent(toCompat(CLASS3_WW_QUESTIONS[0])); setSelected(null); setConfidence(null); setConfirmed(false); }}
              style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #0E7490, #0F766E)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              Start New Session
            </button>
          </div>
        )}

        {/* Module overview */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Exam Modules</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {CLASS3_WW_MODULES.map((m) => {
              const modHistory = history.filter((h) => h.q.module === m);
              const modCorrect = modHistory.filter((h) => h.correct).length;
              const modAcc = modHistory.length > 0 ? Math.round((modCorrect / modHistory.length) * 100) : null;
              return (
                <div
                  key={m}
                  onClick={() => setFilterModule(filterModule === m ? null : m)}
                  style={{
                    background: filterModule === m ? MODULE_COLORS[m]?.bg ?? "#F1F5F9" : "#fff",
                    border: `1.5px solid ${filterModule === m ? MODULE_COLORS[m]?.color ?? "#CBD5E1" : "#E2E8F0"}`,
                    borderRadius: 10, padding: "12px", cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{MODULE_ICONS[m] ?? "📚"}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>{m}</div>
                  {modAcc !== null && (
                    <div style={{ fontSize: 11, color: modAcc >= 70 ? "#059669" : "#DC2626", fontWeight: 600 }}>{modAcc}% accuracy</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
