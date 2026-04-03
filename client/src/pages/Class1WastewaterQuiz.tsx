// Class 1 Wastewater Treatment Practice Quiz
// 601-question bank · 15-question free trial · paid full access via PurchaseGate
// Mirrors Class1WaterQuiz structure

import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  CLASS1_WASTEWATER_QUESTIONS,
  CLASS1_WASTEWATER_MODULES,
  type Class1WastewaterQuestion,
} from "@/lib/class1WastewaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";

type QCompat = Class1WastewaterQuestion & { q: string; wrongExp?: Record<number, string> };

function toCompat(q: Class1WastewaterQuestion): QCompat {
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
  "Wastewater Characteristics & Preliminary Treatment": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Preliminary Treatment":  { bg: "#DBEAFE", color: "#1D4ED8" },
  "Primary Treatment":      { bg: "#DCFCE7", color: "#15803D" },
  "Secondary Treatment":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Secondary Treatment -- Activated Sludge": { bg: "#EDE9FE", color: "#6D28D9" },
  "Biological Nutrient Removal": { bg: "#CCFBF1", color: "#0F766E" },
  "Tertiary Treatment & Filtration": { bg: "#FEF9C3", color: "#A16207" },
  "Disinfection":           { bg: "#FFEDD5", color: "#C2410C" },
  "Solids Handling":        { bg: "#FEE2E2", color: "#B91C1C" },
  "Solids Handling & Biosolids": { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulations, Safety & Operations": { bg: "#F0FDF4", color: "#166534" },
};
const MODULE_ICONS: Record<string, string> = {
  "Wastewater Characteristics & Preliminary Treatment": "🌊",
  "Preliminary Treatment":  "🌊",
  "Primary Treatment":      "🪣",
  "Secondary Treatment":    "🦠",
  "Secondary Treatment -- Activated Sludge": "🦠",
  "Biological Nutrient Removal": "🔬",
  "Tertiary Treatment & Filtration": "💧",
  "Disinfection":           "🧪",
  "Solids Handling":        "♻️",
  "Solids Handling & Biosolids": "♻️",
  "Regulations, Safety & Operations": "📋",
};

const SESSION_SIZE = 15;

type HistoryEntry = {
  q: QCompat;
  selected: number;
  confidence: number;
  correct: boolean;
};

function getNextQ(history: HistoryEntry[], trialUnlocked: boolean): QCompat | null {
  const usedIds = new Set(history.map((h) => h.q.id));
  const pool = trialUnlocked
    ? CLASS1_WASTEWATER_QUESTIONS
    : CLASS1_WASTEWATER_QUESTIONS.slice(0, 60); // first 60 for free trial
  const remaining = pool.filter((q) => !usedIds.has(q.id));
  if (remaining.length === 0) return null;
  const shuffled = shuffle([...remaining]);
  return toCompat(shuffled[0]);
}

export default function Class1WastewaterQuiz() {
  usePageMeta({
    title: "Class 1 Wastewater Treatment Practice",
    description: "Practice for your Ontario Class 1 Wastewater Treatment operator exam with 500+ questions, AI Tutor explanations, and a full 100-question mock exam.",
    path: "/class1-ww",
    keywords: "Class 1 wastewater treatment exam prep, Ontario operator certification, OWWCO, O. Reg. 128/04 practice questions",
  });

  const [trialUnlockedState, setTrialUnlockedState] = useState(() => isTrialUnlocked());
  const initialQ = useMemo(() => toCompat(CLASS1_WASTEWATER_QUESTIONS[0]), []);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [current, setCurrent] = useState<QCompat | null>(initialQ);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const sessionCount = history.length % SESSION_SIZE;
  const totalAnswered = history.length;

  const resetSession = useCallback(() => {
    const nextQ = getNextQ([], trialUnlockedState);
    setCurrent(nextQ);
    setHistory([]);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setShowGate(false);
  }, [trialUnlockedState]);

  const confirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const isCorrect = selected === current.correct;
    const entry: HistoryEntry = {
      q: current,
      selected,
      confidence,
      correct: isCorrect,
    };
    setHistory((prev) => [...prev, entry]);
    setConfirmed(true);
  }, [selected, confidence, current]);

  const next = useCallback(() => {
    const newHistory = [...history, { q: current!, selected: selected!, confidence: confidence!, correct: selected === current!.correct }];
    const newCount = newHistory.length;

    // Show gate after SESSION_SIZE questions if not unlocked
    if (!trialUnlockedState && newCount % SESSION_SIZE === 0) {
      setShowGate(true);
      return;
    }

    const nextQ = getNextQ(newHistory, trialUnlockedState);
    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history, current, selected, confidence, trialUnlockedState]);

  // Stats
  const correctCount = history.filter((h) => h.correct).length;
  const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;

  const moduleStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    history.forEach((h) => {
      const mod = h.q.module;
      if (!stats[mod]) stats[mod] = { correct: 0, total: 0 };
      stats[mod].total++;
      if (h.correct) stats[mod].correct++;
    });
    return stats;
  }, [history]);

  if (!current && history.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <SiteNav currentPath="/class1-ww" />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦠</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>No questions available</h2>
          <p style={{ color: "#64748B" }}>Please refresh the page to start a new session.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/class1-ww" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={{ fontSize: 13, color: "#64748B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            ← Back to Home
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>🦠</span>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: 0 }}>Class 1 Wastewater Treatment</h1>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Ontario Operator Exam Practice — 500+ Questions</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <Link href="/formulas-ww1" style={{ textDecoration: "none" }}>
              <span style={{ background: "#EFF6FF", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#0369A1", cursor: "pointer" }}>📐 Formula Sheet →</span>
            </Link>
            <Link href="/class1-ww-mock" style={{ textDecoration: "none" }}>
              <span style={{ background: "#F0FDF4", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#15803D", cursor: "pointer" }}>📋 Mock Exam →</span>
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: "#E2E8F0", borderRadius: 8, height: 6, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #0369A1, #0E7490)", borderRadius: 8, width: `${trialUnlockedState ? Math.min((totalAnswered / 601) * 100, 100) : Math.min((sessionCount / SESSION_SIZE) * 100, 100)}%`, transition: "width 0.4s ease" }} />
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 100, background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em" }}>ANSWERED</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1E293B" }}>{totalAnswered}</div>
          </div>
          <div style={{ flex: 1, minWidth: 100, background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em" }}>ACCURACY</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accuracy >= 70 ? "#059669" : "#DC2626" }}>{accuracy}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 100, background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em" }}>BANK SIZE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0369A1" }}>500+</div>
          </div>
        </div>

        {/* Question card */}
        {current && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", border: "1px solid #E2E8F0", marginBottom: 16 }}>
            {/* Module badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                background: MODULE_COLORS[current.module]?.bg ?? "#F1F5F9",
                color: MODULE_COLORS[current.module]?.color ?? "#475569",
                letterSpacing: "0.06em"
              }}>
                {MODULE_ICONS[current.module] ?? "📚"} {current.module}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                background: DIFF_BG[current.difficulty] ?? "#F1F5F9",
                color: DIFF_COLOR[current.difficulty] ?? "#475569",
                letterSpacing: "0.06em", textTransform: "uppercase"
              }}>
                {current.difficulty}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#94A3B8" }}>#{current.id}</span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.6, marginBottom: 20 }}>
              {current.question}
            </p>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map((opt, i) => {
                let bg = "#F8FAFC", border = "1.5px solid #E2E8F0", color = "#1E293B";
                if (selected === i && !confirmed) { bg = "#EFF6FF"; border = "1.5px solid #0369A1"; color = "#0369A1"; }
                if (confirmed) {
                  if (i === current.correct) { bg = "#F0FDF4"; border = "1.5px solid #86EFAC"; color = "#15803D"; }
                  else if (i === selected && i !== current.correct) { bg = "#FEF2F2"; border = "1.5px solid #FCA5A5"; color = "#DC2626"; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    style={{ padding: "13px 16px", borderRadius: 12, background: bg, border, color, fontWeight: 600, fontSize: 14, textAlign: "left", cursor: confirmed ? "default" : "pointer", fontFamily: "inherit", lineHeight: 1.5 }}
                  >
                    <span style={{ fontWeight: 800, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>{opt}
                  </button>
                );
              })}
            </div>

            {/* Confidence meter */}
            {selected !== null && !confirmed && (
              <div style={{ marginTop: 20 }}>
                <ConfidenceMeter value={confidence} onChange={setConfidence} />
              </div>
            )}

            {/* Confirm / Next buttons */}
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!confirmed ? (
                <button
                  onClick={confirm}
                  disabled={selected === null || confidence === null}
                  style={{ flex: 1, padding: "13px 20px", borderRadius: 12, background: selected !== null && confidence !== null ? "linear-gradient(135deg, #0369A1, #0E7490)" : "#E2E8F0", color: selected !== null && confidence !== null ? "#fff" : "#94A3B8", fontWeight: 800, fontSize: 15, border: "none", cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                >
                  Confirm Answer
                </button>
              ) : (
                <>
                  <button
                    onClick={next}
                    style={{ flex: 1, padding: "13px 20px", borderRadius: 12, background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Next Question →
                  </button>
                  <button
                    onClick={() => setShowSteps(v => !v)}
                    style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: showSteps ? "#EFF6FF" : "#fff", color: showSteps ? "#0369A1" : "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {showSteps ? "Hide" : "Explain"}
                  </button>
                  <button
                    onClick={() => setTutorOpen(v => !v)}
                    style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: tutorOpen ? "#EFF6FF" : "#fff", color: tutorOpen ? "#0369A1" : "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    🤖 AI Tutor
                  </button>
                </>
              )}
            </div>

            {/* Explanation */}
            {confirmed && showSteps && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginTop: 8, padding: "14px 16px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", letterSpacing: "0.08em", marginBottom: 6 }}>EXPLANATION</div>
                  <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.65 }}>{current.explanation}</div>
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

        {/* Report error */}
        {current && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setReportModalOpen(true)}
              style={{ fontSize: 11, color: "#CBD5E1", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Report an error with this question
            </button>
          </div>
        )}

        {/* Module breakdown */}
        {Object.keys(moduleStats).length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #E2E8F0", marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>Module Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(moduleStats).map(([mod, stat]) => (
                <div key={mod} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#475569", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stat.correct / stat.total >= 0.7 ? "#059669" : "#DC2626", whiteSpace: "nowrap" }}>
                    {stat.correct}/{stat.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Gate */}
      {showGate && (
        <QuizGate
          questionsAnswered={history.length}
          productKey="class1-ww"
          productName="Class 1 Wastewater Treatment Practice Pass"
          priceLabel="CA$79"
          paidFeatures={[
            "Full 500+ question bank — unlimited attempts",
            "Class 1 Wastewater Mock Exam (100 questions, 2-hour timer)",
            "AI Tutor explanations on every question",
            "Score history & module breakdown",
          ]}
          onUnlocked={() => {
            setTrialUnlocked();
            setTrialUnlockedState(true);
            setShowGate(false);
            const nextQ = getNextQ(history, true);
            if (nextQ) {
              setCurrent(nextQ);
              setSelected(null);
              setConfidence(null);
              setConfirmed(false);
              setShowSteps(false);
              setTutorOpen(false);
            } else {
              setCurrent(null);
            }
          }}
          onDismiss={() => {
            setShowGate(false);
            resetSession();
          }}
        />
      )}

      {reportModalOpen && current && (
        <ReportErrorModal
          questionId={current.id}
          questionText={current.question}
          module={current.module}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}
