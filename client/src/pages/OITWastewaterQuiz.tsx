// OIT WASTEWATER QUIZ
// 500+ questions from Class 1 WW bank · 15-question free trial · paid full access via PurchaseGate
// Covers: wastewater collection, treatment principles, Ontario O. Reg. 129/04, safety

import { useState, useCallback, useMemo } from "react";
import { Link, useSearch} from "wouter";
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
import { type Question } from "@/lib/questions";

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
  questionObj?: QCompat;
};

function getNextQ(history: HistoryEntry[], trialUnlocked: boolean, mod?: string | null, calcOnly = false): QCompat | null {
  const usedIds = new Set(history.map((h) => h.q.id));
  const base = mod ? CLASS1_WASTEWATER_QUESTIONS.filter(q => q.module === mod) : CLASS1_WASTEWATER_QUESTIONS;
  const basePool = trialUnlocked ? base : base.slice(0, 60);
  const pool = calcOnly ? basePool.filter((q) => q.isCalc) : basePool;
  const remaining = pool.filter((q) => !usedIds.has(q.id));
  if (remaining.length === 0) return null;
  const shuffled = shuffle([...remaining]);
  return toCompat(shuffled[0]);
}

export default function OITWastewaterQuiz() {
  usePageMeta({
    title: "OIT Wastewater Practice Quiz — Ontario Operator Exam Prep",
    description: "Practice for your Ontario OIT Wastewater operator exam with 500+ questions covering collection systems, treatment principles, O. Reg. 129/04, and safety. AI Tutor included.",
    path: "/oit-ww",
    keywords: "OIT wastewater exam prep, Ontario operator in training wastewater, OWWCO OIT, O. Reg. 129/04 practice questions, wastewater operator certification",
  });

  const [trialUnlockedState, setTrialUnlockedState] = useState(() => isTrialUnlocked());
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const searchString = useSearch();
  const initialCalcOnly = new URLSearchParams(searchString).get("calcOnly") === "true";
    const [calcOnly, setCalcOnly] = useState(initialCalcOnly);
  const [showModuleSelector, setShowModuleSelector] = useState(false);

  const getPool = useCallback((mod: string | null, unlocked: boolean) => {
    const base = mod ? CLASS1_WASTEWATER_QUESTIONS.filter(q => q.module === mod) : CLASS1_WASTEWATER_QUESTIONS;
    return unlocked ? base : base.slice(0, 60);
  }, []);

  const initialQ = useMemo(() => toCompat(CLASS1_WASTEWATER_QUESTIONS[0]), []);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [current, setCurrent] = useState<QCompat | null>(initialQ);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const sessionCount = history.length % SESSION_SIZE;
  const totalAnswered = history.length;
  const accuracy = totalAnswered === 0 ? 0 : Math.round((history.filter(h => h.correct).length / totalAnswered) * 100);

  const resetSession = useCallback(() => {
    const nextQ = getNextQ([], trialUnlockedState);
    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setTutorOpen(false);
  }, [trialUnlockedState]);
  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const isCorrect = selected === current.correct;
    const newHistory: HistoryEntry[] = [...history, { q: current, selected, confidence, correct: isCorrect, questionObj: current }];
    setHistory(newHistory);
    setConfirmed(true);

    const newSessionCount = newHistory.length % SESSION_SIZE;
    if (!trialUnlockedState && newHistory.length >= SESSION_SIZE && newSessionCount === 0) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlockedState]);

  const handleNext = useCallback(() => {
    if (!current) return;
    const nextQ = getNextQ(history, trialUnlockedState, selectedModule);
    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setTutorOpen(false);
  }, [current, history, trialUnlockedState, selectedModule]);
  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrent(prev.questionObj ?? prev.q);
    setSelected(prev.selected);
    setConfidence(prev.confidence);
    setConfirmed(true);
    setTutorOpen(false);
    setShowGate(false);
  }, [history]);

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
        <SiteNav currentPath="/oit-ww" />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1E293B", marginBottom: 8 }}>No questions available</h2>
          <p style={{ color: "#64748B" }}>Please refresh the page to start a new session.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath="/oit-ww" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #065F46 0%, #0F766E 100%)", color: "#fff", padding: "24px 16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.75, textTransform: "uppercase", marginBottom: 4 }}>Echelon Institute</div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>OIT Wastewater</h1>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Practice Quiz · 500+ Questions · Operator-in-Training</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/formulas-ww1">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📐 Formula Sheet
                </button>
              </Link>
              <Link href="/oit-ww-mock">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📋 Mock Exam
                </button>
              </Link>
            </div>
          </div>
          {/* Stats bar */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Answered", value: totalAnswered },
              { label: "Correct", value: history.filter(h => h.correct).length },
              { label: "Accuracy", value: `${accuracy}%` },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module selector */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 0" }}>
        <button
          onClick={() => setShowModuleSelector(!showModuleSelector)}
          style={{ fontSize: 12, fontWeight: 600, color: "#0F766E", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {selectedModule ? `📚 Module: ${selectedModule}` : "📚 All Modules"} {showModuleSelector ? "▲" : "▼"}
        </button>
          <button
            onClick={() => {
                const newCalcOnly = !calcOnly;
                setCalcOnly(newCalcOnly);
                const newPool = newCalcOnly ? CLASS1_WASTEWATER_QUESTIONS.filter(q => q.isCalc) : CLASS1_WASTEWATER_QUESTIONS;
                const next = newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null;
                setCurrent(next);
                setHistory([]);
                setSelected(null);
                setConfidence(null);
                setConfirmed(false);
              }}
            style={{ padding: "8px 14px", background: calcOnly ? "#EDE9FE" : "#fff", color: calcOnly ? "#7C3AED" : "#475569", border: calcOnly ? "1px solid #7C3AED" : "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            🧮 Calc Only
          </button>
        {showModuleSelector && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <button
              onClick={() => { setSelectedModule(null); setShowModuleSelector(false); }}
              style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: !selectedModule ? "#0F766E" : "#F1F5F9", color: !selectedModule ? "#fff" : "#475569", border: "none" }}
            >
              All
            </button>
            {CLASS1_WASTEWATER_MODULES.map(mod => (
              <button
                key={mod}
                onClick={() => { setSelectedModule(mod); setShowModuleSelector(false); }}
                style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: selectedModule === mod ? "#0F766E" : "#F1F5F9", color: selectedModule === mod ? "#fff" : "#475569", border: "none" }}
              >
                {MODULE_ICONS[mod] ?? "📖"} {mod}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Question card */}
      {current && (
        <div style={{ maxWidth: 720, margin: "16px auto", padding: "0 16px" }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E2E8F0", padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {/* Module + difficulty badge */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: MODULE_COLORS[current.module]?.bg ?? "#F1F5F9", color: MODULE_COLORS[current.module]?.color ?? "#475569" }}>
                {MODULE_ICONS[current.module] ?? "📖"} {current.module}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: DIFF_BG[current.difficulty], color: DIFF_COLOR[current.difficulty] }}>
                {current.difficulty}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#F1F5F9", color: "#64748B" }}>
                #{current.id}
              </span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", lineHeight: 1.6, marginBottom: 20 }}>
              {current.question}
            </p>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {current.options.map((opt, i) => {
                let bg = "#F8FAFC";
                let border = "1.5px solid #E2E8F0";
                let color = "#1E293B";
                if (confirmed) {
                  if (i === current.correct) { bg = "#DCFCE7"; border = "1.5px solid #86EFAC"; color = "#166534"; }
                  else if (i === selected) { bg = "#FEE2E2"; border = "1.5px solid #FCA5A5"; color = "#991B1B"; }
                } else if (selected === i) {
                  bg = "#EFF6FF"; border = "1.5px solid #93C5FD"; color = "#1D4ED8";
                }
                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    style={{ textAlign: "left", padding: "12px 16px", borderRadius: 10, background: bg, border, color, fontSize: 14, fontWeight: 500, cursor: confirmed ? "default" : "pointer", fontFamily: "inherit", lineHeight: 1.5, transition: "all 0.1s" }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Confidence meter */}
            {!confirmed && selected !== null && (
              <ConfidenceMeter value={confidence} onChange={setConfidence} />
            )}

            {/* Confirm button */}
            {!confirmed && selected !== null && confidence !== null && (
              <button
                onClick={handleConfirm}
                style={{ width: "100%", padding: "13px", borderRadius: 10, background: "linear-gradient(135deg, #065F46, #0F766E)", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}
              >
                Confirm Answer →
              </button>
            )}

            {/* Explanation */}
            {confirmed && (
              <div style={{ marginTop: 16 }}>
                <div style={{ background: selected === current.correct ? "#F0FDF4" : "#FFF1F2", border: `1.5px solid ${selected === current.correct ? "#86EFAC" : "#FCA5A5"}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: selected === current.correct ? "#166534" : "#991B1B", marginBottom: 6 }}>
                    {selected === current.correct ? "✅ Correct!" : "❌ Incorrect"}
                  </div>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{current.explanation}</p>
                </div>

                {/* Tip */}
                {(current as any).tip && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#92400E" }}>
                    💡 <strong>Tip:</strong> {(current as any).tip}
                  </div>
                )}

                {/* AI Tutor toggle */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <button
                    onClick={() => setTutorOpen(!tutorOpen)}
                    style={{ padding: "8px 14px", borderRadius: 8, background: tutorOpen ? "#0F766E" : "#F0FDFA", color: tutorOpen ? "#fff" : "#0F766E", border: "1.5px solid #99F6E4", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    🤖 {tutorOpen ? "Close AI Tutor" : "Ask AI Tutor"}
                  </button>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    style={{ padding: "8px 14px", borderRadius: 8, background: "#FFF7ED", color: "#C2410C", border: "1.5px solid #FED7AA", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    🚩 Report Issue
                  </button>
                </div>

                {tutorOpen && (
                  <AITutor
                    question={current as unknown as Question}
                    userAnswer={selected}
                    history={[]}
                    patternMode={false}
                    onClose={() => setTutorOpen(false)}
                  />
                )}

                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {history.length > 0 && (
                  <button
                    onClick={goBack}
                    style={{ padding: "13px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ← Prev
                  </button>
                )}
                <button
                  onClick={handleNext}
                  style={{ width: "100%", padding: "13px", borderRadius: 10, background: "linear-gradient(135deg, #065F46, #0F766E)", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Next Question →
                </button>
              </div>
              </div>
            )}
          </div>

          {/* Session progress */}
          {totalAnswered > 0 && (
            <div style={{ marginTop: 16, background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Session Progress</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(moduleStats).map(([mod, stat]) => (
                  <div key={mod} style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "6px 10px", minWidth: 0 }}>
                    <span style={{ fontSize: 14 }}>{MODULE_ICONS[mod] ?? "📖"}</span>
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
      )}

      {/* Quiz Gate */}
      {showGate && (
        <QuizGate
          questionsAnswered={history.length}
          productKey="oit-ww"
          productName="OIT Wastewater Practice Pass"
          priceLabel="CA$49"
          paidFeatures={[
            "Full 500+ question bank — unlimited attempts",
            "OIT Wastewater Mock Exam (100 questions, 2-hour timer)",
            "WW1 formula sheet (25+ formulas)",
            "AI Tutor explanations on every question",
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
