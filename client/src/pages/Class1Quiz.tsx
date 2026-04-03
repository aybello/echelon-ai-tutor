// ECHELON AI TUTOR — Class 1 Quiz Page
// Certification: Class 1 Water (Treatment + Distribution) / Class 1 Wastewater (Treatment + Collection)

import { useState, useCallback, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  CLASS1_QUESTIONS,
  CLASS1_MODULES,
  getClass1Questions,
} from "@/lib/class1Questions";
import {
  getNextQuestion,
  getPatternInsights,
  type Question,
  type HistoryEntry,
} from "@/lib/questions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import StepSolution from "@/components/StepSolution";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked } from "@/components/QuizGate";
import { shuffle } from "@/lib/utils";

type Stream = "all" | "water" | "wastewater";
type SubModule = string | null;

const STREAM_CONFIG = {
  all: {
    label: "All Class 1",
    icon: "🎓",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    modules: CLASS1_MODULES as readonly string[],
  },
  water: {
    label: "Class 1 Water",
    icon: "💧",
    color: "#0369A1",
    bg: "#E0F2FE",
    modules: ["Water Treatment", "Water Distribution"] as string[],
  },
  wastewater: {
    label: "Class 1 Wastewater",
    icon: "♻️",
    color: "#065F46",
    bg: "#ECFDF5",
    modules: ["Wastewater Treatment", "Wastewater Collection"] as string[],
  },
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Water Treatment":       { bg: "#DBEAFE", color: "#0369A1" },
  "Water Distribution":    { bg: "#E0F2FE", color: "#0284C7" },
  "Wastewater Treatment":  { bg: "#ECFDF5", color: "#065F46" },
  "Wastewater Collection": { bg: "#D1FAE5", color: "#047857" },
};

const MODULE_ICONS: Record<string, string> = {
  "Water Treatment":       "🏭",
  "Water Distribution":    "🚰",
  "Wastewater Treatment":  "♻️",
  "Wastewater Collection": "🔩",
};

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

const SESSION_SIZE = 20;

export default function Class1Quiz() {
  usePageMeta({
    title: "Class 1 Practice Quiz — Water & Wastewater",
    description: "Practice for the Ontario Class 1 Water Treatment, Water Distribution, Wastewater Treatment, and Wastewater Collection operator certification exams.",
    path: "/class1",
    keywords: "Class 1 water operator, Class 1 wastewater operator, EOCP exam prep, OWWCO certification, Ontario operator practice questions",
  });

  // Read stream from URL query param (e.g. /class1?stream=wastewater)
  const searchString = useSearch();
  const initialStream = useMemo<Stream>(() => {
    const params = new URLSearchParams(searchString);
    const s = params.get("stream");
    if (s === "water" || s === "wastewater") return s;
    return "all";
  }, []); // only read on mount

  const [stream, setStream] = useState<Stream>(initialStream);
  const [subModule, setSubModule] = useState<SubModule>(null);
  const [showStreamSelector, setShowStreamSelector] = useState(false);

  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [current, setCurrent]       = useState<Question | null>(() => {
    if (initialStream === "water") return getClass1Questions("water")[0] ?? null;
    if (initialStream === "wastewater") return getClass1Questions("wastewater")[0] ?? null;
    return CLASS1_QUESTIONS[0];
  });
  const [selected, setSelected]     = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [showSteps, setShowSteps]   = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [patternMode, setPatternMode] = useState(false);
  const [shakeKey, setShakeKey]     = useState(0);
  const [adaptive, setAdaptive]     = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isTrialUnlocked());
  const [showGate, setShowGate]     = useState(false);

  // Build active question pool based on stream + subModule
  const activeQuestions = useMemo(() => {
    let pool = stream === "all"
      ? CLASS1_QUESTIONS
      : getClass1Questions(stream === "water" ? "water" : "wastewater");
    if (subModule) pool = pool.filter(q => q.module === subModule);
    return pool;
  }, [stream, subModule]);

  const patterns = getPatternInsights(history);
  const allDone = !current;

  const confirm = useCallback(() => {
    if (selected === null || confidence === null) {
      setShakeKey(k => k + 1);
      return;
    }
    if (!current) return;
    const isCorrect = selected === current.correct;
    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty,
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      wrongExplanation: !isCorrect ? null : null,
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setConfirmed(true);
    // Fire gate immediately after 15th answer — avoids stale state in next()
    if (updatedHistory.length >= 15 && !trialUnlocked) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlocked]);

  const next = useCallback(() => {
    const updatedHistory = history;
    if (updatedHistory.length >= SESSION_SIZE) {
      setCurrent(null);
      return;
    }
    const nextQ = getNextQuestion(updatedHistory, activeQuestions);
    if (!nextQ) { setCurrent(null); return; }
    const pts = getPatternInsights(updatedHistory);
    const wasWeak = pts && pts.some(p => p.module === nextQ.module);
    setAdaptive(wasWeak ? `Serving a ${nextQ.module} question — your weakest area this session.` : null);
    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setPatternMode(false);
  }, [history, activeQuestions, trialUnlocked]);

  const resetSession = useCallback(() => {
    const shuffled = shuffle(activeQuestions.length > 0 ? activeQuestions : CLASS1_QUESTIONS);
    setHistory([]);
    setCurrent(shuffled[0] ?? null);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setPatternMode(false);
    setAdaptive(null);
  }, [activeQuestions]);

  const handleStreamChange = (newStream: Stream, newSubModule: SubModule = null) => {
    setStream(newStream);
    setSubModule(newSubModule);
    setShowStreamSelector(false);
    const pool = newSubModule
      ? CLASS1_QUESTIONS.filter(q => q.module === newSubModule)
      : newStream === "all"
        ? CLASS1_QUESTIONS
        : getClass1Questions(newStream === "water" ? "water" : "wastewater");
    setHistory([]);
    setCurrent(pool[0] ?? null);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setPatternMode(false);
    setAdaptive(null);
  };

  const correctCount = history.filter(h => h.correct).length;
  const wrongCount   = history.filter(h => !h.correct).length;
  const progress     = (history.length / SESSION_SIZE) * 100;

  const streamCfg = STREAM_CONFIG[stream];
  const moduleStyle = current
    ? MODULE_COLORS[current.module] ?? { bg: "#DBEAFE", color: "#1D4ED8" }
    : { bg: "#DBEAFE", color: "#1D4ED8" };

  const moduleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CLASS1_QUESTIONS.forEach(q => { stats[q.module] = (stats[q.module] ?? 0) + 1; });
    return stats;
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @keyframes popIn   { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
        .c1-option-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .c1-next-btn:hover { transform: translateY(-1px); }
        .c1-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        @media (max-width: 640px) {
          .c1-header-nav { display: none !important; }
          .c1-main { max-width: 100% !important; padding: 16px 14px 80px !important; }
          .c1-q-card { padding: 20px 16px !important; }
          .c1-meta-row { flex-wrap: wrap !important; gap: 6px !important; }
          .c1-meta-right { flex-shrink: 0 !important; }
          .c1-action-row { flex-wrap: wrap !important; gap: 8px !important; }
          .c1-action-row .c1-confidence { width: 100% !important; }
          .c1-action-row .c1-confirm-btn { width: 100% !important; padding: 12px 16px !important; }
          .c1-q-text { font-size: 15px !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      }}>
        <div style={{ padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/">
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px",
                boxShadow: "0 2px 8px rgba(29,78,216,0.3)", cursor: "pointer",
              }}>E</div>
            </Link>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.04em" }}>
                ECHELON INSTITUTE
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>
                Class 1 — {CLASS1_QUESTIONS.length} Questions · {streamCfg.label}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Stream selector */}
            <button
              onClick={() => setShowStreamSelector(!showStreamSelector)}
              style={{
                padding: "6px 12px", borderRadius: 20,
                border: `1px solid ${streamCfg.color}`,
                background: streamCfg.bg, color: streamCfg.color,
                fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {streamCfg.icon} {subModule ?? streamCfg.label}
              <span style={{ fontSize: 8 }}>▼</span>
            </button>

            {/* Score */}
            <div style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 800, color: "#059669", fontSize: 13 }}>{correctCount}</span>
              <span style={{ color: "#CBD5E1" }}>/</span>
              <span style={{ fontWeight: 800, color: "#DC2626", fontSize: 13 }}>{wrongCount}</span>
              <span style={{ color: "#94A3B8", marginLeft: 2 }}>· {history.length} done</span>
            </div>

            {patterns && (
              <button onClick={() => { setPatternMode(true); setTutorOpen(true); }} style={{
                padding: "6px 12px", borderRadius: 20, border: "none",
                background: "#FEF3C7", color: "#92400E",
                fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>🧠 Pattern Detected</button>
            )}

            <div className="c1-header-nav" style={{ display: "flex", gap: 6 }}>
              <Link href="/quiz">
                <button style={{
                  padding: "7px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
                  background: "transparent", color: "#64748B",
                  fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>📚 OIT Practice</button>
              </Link>
              <Link href="/mock-exam">
                <button style={{
                  padding: "7px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
                  background: "transparent", color: "#64748B",
                  fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>📝 Mock Exam</button>
              </Link>
            </div>

            {!tutorOpen && current && confirmed && (
              <button onClick={() => { setPatternMode(false); setTutorOpen(true); }} style={{
                padding: "7px 14px", borderRadius: 20, border: "none",
                background: "#1D4ED8", color: "#fff",
                fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>🤖 Ask AI Tutor</button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#F1F5F9" }}>
          <div style={{
            height: "100%",
            background: `linear-gradient(90deg, ${streamCfg.color}, #0F766E)`,
            width: `${Math.min(progress, 100)}%`,
            transition: "width 0.5s ease",
            borderRadius: "0 2px 2px 0",
          }} />
        </div>
      </div>

      {/* ── STREAM SELECTOR DROPDOWN ── */}
      {showStreamSelector && (
        <>
          <div style={{
            position: "fixed", top: 72, left: 0, right: 0, zIndex: 50,
            display: "flex", justifyContent: "center", padding: "0 20px",
            animation: "fadeUp 0.2s ease both",
          }}>
            <div style={{
              background: "#fff", borderRadius: 16,
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
              border: "1px solid #E5E7EB", padding: 20,
              maxWidth: 700, width: "100%",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 14 }}>
                SELECT STREAM & MODULE
              </div>

              {/* Stream toggles */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {(["all", "water", "wastewater"] as Stream[]).map(s => {
                  const cfg = STREAM_CONFIG[s];
                  const isActive = stream === s && !subModule;
                  return (
                    <button
                      key={s}
                      className="c1-chip"
                      onClick={() => handleStreamChange(s, null)}
                      style={{
                        padding: "8px 16px", borderRadius: 20,
                        border: `2px solid ${isActive ? cfg.color : "#E5E7EB"}`,
                        background: isActive ? cfg.bg : "#F8FAFC",
                        color: isActive ? cfg.color : "#475569",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.15s",
                      }}
                    >
                      {cfg.icon} {cfg.label} ({(s === "all" ? CLASS1_QUESTIONS : getClass1Questions(s === "water" ? "water" : "wastewater")).length})
                    </button>
                  );
                })}
              </div>

              {/* Sub-module chips */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 10 }}>
                FOCUS ON A SPECIFIC MODULE
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {CLASS1_MODULES.map(mod => {
                  const count = moduleStats[mod] ?? 0;
                  const style = MODULE_COLORS[mod] ?? { bg: "#F1F5F9", color: "#475569" };
                  const icon = MODULE_ICONS[mod] ?? "📖";
                  const isActive = subModule === mod;
                  return (
                    <button
                      key={mod}
                      className="c1-chip"
                      onClick={() => {
                        const s = (mod === "Water Treatment" || mod === "Water Distribution") ? "water" : "wastewater";
                        handleStreamChange(s, mod);
                      }}
                      style={{
                        padding: "8px 14px", borderRadius: 20,
                        border: `2px solid ${isActive ? style.color : "#E5E7EB"}`,
                        background: isActive ? style.bg : "#F8FAFC",
                        color: isActive ? style.color : "#475569",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      <span>{icon}</span>
                      <span>{mod}</span>
                      <span style={{
                        background: isActive ? style.color : "#E5E7EB",
                        color: isActive ? "#fff" : "#64748B",
                        borderRadius: 10, padding: "1px 6px",
                        fontSize: 9, fontWeight: 800,
                      }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowStreamSelector(false)}
                style={{
                  padding: "6px 16px", borderRadius: 8,
                  border: "1px solid #E5E7EB", background: "transparent",
                  color: "#94A3B8", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                }}
              >Close</button>
            </div>
          </div>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowStreamSelector(false)} />
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <div
        className="c1-main"
        style={{
          maxWidth: tutorOpen ? "calc(100% - 440px)" : 760,
          margin: "0 auto",
          padding: "28px 20px 80px",
          transition: "max-width 0.3s ease",
        }}
      >
        {/* Adaptive banner */}
        {adaptive && !confirmed && (
          <div style={{
            background: "#FEF3C7", borderRadius: 10, padding: "10px 16px",
            marginBottom: 16, fontSize: 12, color: "#92400E", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            animation: "fadeUp 0.3s ease both",
          }}>
            🧠 {adaptive}
          </div>
        )}

        {/* ── SESSION COMPLETE ── */}
        {allDone && (
          <div style={{
            background: "#fff", borderRadius: 20, padding: "48px 40px",
            textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            animation: "popIn 0.4s ease both",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Session Complete!
            </div>
            <div style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>
              {correctCount} correct · {wrongCount} incorrect · {history.length} questions answered
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
              <span style={{ color: "#059669" }}>{correctCount}</span>
              <span style={{ color: "#CBD5E1" }}>/</span>
              <span style={{ color: "#0F172A" }}>{history.length}</span>
            </div>
            <div style={{
              fontSize: 13, color: "#64748B", marginBottom: 32,
              background: "#F8FAFC", borderRadius: 10, padding: "10px 20px", display: "inline-block",
            }}>
              Score: {history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0}%
              {history.length > 0 && Math.round((correctCount / history.length) * 100) >= 70
                ? " — 🎉 Pass threshold met!"
                : history.length > 0 ? " — Keep practising!" : ""}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={resetSession}
                style={{
                  padding: "14px 28px", borderRadius: 12,
                  background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                🔄 New Session
              </button>
              <Link href="/quiz">
                <button style={{
                  padding: "14px 28px", borderRadius: 12,
                  border: "1px solid #E5E7EB", background: "#fff",
                  color: "#475569", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>📚 OIT Practice</button>
              </Link>
            </div>
          </div>
        )}

        {/* ── QUIZ GATE ── */}
        {showGate && !trialUnlocked && (
          <QuizGate
            questionsAnswered={history.length}
            productKey="class1-water"
            productName="Class 1 Practice Pass"
            priceLabel="CA$49"
            paidFeatures={[
              "Full 600+ question bank — unlimited attempts",
              "Covers Water Treatment, Distribution, Wastewater Treatment & Collection",
              "Adaptive engine prioritizes your weak spots",
              "AI Tutor explains every question in depth",
              "Timed 100-question mock exam with pass/fail breakdown",
              "Score history & module breakdown",
            ]}
            onUnlocked={() => {
              setTrialUnlockedState(true);
              setShowGate(false);
            }}
            onDismiss={() => {
              setShowGate(false);
              resetSession();
            }}
          />
        )}

        {/* ── QUESTION CARD ── */}
        {!allDone && !showGate && current && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            {/* Question header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 16, flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: moduleStyle.bg, color: moduleStyle.color,
                }}>
                  {MODULE_ICONS[current.module] ?? "📖"} {current.module}
                </span>
                <span style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: DIFF_BG[current.difficulty], color: DIFF_COLOR[current.difficulty],
                }}>
                  {current.difficulty.charAt(0).toUpperCase() + current.difficulty.slice(1)}
                </span>
                <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Q{current.id} · {history.length + 1}/{SESSION_SIZE}
                </span>
              </div>
              {/* Flag button */}
              <div className="c1-meta-right" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setReportModalOpen(true)}
                  title="Report an error in this question"
                  style={{
                    padding: "4px 10px", borderRadius: 20, border: "1px solid #E2E8F0",
                    background: "none", color: "#94A3B8",
                    fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 4,
                    fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.background = "#FEF2F2"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "none"; }}
                >
                  🚩 Report
                </button>
              </div>
            </div>

            {/* Question text */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "28px 28px 24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: "1px solid #F1F5F9", marginBottom: 16,
            }}>
              {current.formula && (
                <div style={{
                  background: "#F8FAFC", borderRadius: 8, padding: "8px 14px",
                  marginBottom: 16, fontSize: 12, fontWeight: 700,
                  color: "#475569", fontFamily: "monospace", letterSpacing: "0.02em",
                }}>
                  📐 {current.formula}
                </div>
              )}
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", lineHeight: 1.55 }}>
                {current.q}
              </div>
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {current.options.map((opt, i) => {
                let bg = "#fff", border = "1.5px solid #E5E7EB", color = "#1E293B";
                if (confirmed) {
                  if (i === current.correct) { bg = "#ECFDF5"; border = "2px solid #059669"; color = "#065F46"; }
                  else if (i === selected && selected !== current.correct) { bg = "#FEF2F2"; border = "2px solid #DC2626"; color = "#991B1B"; }
                } else if (i === selected) {
                  bg = "#EFF6FF"; border = "2px solid #1D4ED8"; color = "#1D4ED8";
                }
                return (
                  <button
                    key={i}
                    className="c1-option-btn"
                    disabled={confirmed}
                    onClick={() => setSelected(i)}
                    style={{
                      padding: "14px 18px", borderRadius: 12,
                      background: bg, border, color,
                      fontSize: 14, fontWeight: 600, textAlign: "left",
                      cursor: confirmed ? "default" : "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                      display: "flex", alignItems: "flex-start", gap: 10,
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: confirmed && i === current.correct ? "#059669"
                        : confirmed && i === selected && selected !== current.correct ? "#DC2626"
                        : i === selected ? "#1D4ED8" : "#E5E7EB",
                      color: "#fff", fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {confirmed && i === current.correct && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✓</span>}
                    {confirmed && i === selected && selected !== current.correct && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Confidence + Confirm row */}
            {!confirmed && (
              <div
                key={shakeKey}
                className="c1-action-row"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  flexWrap: "wrap",
                  animation: shakeKey > 0 ? "shake 0.4s ease" : undefined,
                }}
              >
                <div className="c1-confidence" style={{ flexShrink: 0 }}>
                  <ConfidenceMeter value={confidence} onChange={setConfidence} />
                </div>
                <button
                  onClick={confirm}
                  disabled={selected === null || confidence === null}
                  className="c1-next-btn c1-confirm-btn"
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "12px 28px", borderRadius: 12,
                    background: selected !== null && confidence !== null
                      ? "linear-gradient(135deg, #1D4ED8, #0F766E)"
                      : "#E5E7EB",
                    color: selected !== null && confidence !== null ? "#fff" : "#94A3B8",
                    fontSize: 14, fontWeight: 700, border: "none",
                    cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed",
                    fontFamily: "inherit", transition: "all 0.2s",
                    boxShadow: selected !== null && confidence !== null
                      ? "0 4px 16px rgba(29,78,216,0.3)" : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selected === null ? "Select an answer →" : confidence === null ? "Pick confidence →" : "Confirm →"}
                </button>
              </div>
            )}

            {/* Explanation */}
            {confirmed && (
              <div style={{ animation: "slideIn 0.3s ease both" }}>
                <div style={{
                  background: selected === current.correct ? "#ECFDF5" : "#FEF2F2",
                  borderRadius: 12, padding: "16px 20px", marginBottom: 16,
                  border: `1px solid ${selected === current.correct ? "#A7F3D0" : "#FECACA"}`,
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 800,
                    color: selected === current.correct ? "#065F46" : "#991B1B",
                    marginBottom: 6,
                  }}>
                    {selected === current.correct ? "✓ Correct!" : "✗ Incorrect"}
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {current.explanation}
                  </div>
                  {current.tip && (
                    <div style={{
                      marginTop: 10, padding: "8px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.6)", fontSize: 12,
                      color: "#475569", fontStyle: "italic",
                    }}>
                      💡 {current.tip}
                    </div>
                  )}
                </div>

                {/* Steps toggle */}
                {current.steps && current.steps.length > 0 && (
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      border: "1px solid #E5E7EB", background: "#F8FAFC",
                      color: "#475569", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit", marginBottom: 12,
                    }}
                  >
                    {showSteps ? "▲ Hide" : "▼ Show"} Step-by-Step Solution
                  </button>
                )}
                {showSteps && current.steps && (
                  <StepSolution steps={current.steps} tip={current.tip} />
                )}

                {/* Next button */}
                <button
                  onClick={next}
                  className="c1-next-btn"
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12,
                    background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                    color: "#fff", fontSize: 15, fontWeight: 700,
                    border: "none", cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 4px 16px rgba(29,78,216,0.3)",
                    marginTop: 8,
                  }}
                >
                  {history.length + 1 >= SESSION_SIZE ? "View Results →" : "Next Question →"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── AI TUTOR PANEL ── */}
      {tutorOpen && current && (
        <AITutor
          question={current}
          userAnswer={selected}
          patternMode={patternMode}
          history={history}
          onClose={() => setTutorOpen(false)}
        />
      )}

      {/* ── REPORT ERROR MODAL ── */}
      {reportModalOpen && current && (
        <ReportErrorModal
          questionId={current.id}
          questionText={current.q}
          module={current.module}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}
