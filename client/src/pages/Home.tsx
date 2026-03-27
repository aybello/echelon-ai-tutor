// ECHELON AI TUTOR — Main App Page
// Design: Professional SaaS — Clean Dark-Accent
// Philosophy: Sora typography, blue/teal gradient brand, white cards on slate bg

import { useState, useCallback } from "react";
import { Link } from "wouter";
import {
  QUESTIONS,
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
  Disinfection:          { bg: "#DBEAFE", color: "#1D4ED8" },
  Hydraulics:            { bg: "#DCFCE7", color: "#15803D" },
  Regulations:           { bg: "#EDE9FE", color: "#6D28D9" },
  "Math & Calculations": { bg: "#FFEDD5", color: "#C2410C" },
  "Health & Safety":     { bg: "#FEE2E2", color: "#B91C1C" },
  Wastewater:            { bg: "#CCFBF1", color: "#0F766E" },
  "Water Quality":       { bg: "#FEF9C3", color: "#A16207" },
};

export default function Home() {
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
    const updatedHistory = history; // already updated via setHistory in confirm
    const nextQ = getNextQuestion(updatedHistory, QUESTIONS);
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
  }, [history]);

  const openPatternTutor = () => { setPatternMode(true); setTutorOpen(true); };
  const openTutor = () => { setPatternMode(false); setTutorOpen(true); };

  const resetSession = () => {
    setHistory([]);
    setCurrent(QUESTIONS[0]);
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
  const progress     = (history.length / QUESTIONS.length) * 100;

  const moduleStyle = current
    ? MODULE_COLORS[current.module] ?? { bg: "#DBEAFE", color: "#1D4ED8" }
    : { bg: "#DBEAFE", color: "#1D4ED8" };

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
          padding: "13px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            }}>E</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.04em" }}>
                ECHELON INSTITUTE
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>
                OIT — Adaptive Practice · AI Tutor v2
              </div>
            </div>
          </div>

          {/* Stats + controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
              }}>🔬 Drinking Water</button>
            </Link>

            <Link href="/wastewater">
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
              }}>🔩 Wastewater</button>
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
              }}>🗺️ Career Map</button>
            </Link>

            <Link href="/pumping">
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
              }}>⚙️ Pumping</button>
            </Link>

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
            width: `${progress}%`,
            transition: "width 0.5s ease",
            borderRadius: "0 2px 2px 0",
          }} />
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        maxWidth: tutorOpen ? "calc(100% - 440px)" : 760,
        margin: "0 auto",
        padding: "28px 20px 80px",
        transition: "max-width 0.3s ease",
      }}>

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
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
              Session Complete!
            </div>
            <div style={{ fontSize: 14, color: "#64748B", marginBottom: 6 }}>
              {correctCount} correct out of {history.length} questions
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
                fontFamily: "'Nunito', sans-serif",
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
              Start New Session
            </button>
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
                <div style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  fontWeight: 600,
                  background: "#F8FAFC",
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid #E2E8F0",
                }}>
                  {history.length + 1} / {QUESTIONS.length}
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

                  {/* Tip (for questions without steps) */}
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
                <>
                  <ConfidenceMeter
                    value={confidence}
                    onChange={setConfidence}
                    disabled={confirmed}
                  />
                  <div
                    key={`shake-${shakeKey}`}
                    style={{
                      marginTop: 16,
                      animation: shakeKey > 0 ? "shake 0.4s ease" : undefined,
                    }}
                  >
                    <button
                      onClick={confirm}
                      style={{
                        width: "100%",
                        padding: "15px",
                        borderRadius: 12,
                        border: "none",
                        background: selected !== null && confidence !== null
                          ? "linear-gradient(135deg, #1D4ED8, #0F766E)"
                          : "#E2E8F0",
                        color: selected !== null && confidence !== null ? "#fff" : "#94A3B8",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        boxShadow: selected !== null && confidence !== null
                          ? "0 4px 16px rgba(29,78,216,0.25)"
                          : "none",
                      }}
                    >
                      {selected === null
                        ? "Select an answer first"
                        : confidence === null
                        ? "Set your confidence level first"
                        : "Confirm Answer →"}
                    </button>
                    {(selected === null || confidence === null) && shakeKey > 0 && (
                      <div style={{ textAlign: "center", fontSize: 11, color: "#DC2626", marginTop: 6 }}>
                        {selected === null ? "Please select an answer" : "Please set your confidence level"}
                      </div>
                    )}
                  </div>
                </>
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
    </div>
  );
}
