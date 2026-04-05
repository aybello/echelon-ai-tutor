// WPI CLASS II WATER TREATMENT PRACTICE QUIZ
// 501-question bank aligned with WPI Class III Need-to-Know Criteria
// Used for: BC (EOCP Level II), Alberta (AWWOA Class II), Saskatchewan, Manitoba
// 15-question free trial · paid full access via PurchaseGate

import { useState, useCallback, useMemo } from "react";
import { Link, useSearch} from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  wpiClass2WaterQuestions,
  WPI_CLASS2_WATER_MODULES,
  type WpiClass2WaterQuestion,
} from "@/lib/wpiClass2WaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import StepSolution from "@/components/StepSolution";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import PurchaseGate from "@/components/PurchaseGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";

// Adapt WpiClass2WaterQuestion to the shape expected by sub-components
type QCompat = WpiClass2WaterQuestion & { q: string; wrongExp?: Record<number, string> };
function toCompat(q: WpiClass2WaterQuestion): QCompat {
  return { ...q, q: q.question };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Treatment Processes": { bg: "#DBEAFE", color: "#1D4ED8" },
  "System Design & Engineering":     { bg: "#DCFCE7", color: "#15803D" },
  "Advanced Laboratory & Monitoring": { bg: "#EDE9FE", color: "#6D28D9" },
  "Source Water & Environmental":      { bg: "#CCFBF1", color: "#0F766E" },
  "Management, Regulations & Safety":    { bg: "#FFEDD5", color: "#C2410C" },
};

const MODULE_ICONS: Record<string, string> = {
  "Advanced Treatment Processes": "⚗️",
  "System Design & Engineering":     "🔧",
  "Advanced Laboratory & Monitoring": "🔬",
  "Source Water & Environmental":      "🌊",
  "Management, Regulations & Safety":    "🦺",
};

const SESSION_SIZE = 15;

export default function WpiClass2WaterQuiz() {
  usePageMeta({
    title: "WPI Class III Water Treatment Practice Quiz — 501 Questions",
    description:
      "Practice for the WPI Class III Water Treatment operator exam (BC EOCP Level II, Alberta AWWOA Class II, Saskatchewan, Manitoba) with 501 questions across 5 modules. AI Tutor, step-by-step solutions, and confidence tracking included.",
    path: "/wpi-class2-water",
    keywords:
      "WPI Class II water treatment exam prep, BC EOCP Level II, Alberta AWWOA Class II, Saskatchewan water operator, Manitoba water operator, WPI practice questions",
  });

  const [history, setHistory] = useState<
    Array<{
      questionId: number;
      module: string;
      correct: boolean;
      confidence: number;
      selectedOption: number;
    }>
  >([]);
  const [current, setCurrent] = useState<QCompat | null>(
    () => toCompat(shuffle([...wpiClass2WaterQuestions])[0])
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const searchString = useSearch();
  const initialCalcOnly = new URLSearchParams(searchString).get("calcOnly") === "true";
    const [calcOnly, setCalcOnly] = useState(initialCalcOnly);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Gate: first 15 questions are free
  const [trialDone, setTrialDone] = useState(false);
  const [trialUnlocked] = useState(() => isTrialUnlocked());

  const usedIds = useMemo(() => new Set(history.map((h) => h.questionId)), [history]);

  const pool = useMemo(() => {
    const base = selectedModule
      ? wpiClass2WaterQuestions.filter((q) => q.module === selectedModule)
      : wpiClass2WaterQuestions;
    return base.filter((q) => !usedIds.has(q.id) && (!calcOnly || (q.isCalc)));
  }, [selectedModule, usedIds, calcOnly]);

  const getNext = useCallback(() => {
    if (pool.length === 0) return null;
    const shuffled = shuffle([...pool]);
    return toCompat(shuffled[0]);
  }, [pool]);

  function handleSelect(idx: number) {
    if (confirmed) return;
    setSelected(idx);
    setConfidence(null);
  }

  function handleConfirm() {
    if (selected === null || confidence === null) return;
    setConfirmed(true);
  }

  function handleNext() {
    if (!current || selected === null) return;
    const isCorrect = selected === current.correctAnswer;
    setHistory((h) => [
      ...h,
      {
        questionId: current.id,
        module: current.module,
        correct: isCorrect,
        confidence: confidence ?? 3,
        selectedOption: selected,
      },
    ]);

    // Check trial limit
    const newCount = history.length + 1;
    if (!trialUnlocked && newCount >= SESSION_SIZE) {
      setTrialDone(true);
      return;
    }


    const next = getNext();
    setCurrent(next);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
  }

  const correctCount = history.filter((h) => h.correct).length;
  const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : null;

  const moduleStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const m of WPI_CLASS2_WATER_MODULES) stats[m] = { correct: 0, total: 0 };
    for (const h of history) {
      if (!stats[h.module]) stats[h.module] = { correct: 0, total: 0 };
      stats[h.module].total++;
      if (h.correct) stats[h.module].correct++;
    }
    return stats;
  }, [history]);

  // ── Trial gate ──────────────────────────────────────────────────────────────
  if (trialDone && !trialUnlocked) {
    return (
      <QuizGate
        questionsAnswered={history.length}
        productKey="wpi-class2-water"
        productName="WPI Class II Water Treatment Practice Pass"
        priceLabel="CA$79"
        paidFeatures={[
          "502 WPI Class II questions — unlimited attempts",
          "Timed mock exam (100 questions, 2 hrs)",
          "AI Tutor explanations on every question",
          "Module-by-module performance tracking",
        ]}
        onUnlocked={() => {
          setTrialUnlocked();
          setTrialDone(false);
          const next = getNext();
          setCurrent(next);
          setSelected(null);
          setConfidence(null);
          setConfirmed(false);
          setShowSteps(false);
        }}
      />
    );
  }

  const allDone = !current;

  return (
    <div
      style={{
        fontFamily: "Sora, Nunito, sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      <SiteNav currentPath="/wpi-class2-water" />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 16px 80px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 20,
              }}
            >
              ⚗️
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0369A1",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 2,
                }}
              >
                WPI Class II · Water Treatment
              </div>
              <h1
                style={{
                  fontSize: "clamp(18px, 3vw, 24px)",
                  fontWeight: 900,
                  color: "#0F172A",
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Practice Quiz
              </h1>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
            501 questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB ·{" "}
            <span style={{ color: "#0369A1", fontWeight: 600 }}>
              {history.length} answered
              {accuracy !== null ? ` · ${accuracy}% accuracy` : ""}
            </span>
          </p>
        </div>

        {/* ── Module selector ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedModule(null)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: selectedModule === null ? "#1D4ED8" : "#E2E8F0",
                background: selectedModule === null ? "#EFF6FF" : "#fff",
                color: selectedModule === null ? "#1D4ED8" : "#64748B",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              All Modules
            </button>
            <button
              onClick={() => {
                const newCalcOnly = !calcOnly;
                setCalcOnly(newCalcOnly);
                // Immediately load a question from the filtered pool
                const newPool = wpiClass2WaterQuestions.filter((q) => !newCalcOnly || q.isCalc);
                const next = newPool.length > 0 ? toCompat(shuffle([...newPool])[0]) : null;
                setCurrent(next);
                setSelected(null);
                setConfidence(null);
                setConfirmed(false);
                setShowSteps(false);
                setHistory([]);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: calcOnly ? "#7C3AED" : "#E2E8F0",
                background: calcOnly ? "#EDE9FE" : "#fff",
                color: calcOnly ? "#7C3AED" : "#64748B",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              🧮 Calc Only
            </button>
            {WPI_CLASS2_WATER_MODULES.map((m) => {
              const mc = MODULE_COLORS[m] ?? { bg: "#F1F5F9", color: "#475569" };
              const icon = MODULE_ICONS[m] ?? "📚";
              const stat = moduleStats[m];
              return (
                <button
                  key={m}
                  onClick={() => setSelectedModule(selectedModule === m ? null : m)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1.5px solid",
                    borderColor: selectedModule === m ? mc.color : "#E2E8F0",
                    background: selectedModule === m ? mc.bg : "#fff",
                    color: selectedModule === m ? mc.color : "#64748B",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span>{icon}</span>
                  <span>{m}</span>
                  {stat && stat.total > 0 && (
                    <span
                      style={{
                        background: stat.correct / stat.total >= 0.7 ? "#DCFCE7" : "#FEE2E2",
                        color: stat.correct / stat.total >= 0.7 ? "#15803D" : "#B91C1C",
                        borderRadius: 10,
                        padding: "1px 7px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {Math.round((stat.correct / stat.total) * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Question card ── */}
        {allDone ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              padding: "48px 32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>
              Session Complete!
            </h2>
            <p style={{ color: "#64748B", fontSize: 15, margin: "0 0 24px" }}>
              {correctCount} / {history.length} correct ({accuracy}%)
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setHistory([]);
                  setCurrent(toCompat(shuffle([...wpiClass2WaterQuestions])[0]));
                  setSelected(null);
                  setConfidence(null);
                  setConfirmed(false);
                  setShowSteps(false);
                }}
                style={{
                  padding: "12px 28px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                  color: "#fff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Start New Session
              </button>
              <Link href="/wpi-class2-water-mock">
                <button
                  style={{
                    padding: "12px 28px",
                    borderRadius: 10,
                    background: "#fff",
                    color: "#0F172A",
                    border: "1.5px solid #E2E8F0",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Try Mock Exam →
                </button>
              </Link>
            </div>
          </div>
        ) : (
          current && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                padding: "28px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Module badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span
                  style={{
                    background: MODULE_COLORS[current.module]?.bg ?? "#F1F5F9",
                    color: MODULE_COLORS[current.module]?.color ?? "#475569",
                    borderRadius: 20,
                    padding: "3px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {MODULE_ICONS[current.module] ?? "📚"} {current.module}
                </span>
                <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>
                  Q{history.length + 1}
                </span>
              </div>

              {/* Question */}
              <p
                style={{
                  fontSize: "clamp(15px, 2.5vw, 17px)",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.55,
                  margin: "0 0 20px",
                }}
              >
                {current.question}
              </p>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {current.options.map((opt, idx) => {
                  let bg = "#F8FAFC";
                  let border = "#E2E8F0";
                  let color = "#0F172A";
                  if (confirmed) {
                    if (idx === current.correctAnswer) {
                      bg = "#DCFCE7";
                      border = "#86EFAC";
                      color = "#15803D";
                    } else if (idx === selected) {
                      bg = "#FEE2E2";
                      border = "#FCA5A5";
                      color = "#B91C1C";
                    }
                  } else if (idx === selected) {
                    bg = "#EFF6FF";
                    border = "#93C5FD";
                    color = "#1D4ED8";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={confirmed}
                      style={{
                        padding: "13px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${border}`,
                        background: bg,
                        color,
                        fontSize: 14,
                        fontWeight: idx === selected || (confirmed && idx === current.correctAnswer) ? 700 : 500,
                        cursor: confirmed ? "default" : "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        lineHeight: 1.45,
                        transition: "all 0.1s",
                      }}
                    >
                      <span style={{ opacity: 0.5, marginRight: 8, fontSize: 12 }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Confidence meter */}
              {selected !== null && !confirmed && (
                <ConfidenceMeter value={confidence} onChange={setConfidence} />
              )}

              {/* Confirm / Next */}
              {selected !== null && !confirmed && confidence !== null && (
                <button
                  onClick={handleConfirm}
                  style={{
                    marginTop: 12,
                    padding: "12px 0",
                    width: "100%",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                    color: "#fff",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Confirm Answer
                </button>
              )}

              {/* Explanation */}
              {confirmed && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      background: selected === current.correctAnswer ? "#F0FDF4" : "#FFF7ED",
                      border: `1px solid ${selected === current.correctAnswer ? "#BBF7D0" : "#FED7AA"}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: selected === current.correctAnswer ? "#15803D" : "#C2410C",
                        marginBottom: 6,
                      }}
                    >
                      {selected === current.correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                    </div>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                      {current.explanation}
                    </p>
                  </div>

                  {current.steps && current.steps.length > 0 && (
                    <StepSolution
                      steps={current.steps as { l: string; c: string }[]}
                      tip={current.tip || ""}
                    />
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <button
                      onClick={handleNext}
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                        color: "#fff",
                        border: "none",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        minWidth: 140,
                      }}
                    >
                      Next Question →
                    </button>
                    <button
                      onClick={() => setTutorOpen(true)}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 10,
                        background: "#fff",
                        color: "#0F172A",
                        border: "1.5px solid #E2E8F0",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      🤖 Ask AI Tutor
                    </button>
                    <button
                      onClick={() => setReportModalOpen(true)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#fff",
                        color: "#94A3B8",
                        border: "1.5px solid #E2E8F0",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ⚑ Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── Progress bar ── */}
        {history.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                height: 6,
                background: "#E2E8F0",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(correctCount / history.length) * 100}%`,
                  background: "linear-gradient(90deg, #1D4ED8, #0E7490)",
                  borderRadius: 3,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontSize: 11,
                color: "#94A3B8",
              }}
            >
              <span>{correctCount} correct</span>
              <span>{history.length - correctCount} incorrect</span>
            </div>
          </div>
        )}

        {/* ── Mock exam CTA ── */}
        <div
          style={{
            marginTop: 32,
            padding: "20px 24px",
            background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
            borderRadius: 14,
            border: "1px solid #BFDBFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Ready for the full exam experience?
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              100-question timed mock exam · 2 hours · 70% pass threshold
            </div>
          </div>
          <Link href="/wpi-class2-water-mock">
            <button
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #1D4ED8, #0E7490)",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              Take Mock Exam →
            </button>
          </Link>
        </div>
      </div>

      {/* ── AI Tutor ── */}
      {tutorOpen && current && (
        <AITutor
          question={null}
          userAnswer={selected}
          history={[]}
          patternMode={false}
          onClose={() => setTutorOpen(false)}
        />
      )}

      {/* ── Report modal ── */}
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
