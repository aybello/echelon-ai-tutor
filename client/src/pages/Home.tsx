// ECHELON AI TUTOR — Main App Page
// Design: Professional SaaS — Clean Dark-Accent
// Philosophy: Sora typography, blue/teal gradient brand, white cards on slate bg

import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  QUESTIONS,
  OIT_MODULES,
  getNextQuestion,
  getPatternInsights,
  type Question,
  type HistoryEntry,
} from "@/lib/questions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import ReadinessScore from "@/components/ReadinessScore";
import StepSolution from "@/components/StepSolution";
import PatternAlert from "@/components/PatternAlert";
import ConfidenceInsight from "@/components/ConfidenceInsight";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";

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
  "Disinfection":          { bg: "#DBEAFE", color: "#1D4ED8" },
  "Chemical Feed & Storage": { bg: "#FEF9C3", color: "#A16207" },
  "Hydraulics":            { bg: "#DCFCE7", color: "#15803D" },
  "Math & Calculations":   { bg: "#FFEDD5", color: "#C2410C" },
  "Ontario Regulations":   { bg: "#EDE9FE", color: "#6D28D9" },
  "Pumping Systems":       { bg: "#CCFBF1", color: "#0F766E" },
  "Water Treatment":       { bg: "#DBEAFE", color: "#0369A1" },
  "Wastewater Treatment":  { bg: "#ECFDF5", color: "#065F46" },
  "Water Quality & Sampling": { bg: "#FEF9C3", color: "#A16207" },
  "Health & Safety":       { bg: "#FEE2E2", color: "#B91C1C" },
};

const MODULE_ICONS: Record<string, string> = {
  "Disinfection":          "🧪",
  "Chemical Feed & Storage": "⚗️",
  "Hydraulics":            "💧",
  "Math & Calculations":   "📐",
  "Ontario Regulations":   "📋",
  "Pumping Systems":       "⚙️",
  "Water Treatment":       "🏭",
  "Wastewater Treatment":  "♻️",
  "Water Quality & Sampling": "🔬",
  "Health & Safety":       "🦺",
};

export default function Home() {
  usePageMeta({
    title: "OIT Practice Quiz — 475 Questions",
    description: "Practice for the Ontario Operator-in-Training (OIT) exam with 475 questions across 10 modules. AI Tutor, step-by-step solutions, and confidence tracking included.",
    path: "/quiz",
  });
  const [history, setHistory]         = useState<HistoryEntry[]>([]);
  const [current, setCurrent]         = useState<Question | null>(QUESTIONS[0]);
  const [selected, setSelected]       = useState<number | null>(null);
  const [confidence, setConfidence]   = useState<number | null>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [showSteps, setShowSteps]     = useState(false);
  const [tutorOpen, setTutorOpen]     = useState(false);
  const [patternMode, setPatternMode] = useState(false);
  const [shakeKey, setShakeKey]       = useState(0);
  const [adaptive, setAdaptive]       = useState<string | null>(null);
  const SESSION_SIZE = 15;
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  // Gate: show after 15 questions unless already unlocked this session
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isTrialUnlocked());
  const [showGate, setShowGate] = useState(false);

  // Filter questions by selected module
  const activeQuestions = useMemo(() => {
    if (!selectedModule) return QUESTIONS;
    return QUESTIONS.filter(q => q.module === selectedModule);
  }, [selectedModule]);

  const patterns = getPatternInsights(history);
  const allDone = !current;

  const confirm = useCallback(() => {
    if (selected === null || confidence === null) {
      setShakeKey((k) => k + 1);
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
      wrongExplanation: !isCorrect ? (current.wrongExp?.[selected] ?? null) : null,
    };
    setHistory((prev) => [...prev, entry]);
    setConfirmed(true);
  }, [selected, confidence, current]);

  const next = useCallback(() => {
    const updatedHistory = history;
    // End session after SESSION_SIZE questions
    if (updatedHistory.length >= SESSION_SIZE) {
      setCurrent(null);
      return;
    }
    // Show gate after 15 answered questions if not yet unlocked
    if (updatedHistory.length >= 15 && !trialUnlocked) {
      setShowGate(true);
      return;
    }
    const nextQ = getNextQuestion(updatedHistory, activeQuestions);
    if (!nextQ) {
      setCurrent(null);
      return;
    }

    const pts = getPatternInsights(updatedHistory);
    const wasWeak = pts && pts.some((p) => p.module === nextQ.module);
    setAdaptive(wasWeak ? `Serving a ${nextQ.module} question — your weakest area this session.` : null);

    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setPatternMode(false);
  }, [history, activeQuestions]);

  const openPatternTutor = () => { setPatternMode(true); setTutorOpen(true); };
  const openTutor = () => { setPatternMode(false); setTutorOpen(true); };

  const resetSession = useCallback(() => {
    const firstQ = activeQuestions[0] ?? QUESTIONS[0];
    setHistory([]);
    setCurrent(firstQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
    setPatternMode(false);
    setAdaptive(null);
  }, [activeQuestions]);

  const handleModuleSelect = (mod: string | null) => {
    setSelectedModule(mod);
    setShowModuleSelector(false);
    const pool = mod ? QUESTIONS.filter(q => q.module === mod) : QUESTIONS;
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

  const correctCount = history.filter((h) => h.correct).length;
  const wrongCount   = history.filter((h) => !h.correct).length;
  const progress     = (history.length / SESSION_SIZE) * 100;

  const moduleStyle = current
    ? MODULE_COLORS[current.module] ?? { bg: "#DBEAFE", color: "#1D4ED8" }
    : { bg: "#DBEAFE", color: "#1D4ED8" };

  // Module stats for selector
  const moduleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    QUESTIONS.forEach(q => {
      stats[q.module] = (stats[q.module] ?? 0) + 1;
    });
    return stats;
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @keyframes popIn   { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
        .option-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .next-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(29,78,216,0.35) !important; }
        .tutor-btn:hover { background: #1e40af !important; }
        .module-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        @media (max-width: 640px) {
          .quiz-header-nav-btns { display: none !important; }
          .quiz-header-stats { gap: 6px !important; }
          .quiz-main-content { max-width: 100% !important; padding: 16px 14px 80px !important; }
          .session-complete-card { padding: 32px 20px !important; }
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
        <div style={{
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/">
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.5px",
                boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
                cursor: "pointer",
              }}>E</div>
            </Link>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.04em" }}>
                ECHELON INSTITUTE
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>
                OIT — Adaptive Practice · {QUESTIONS.length} Questions
              </div>
            </div>
          </div>

          {/* Stats + controls */}
          <div className="quiz-header-stats" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Module filter button */}
            <button
              onClick={() => setShowModuleSelector(!showModuleSelector)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${selectedModule ? "#1D4ED8" : "#E5E7EB"}`,
                background: selectedModule ? "#EFF6FF" : "transparent",
                color: selectedModule ? "#1D4ED8" : "#64748B",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {selectedModule ? `${MODULE_ICONS[selectedModule] ?? "📚"} ${selectedModule}` : "📚 All Modules"}
              <span style={{ fontSize: 8 }}>▼</span>
            </button>

            <div style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 800, color: "#059669", fontSize: 13 }}>{correctCount}</span>
              <span style={{ color: "#CBD5E1" }}>/</span>
              <span style={{ fontWeight: 800, color: "#DC2626", fontSize: 13 }}>{wrongCount}</span>
              <span style={{ color: "#94A3B8", marginLeft: 2 }}>· {history.length} done</span>
            </div>

            {patterns && (
              <button onClick={openPatternTutor} style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "none",
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}>🧠 Pattern Detected</button>
            )}

            <div className="quiz-header-nav-btns" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Link href="/mock-exam">
              <button style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px solid #E5E7EB",
                background: "transparent",
                color: "#64748B",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}>📝 Mock Exam</button>
            </Link>

            <Link href="/process">
              <button style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px solid #E5E7EB",
                background: "transparent",
                color: "#64748B",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}>🔬 Processes</button>
            </Link>

            <Link href="/formulas">
              <button style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px solid #E5E7EB",
                background: "transparent",
                color: "#64748B",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}>📐 Formulas</button>
            </Link>

            <Link href="/career">
              <button style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px solid #E5E7EB",
                background: "transparent",
                color: "#64748B",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}>🗺️ Career</button>
            </Link>
            </div>

            {!tutorOpen && current && confirmed && (
              <button onClick={openTutor} className="tutor-btn" style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "none",
                background: "#1D4ED8",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}>🤖 Ask AI Tutor</button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#F1F5F9" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #1D4ED8, #0F766E)",
            width: `${Math.min(progress, 100)}%`,
            transition: "width 0.5s ease",
            borderRadius: "0 2px 2px 0",
          }} />
        </div>
      </div>

      {/* ── MODULE SELECTOR DROPDOWN ── */}
      {showModuleSelector && (
        <div style={{
          position: "fixed",
          top: 72,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          padding: "0 20px",
          animation: "fadeUp 0.2s ease both",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            border: "1px solid #E5E7EB",
            padding: 20,
            maxWidth: 700,
            width: "100%",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 14 }}>
              FILTER BY MODULE — CLICK TO FOCUS YOUR PRACTICE
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <button
                className="module-chip"
                onClick={() => handleModuleSelect(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: `2px solid ${!selectedModule ? "#1D4ED8" : "#E5E7EB"}`,
                  background: !selectedModule ? "#EFF6FF" : "#F8FAFC",
                  color: !selectedModule ? "#1D4ED8" : "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                📚 All Modules ({QUESTIONS.length})
              </button>
              {OIT_MODULES.map(mod => {
                const count = moduleStats[mod] ?? 0;
                const style = MODULE_COLORS[mod] ?? { bg: "#F1F5F9", color: "#475569" };
                const icon = MODULE_ICONS[mod] ?? "📖";
                const isActive = selectedModule === mod;
                return (
                  <button
                    key={mod}
                    className="module-chip"
                    onClick={() => handleModuleSelect(mod)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 20,
                      border: `2px solid ${isActive ? style.color : "#E5E7EB"}`,
                      background: isActive ? style.bg : "#F8FAFC",
                      color: isActive ? style.color : "#475569",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span>{icon}</span>
                    <span>{mod}</span>
                    <span style={{
                      background: isActive ? style.color : "#E5E7EB",
                      color: isActive ? "#fff" : "#64748B",
                      borderRadius: 10,
                      padding: "1px 6px",
                      fontSize: 9,
                      fontWeight: 800,
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowModuleSelector(false)}
              style={{
                padding: "6px 16px", borderRadius: 8,
                border: "1px solid #E5E7EB", background: "transparent",
                color: "#94A3B8", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click-outside to close module selector */}
      {showModuleSelector && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setShowModuleSelector(false)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div
        className="quiz-main-content"
        style={{
          maxWidth: tutorOpen ? "calc(100% - 440px)" : 760,
          margin: "0 auto",
          padding: "28px 20px 80px",
          transition: "max-width 0.3s ease",
        }}
      >

        {/* Module context banner */}
        {selectedModule && (
          <div style={{
            background: MODULE_COLORS[selectedModule]?.bg ?? "#EFF6FF",
            borderRadius: 10,
            padding: "10px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid ${MODULE_COLORS[selectedModule]?.color ?? "#1D4ED8"}33`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{MODULE_ICONS[selectedModule] ?? "📖"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: MODULE_COLORS[selectedModule]?.color ?? "#1D4ED8" }}>
                Focused on: {selectedModule} · {activeQuestions.length} questions
              </span>
            </div>
            <button
              onClick={() => handleModuleSelect(null)}
              style={{
                fontSize: 10, color: "#94A3B8", background: "none",
                border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              }}
            >
              ✕ Clear Filter
            </button>
          </div>
        )}

        <ReadinessScore history={history} />

        {patterns && !tutorOpen && (
          <PatternAlert patterns={patterns} onAskTutor={openPatternTutor} />
        )}

        {adaptive && (
          <div style={{
            background: "#EFF6FF",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 11,
            color: "#1D4ED8",
            fontWeight: 600,
            border: "1px solid #BFDBFE",
            animation: "popIn 0.25s ease both",
          }}>
            🎯 {adaptive}
          </div>
        )}

        {/* ── SESSION COMPLETE ── */}
        {allDone ? (
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: "56px 48px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            animation: "popIn 0.3s ease both",
            boxSizing: "border-box" as const,
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Session Complete!
            </div>
            <div style={{ fontSize: 14, color: "#64748B", marginBottom: 6 }}>
              {correctCount} correct out of {history.length} questions
              {selectedModule && ` · ${selectedModule}`}
            </div>

            {/* Final score ring */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `4px solid ${
                correctCount / history.length >= 0.75 ? "#059669" :
                correctCount / history.length >= 0.6 ? "#D97706" : "#DC2626"
              }`,
              margin: "16px auto",
              background: correctCount / history.length >= 0.75 ? "#F0FDF4" :
                correctCount / history.length >= 0.6 ? "#FFFBEB" : "#FEF2F2",
            }}>
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 20,
                fontWeight: 900,
                color: correctCount / history.length >= 0.75 ? "#059669" :
                  correctCount / history.length >= 0.6 ? "#D97706" : "#DC2626",
              }}>
                {Math.round((correctCount / history.length) * 100)}%
              </span>
            </div>

            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 32 }}>
              {correctCount / history.length >= 0.75
                ? "Excellent work — you're tracking well for the exam! 🏆"
                : correctCount / history.length >= 0.6
                ? "Good effort — keep reviewing your weak modules."
                : "Keep studying — focus on the modules you struggled with."}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={resetSession} className="next-btn" style={{
                padding: "15px 40px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(29,78,216,0.3)",
                transition: "all 0.2s",
              }}>
                Try Another 15 →
              </button>
              {selectedModule ? (
                <button onClick={() => handleModuleSelect(null)} style={{
                  padding: "15px 32px",
                  borderRadius: 14,
                  border: "2px solid #1D4ED8",
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}>
                  Practice All Modules
                </button>
              ) : (
                <button onClick={() => {
                  // Scroll to module selector
                  document.getElementById("module-selector")?.scrollIntoView({ behavior: "smooth" });
                }} style={{
                  padding: "15px 32px",
                  borderRadius: 14,
                  border: "2px solid #0F766E",
                  background: "#F0FDFA",
                  color: "#0F766E",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}>
                  Switch Module
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── QUESTION CARD ── */}
            <div
              key={`q-${current?.id}`}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "32px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                marginBottom: 14,
                animation: "fadeUp 0.3s ease both",
              }}
            >
              {/* Tags + counter */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: moduleStyle.bg,
                    color: moduleStyle.color,
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}>{current?.module.toUpperCase()}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: DIFF_BG[current?.difficulty ?? "easy"],
                    color: DIFF_COLOR[current?.difficulty ?? "easy"],
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}>{current?.difficulty.toUpperCase()}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: "#F1F5F9",
                    color: "#64748B",
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1px solid #E2E8F0",
                  }}>{current?.type}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    fontSize: 11,
                    color: "#94A3B8",
                    fontWeight: 600,
                    background: "#F8FAFC",
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1px solid #E2E8F0",
                  }}>
                    {history.length + 1} / {SESSION_SIZE}
                  </div>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    title="Report an error with this question"
                    style={{
                      background: "none",
                      border: "1px solid #E2E8F0",
                      borderRadius: 20,
                      padding: "4px 10px",
                      fontSize: 11,
                      color: "#94A3B8",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.background = "#FEF2F2"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "none"; }}
                  >
                    🚩 Flag
                  </button>
                </div>
              </div>

              {/* Formula hint */}
              {current?.formula && (
                <div style={{
                  background: "#F8FAFC",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 22,
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 18 }}>📐</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 3 }}>
                      FORMULA HINT
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                      fontSize: 12,
                      color: "#1D4ED8",
                      fontWeight: 700,
                    }}>
                      {current.formula}
                    </div>
                  </div>
                </div>
              )}

              {/* Question text */}
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.65,
                marginBottom: 26,
              }}>
                {current?.q}
              </div>

              {/* Answer options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {current?.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === current.correct;
                  const isWrong = confirmed && isSelected && !isCorrect;
                  const isRight = confirmed && isCorrect;

                  let bg = "#F8FAFC";
                  let border = "#E2E8F0";
                  let textColor = "#374151";

                  if (confirmed) {
                    if (isRight)       { bg = "#F0FDF4"; border = "#22C55E"; textColor = "#14532D"; }
                    else if (isWrong)  { bg = "#FEF2F2"; border = "#EF4444"; textColor = "#7F1D1D"; }
                  } else if (isSelected) {
                    bg = "#EFF6FF"; border = "#3B82F6"; textColor = "#1E3A5F";
                  }

                  return (
                    <button
                      key={i}
                      className="option-btn"
                      onClick={() => !confirmed && setSelected(i)}
                      disabled={confirmed}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `2px solid ${border}`,
                        background: bg,
                        color: textColor,
                        fontSize: 13,
                        fontWeight: isSelected || (confirmed && isCorrect) ? 600 : 400,
                        cursor: confirmed ? "default" : "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.15s ease",
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: confirmed
                          ? isRight ? "#22C55E" : isWrong ? "#EF4444" : "#E2E8F0"
                          : isSelected ? "#3B82F6" : "#E2E8F0",
                        color: confirmed
                          ? (isRight || isWrong) ? "#fff" : "#94A3B8"
                          : isSelected ? "#fff" : "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}>
                        {confirmed && isRight ? "✓" : confirmed && isWrong ? "✗" : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Post-answer feedback */}
              {confirmed && current && (
                <div style={{ marginTop: 22, animation: "fadeUp 0.3s ease both" }}>
                  {/* Result banner */}
                  <div style={{
                    background: selected === current.correct ? "#F0FDF4" : "#FEF2F2",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 12,
                    borderLeft: `4px solid ${selected === current.correct ? "#22C55E" : "#EF4444"}`,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: selected === current.correct ? "#15803D" : "#DC2626",
                      marginBottom: 5,
                    }}>
                      {selected === current.correct ? "✓ Correct!" : "✗ Incorrect"}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
                      {current.explanation}
                    </div>
                  </div>

                  {/* Wrong-answer specific explanation */}
                  {selected !== current.correct && selected !== null && current.wrongExp?.[selected] && (
                    <div style={{
                      background: "#FFFBEB",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 10,
                      borderLeft: "3px solid #F59E0B",
                      fontSize: 11,
                      color: "#78350F",
                      lineHeight: 1.65,
                    }}>
                      <strong>Why you were wrong: </strong>
                      {current.wrongExp[selected]}
                    </div>
                  )}

                  {/* Confidence insight */}
                  {confidence !== null && (
                    <ConfidenceInsight
                      confidence={confidence}
                      correct={selected === current.correct}
                    />
                  )}

                  {/* Step solution toggle */}
                  {current.steps && (
                    <button
                      onClick={() => setShowSteps((s) => !s)}
                      style={{
                        marginTop: 12,
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: `1px solid ${showSteps ? "#22C55E" : "#E2E8F0"}`,
                        background: showSteps ? "#F0FDF4" : "#F8FAFC",
                        color: showSteps ? "#15803D" : "#64748B",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >
                      {showSteps ? "▲ Hide" : "▼ Show"} step-by-step solution
                    </button>
                  )}

                  {showSteps && current.steps && (
                    <StepSolution steps={current.steps} tip={current.tip} />
                  )}

                  {/* Tip */}
                  {!current.steps && (
                    <div style={{
                      marginTop: 12,
                      background: "#EFF6FF",
                      borderRadius: 8,
                      padding: "10px 14px",
                      borderLeft: "3px solid #3B82F6",
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#1D4ED8" }}>💡 TIP  </span>
                      <span style={{ fontSize: 11, color: "#1E3A5F", lineHeight: 1.65 }}>{current.tip}</span>
                    </div>
                  )}

                  {/* Formula sheet deep-link — shown when question has a formula */}
                  {current.formula && (
                    <a
                      href="/formulas"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 10,
                        padding: "7px 14px",
                        borderRadius: 8,
                        background: "#F0F9FF",
                        border: "1px solid #BAE6FD",
                        color: "#0369A1",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                        fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#E0F2FE")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#F0F9FF")}
                    >
                      📐 View full formula sheet ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── CONFIDENCE + ACTION BUTTONS ── */}
            <div
              key={`ctrl-${current?.id}`}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "22px 24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                animation: "fadeUp 0.3s ease 0.06s both",
              }}
            >
              {!confirmed ? (
                <div key={`shake-${shakeKey}`} style={{ animation: shakeKey > 0 ? "shake 0.4s ease" : undefined }}>
                  {/* Confidence toggle + Confirm button on same row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flexShrink: 0 }}>
                      <ConfidenceMeter
                        value={confidence}
                        onChange={setConfidence}
                        disabled={confirmed}
                      />
                    </div>
                    <button
                      onClick={confirm}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 12,
                        border: "none",
                        background: selected !== null && confidence !== null
                          ? "linear-gradient(135deg, #1D4ED8, #0F766E)"
                          : "#E2E8F0",
                        color: selected !== null && confidence !== null ? "#fff" : "#94A3B8",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        boxShadow: selected !== null && confidence !== null
                          ? "0 4px 16px rgba(29,78,216,0.25)"
                          : "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selected === null
                        ? "Select an answer first"
                        : confidence === null
                        ? "Pick confidence →"
                        : "Confirm Answer →"}
                    </button>
                  </div>
                  {(selected === null || confidence === null) && shakeKey > 0 && (
                    <div style={{ textAlign: "center", fontSize: 11, color: "#DC2626", marginTop: 6 }}>
                      {selected === null ? "Please select an answer" : "Please pick your confidence level"}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  {!tutorOpen && (
                    <button
                      onClick={openTutor}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: 12,
                        border: "2px solid #3B82F6",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >
                      🤖 Ask AI Tutor
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="next-btn"
                    style={{
                      flex: tutorOpen ? 1 : 2,
                      padding: "14px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 16px rgba(29,78,216,0.25)",
                      transition: "all 0.2s",
                    }}
                  >
                    Next Question →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── AI TUTOR PANEL ── */}
      {tutorOpen && current && (
        <AITutor
          question={current}
          userAnswer={confirmed ? selected : null}
          history={history}
          patternMode={patternMode}
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

      {/* ── QUIZ GATE (shown after 15 questions for non-unlocked users) ── */}
      {showGate && (
        <QuizGate
          questionsAnswered={history.length}
          onUnlocked={() => {
            setTrialUnlocked();
            setTrialUnlockedState(true);
            setShowGate(false);
            // Continue to next question
            const nextQ = getNextQuestion(history, activeQuestions);
            if (nextQ) {
              const pts = getPatternInsights(history);
              const wasWeak = pts && pts.some((p) => p.module === nextQ.module);
              setAdaptive(wasWeak ? `Serving a ${nextQ.module} question — your weakest area this session.` : null);
              setCurrent(nextQ);
              setSelected(null);
              setConfidence(null);
              setConfirmed(false);
              setShowSteps(false);
              setTutorOpen(false);
              setPatternMode(false);
            } else {
              setCurrent(null);
            }
          }}
        />
      )}
    </div>
  );
}
