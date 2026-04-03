// Class 2 Wastewater Treatment Practice Quiz
// 500-question bank · 15-question free trial · paid full access via PurchaseGate
// Mirrors Class1WastewaterQuiz structure
import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  CLASS2_WW_QUESTIONS,
  CLASS2_WW_MODULES,
  type WastewaterQuestion,
} from "@/lib/class2WastewaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";
import { CLASS2_WW_FORMULA_LINKS } from "@/lib/formulaLinks";

type QCompat = WastewaterQuestion & { q: string; wrongExp?: Record<number, string> };

function toCompat(q: WastewaterQuestion): QCompat {
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
  "Treatment Process":      { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection Systems":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Administration":{ bg: "#FEE2E2", color: "#B91C1C" },
  "Equipment O&M":          { bg: "#FFEDD5", color: "#C2410C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Treatment Process":      "🔬",
  "Collection Systems":     "🌊",
  "Laboratory Analysis":    "🧪",
  "Safety & Administration":"📋",
  "Equipment O&M":          "🔧",
};

const SESSION_SIZE = 15;
const FREE_TRIAL_POOL = 60;

type HistoryEntry = {
  q: QCompat;
  selected: number;
  confidence: number;
  correct: boolean;
};

function getNextQ(history: HistoryEntry[], trialUnlocked: boolean): QCompat | null {
  const usedIds = new Set(history.map((h) => h.q.id));
  const pool = trialUnlocked
    ? CLASS2_WW_QUESTIONS
    : CLASS2_WW_QUESTIONS.slice(0, FREE_TRIAL_POOL);
  const remaining = pool.filter((q) => !usedIds.has(q.id));
  if (remaining.length === 0) return null;
  const shuffled = shuffle([...remaining]);
  return toCompat(shuffled[0]);
}

export default function Class2WastewaterQuiz() {
  usePageMeta({
    title: "Class 2 Wastewater Treatment Practice",
    description: "Practice for your Ontario Class 2 Wastewater Treatment operator exam with 500 questions, AI Tutor explanations, and a full 100-question mock exam.",
    path: "/class2-ww",
    keywords: "Class 2 wastewater treatment exam prep, Ontario operator certification, OWWCO, O. Reg. 128/04 practice questions, activated sludge, nutrient removal",
  });

  const [trialUnlockedState, setTrialUnlockedState] = useState(() => isTrialUnlocked());
  const initialQ = useMemo(() => toCompat(CLASS2_WW_QUESTIONS[0]), []);
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
    const entry: HistoryEntry = { q: current, selected, confidence, correct: isCorrect };
    const newHistory = [...history, entry];
    setHistory(newHistory);
    setConfirmed(true);

    // Show gate after free trial
    if (!trialUnlockedState && newHistory.length >= FREE_TRIAL_POOL) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlockedState]);

  const nextQuestion = useCallback(() => {
    if (!trialUnlockedState && history.length >= FREE_TRIAL_POOL) {
      setShowGate(true);
      return;
    }
    const nextQ = getNextQ(history, trialUnlockedState);
    if (!nextQ) {
      setCurrent(null);
    } else {
      setCurrent(nextQ);
      setSelected(null);
      setConfidence(null);
      setConfirmed(false);
      setShowSteps(false);
      setTutorOpen(false);
    }
  }, [history, trialUnlockedState]);

  // Stats
  const correctCount = history.filter((h) => h.correct).length;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const moduleStats = history.reduce<Record<string, { correct: number; total: number }>>((acc, h) => {
    const mod = h.q.module;
    if (!acc[mod]) acc[mod] = { correct: 0, total: 0 };
    acc[mod].total++;
    if (h.correct) acc[mod].correct++;
    return acc;
  }, {});

  const BRAND = "#0F766E";
  const BRAND_LIGHT = "#F0FDFA";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <SiteNav currentPath="/class2-ww" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0F766E 0%, #0E7490 100%)", color: "#fff", padding: "24px 16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.75, textTransform: "uppercase", marginBottom: 4 }}>Echelon Institute</div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Class 2 Wastewater Treatment</h1>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Practice Quiz · {CLASS2_WW_QUESTIONS.length} Questions · Intermediate Level</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/formulas-ww2">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📐 Formula Sheet
                </button>
              </Link>
              <Link href="/class2-ww-mock">
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
              { label: "Correct", value: correctCount },
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

      {/* Progress bar */}
      <div style={{ height: 4, background: "rgba(0,0,0,0.1)" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (sessionCount / SESSION_SIZE) * 100)}%`, background: "rgba(255,255,255,0.6)", transition: "width 0.3s" }} />
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 40px" }}>

        {/* Module selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {CLASS2_WW_MODULES.map((mod) => {
            const mc = MODULE_COLORS[mod.name] || { bg: "#F1F5F9", color: "#475569" };
            const icon = MODULE_ICONS[mod.name] || "📚";
            return (
              <button
                key={mod.name}
                onClick={() => {
                  const q = mod.questions[Math.floor(Math.random() * mod.questions.length)];
                  if (q) { setCurrent(toCompat(q)); setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false); setTutorOpen(false); }
                }}
                style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${mc.bg}`, background: mc.bg, color: mc.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
              >
                <span>{icon}</span>
                <span>{mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Question card */}
        {current ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            {/* Module + difficulty badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: MODULE_COLORS[current.module]?.bg || "#F1F5F9", color: MODULE_COLORS[current.module]?.color || "#475569" }}>
                {MODULE_ICONS[current.module] || "📚"} {current.module}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: DIFF_BG[current.difficulty], color: DIFF_COLOR[current.difficulty] }}>
                {current.difficulty.charAt(0).toUpperCase() + current.difficulty.slice(1)}
              </span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", lineHeight: 1.6, marginBottom: 18 }}>{current.question}</p>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {current.options.map((opt, i) => {
                let bg = "#F8FAFC", border = "#E2E8F0", color = "#334155";
                if (confirmed) {
                  if (i === current.correct) { bg = "#F0FDF4"; border = "#86EFAC"; color = "#166534"; }
                  else if (i === selected && i !== current.correct) { bg = "#FEF2F2"; border = "#FCA5A5"; color = "#991B1B"; }
                } else if (selected === i) {
                  bg = BRAND_LIGHT; border = BRAND; color = "#0F766E";
                }
                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    disabled={confirmed}
                    style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color, fontSize: 13, fontWeight: 600, textAlign: "left", cursor: confirmed ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "flex-start", gap: 10, transition: "all 0.15s" }}
                  >
                    <span style={{ fontWeight: 800, minWidth: 20 }}>{String.fromCharCode(65 + i)}.</span>
                    <span>{opt}</span>
                    {confirmed && i === current.correct && <span style={{ marginLeft: "auto", color: "#059669" }}>✓</span>}
                    {confirmed && i === selected && i !== current.correct && <span style={{ marginLeft: "auto", color: "#DC2626" }}>✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Confidence meter */}
            {!confirmed && (
              <ConfidenceMeter value={confidence} onChange={setConfidence} />
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {!confirmed ? (
                <button
                  onClick={confirm}
                  disabled={selected === null || confidence === null}
                  style={{ flex: 1, padding: "13px", borderRadius: 12, background: selected !== null && confidence !== null ? `linear-gradient(135deg, ${BRAND}, #0E7490)` : "#E2E8F0", color: selected !== null && confidence !== null ? "#fff" : "#94A3B8", fontWeight: 800, fontSize: 15, border: "none", cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                >
                  Confirm Answer
                </button>
              ) : (
                <>
                  <button
                    onClick={nextQuestion}
                    style={{ flex: 1, padding: "13px", borderRadius: 12, background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Next Question →
                  </button>
                  <button
                    onClick={() => setShowSteps(v => !v)}
                    style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: showSteps ? BRAND_LIGHT : "#fff", color: showSteps ? BRAND : "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {showSteps ? "Hide" : "Explain"}
                  </button>
                  <button
                    onClick={() => setTutorOpen(v => !v)}
                    style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0", background: tutorOpen ? BRAND_LIGHT : "#fff", color: tutorOpen ? BRAND : "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    🤖 AI Tutor
                  </button>
                </>
              )}
            </div>

            {/* Explanation */}
            {confirmed && showSteps && (
              <div style={{ marginTop: 16 }}>
                <div style={{ padding: "14px 16px", borderRadius: 12, background: "#F0FDFA", border: "1px solid #99F6E4" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#0F766E", letterSpacing: "0.08em", marginBottom: 6 }}>EXPLANATION</div>
                  <div style={{ fontSize: 13, color: "#134E4A", lineHeight: 1.65 }}>{current.explanation}</div>
                  {CLASS2_WW_FORMULA_LINKS[current.id] && (
                    <a
                      href={CLASS2_WW_FORMULA_LINKS[current.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "7px 14px", borderRadius: 8, background: "#CCFBF1", border: "1px solid #99F6E4", color: "#0F766E", fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}
                    >
                      📐 View formula sheet ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px 20px", border: "1px solid #E2E8F0", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Session Complete!</h2>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>You answered {totalAnswered} questions with {accuracy}% accuracy.</p>
            <button
              onClick={resetSession}
              style={{ padding: "12px 24px", borderRadius: 12, background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Start New Session
            </button>
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

        {/* Mock exam CTA */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND}15, #0E749015)`, borderRadius: 16, padding: "20px", border: `1px solid ${BRAND}30`, marginTop: 24, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Ready for the Mock Exam?</h3>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>100 questions · 2-hour timer · 70% pass threshold</p>
          <Link href="/class2-ww-mock">
            <button style={{ padding: "11px 24px", borderRadius: 10, background: `linear-gradient(135deg, ${BRAND}, #0E7490)`, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Take Mock Exam →
            </button>
          </Link>
        </div>
      </div>

      {/* Quiz Gate */}
      {showGate && (
        <QuizGate
          questionsAnswered={history.length}
          productKey="class2-ww"
          productName="Class 2 Wastewater Treatment Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "Full 500-question bank — unlimited attempts",
            "Class 2 Wastewater Mock Exam (100 questions, 2-hour timer)",
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
