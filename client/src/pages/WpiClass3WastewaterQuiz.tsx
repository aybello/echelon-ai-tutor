// WPI CLASS III WASTEWATER TREATMENT PRACTICE QUIZ
// 501-question bank aligned with WPI Need-to-Know Criteria (Senior Operator)
// Used for: BC (EOCP Level III), Alberta (AWWOA Class III), Saskatchewan, Manitoba
// 15-question free trial · paid full access via PurchaseGate
import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  wpiClass3WastewaterQuestions,
  WPI_CLASS3_WASTEWATER_MODULES,
  type WpiClass3WastewaterQuestion,
} from "@/lib/wpiClass3WastewaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";

type QCompat = WpiClass3WastewaterQuestion & { q: string; wrongExp?: Record<number, string> };
function toCompat(q: WpiClass3WastewaterQuestion): QCompat {
  return { ...q, q: q.text };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Biological Treatment":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Biological Nutrient Removal":           { bg: "#DCFCE7", color: "#15803D" },
  "Membrane Bioreactors & Advanced Processes": { bg: "#EDE9FE", color: "#6D28D9" },
  "Industrial Pretreatment & Toxicity":    { bg: "#FEE2E2", color: "#B91C1C" },
  "Advanced Biosolids Management":         { bg: "#CCFBF1", color: "#0F766E" },
  "Regulatory Compliance & Reporting":     { bg: "#FEF9C3", color: "#A16207" },
  "Advanced Process Control & Troubleshooting": { bg: "#FFEDD5", color: "#C2410C" },
  "Health, Safety & Environmental Management": { bg: "#F1F5F9", color: "#475569" },
};
const MODULE_ICONS: Record<string, string> = {
  "Advanced Biological Treatment":         "🦠",
  "Biological Nutrient Removal":           "🌿",
  "Membrane Bioreactors & Advanced Processes": "🔬",
  "Industrial Pretreatment & Toxicity":    "🏭",
  "Advanced Biosolids Management":         "♻️",
  "Regulatory Compliance & Reporting":     "📋",
  "Advanced Process Control & Troubleshooting": "⚙️",
  "Health, Safety & Environmental Management": "🦺",
};

const SESSION_SIZE = 15;

export default function WpiClass3WastewaterQuiz() {
  usePageMeta({
    title: "WPI Class III Wastewater Treatment Practice Quiz — 501 Questions",
    description:
      "Practice for the WPI Class III Wastewater Treatment operator exam (BC EOCP Level III, Alberta AWWOA Class III, Saskatchewan, Manitoba) with 501 questions across 8 modules. AI Tutor, step-by-step solutions, and confidence tracking included.",
    path: "/wpi-class3-wastewater",
    keywords:
      "WPI Class III wastewater treatment exam prep, BC EOCP Level III, Alberta AWWOA Class III, Saskatchewan water operator, Manitoba water operator, WPI practice questions, BNR, biosolids, industrial pretreatment",
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
    () => toCompat(wpiClass3WastewaterQuestions[0])
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Gate: first 15 questions are free
  const [trialDone, setTrialDone] = useState(false);
  const [trialUnlocked] = useState(() => isTrialUnlocked());

  const answeredIds = useMemo(() => new Set(history.map((h) => h.questionId)), [history]);
  const correctCount = history.filter((h) => h.correct).length;
  const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : null;

  const moduleStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const h of history) {
      if (!stats[h.module]) stats[h.module] = { correct: 0, total: 0 };
      stats[h.module].total++;
      if (h.correct) stats[h.module].correct++;
    }
    return stats;
  }, [history]);

  const getNextQuestion = useCallback(
    (afterId?: number) => {
      const pool = selectedModule
        ? wpiClass3WastewaterQuestions.filter((q) => q.module === selectedModule)
        : wpiClass3WastewaterQuestions;
      const unanswered = pool.filter((q) => !answeredIds.has(q.id) && q.id !== afterId);
      if (unanswered.length === 0) return null;
      const shuffled = shuffle(unanswered);
      return toCompat(shuffled[0]);
    },
    [answeredIds, selectedModule]
  );

  const allDone = !current;

  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const isCorrect = selected === current.correctAnswer;
    setHistory((prev) => [
      ...prev,
      {
        questionId: current.id,
        module: current.module,
        correct: isCorrect,
        confidence,
        selectedOption: selected,
      },
    ]);
    setConfirmed(true);
    if (!isCorrect) setShakeKey((k) => k + 1);
    // Check trial gate
    if (!trialUnlocked && history.length + 1 >= SESSION_SIZE) {
      setTrialDone(true);
    }
  }, [selected, confidence, current, trialUnlocked, history.length]);

  const handleNext = useCallback(() => {
    const next = getNextQuestion(current?.id);
    setCurrent(next);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
  }, [getNextQuestion, current]);

  const handleModuleChange = useCallback(
    (mod: string | null) => {
      setSelectedModule(mod);
      const pool = mod
        ? wpiClass3WastewaterQuestions.filter((q) => q.module === mod && !answeredIds.has(q.id))
        : wpiClass3WastewaterQuestions.filter((q) => !answeredIds.has(q.id));
      if (pool.length > 0) {
        setCurrent(toCompat(shuffle(pool)[0]));
      } else {
        setCurrent(null);
      }
      setSelected(null);
      setConfidence(null);
      setConfirmed(false);
      setShowSteps(false);
      setShowModuleSelector(false);
    },
    [answeredIds]
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/wpi-class3-wastewater" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <Link href="/wpi">
              <button style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                ← WPI Exams
              </button>
            </Link>
            <span style={{ color: "#CBD5E1", fontSize: 13 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F766E", background: "#CCFBF1", padding: "2px 10px", borderRadius: 20 }}>
              Class III Wastewater
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #0F766E, #0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              ♻️
            </div>
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(18px, 3vw, 24px)",
              fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px",
            }}>
              WPI Class III Wastewater Practice Quiz
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0", lineHeight: 1.5 }}>
            501 questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB ·{" "}
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
              onClick={() => handleModuleChange(null)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                borderColor: selectedModule === null ? "#0F766E" : "#E2E8F0",
                background: selectedModule === null ? "#CCFBF1" : "#fff",
                color: selectedModule === null ? "#0F766E" : "#64748B",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              All Modules
            </button>
            {WPI_CLASS3_WASTEWATER_MODULES.map((m) => {
              const mc = MODULE_COLORS[m] ?? { bg: "#F1F5F9", color: "#475569" };
              const icon = MODULE_ICONS[m] ?? "📚";
              const stat = moduleStats[m];
              return (
                <button
                  key={m}
                  onClick={() => handleModuleChange(selectedModule === m ? null : m)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                    borderColor: selectedModule === m ? mc.color : "#E2E8F0",
                    background: selectedModule === m ? mc.bg : "#fff",
                    color: selectedModule === m ? mc.color : "#64748B",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <span>{icon}</span>
                  <span>{m}</span>
                  {stat && stat.total > 0 && (
                    <span style={{
                      background: stat.correct / stat.total >= 0.7 ? "#DCFCE7" : "#FEE2E2",
                      color: stat.correct / stat.total >= 0.7 ? "#15803D" : "#B91C1C",
                      borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                    }}>
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
          <div style={{
            background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0",
            padding: "48px 32px", textAlign: "center",
          }}>
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
                  setCurrent(toCompat(wpiClass3WastewaterQuestions[0]));
                  setSelected(null); setConfidence(null); setConfirmed(false); setShowSteps(false);
                }}
                style={{
                  padding: "12px 28px", borderRadius: 10,
                  background: "linear-gradient(135deg, #0F766E, #0891B2)",
                  color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Start New Session
              </button>
              <Link href="/wpi-class3-wastewater-mock">
                <button style={{
                  padding: "12px 28px", borderRadius: 10, background: "#fff",
                  color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 14,
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Take Mock Exam →
                </button>
              </Link>
            </div>
          </div>
        ) : trialDone && !trialUnlocked ? (
          <QuizGate
            questionsAnswered={history.length}
            productKey="wpi-class3-wastewater"
            productName="WPI Class III Wastewater Practice Pass"
            priceLabel="CA$99"
            paidFeatures={[
              "501 WPI Class III questions — unlimited attempts",
              "Timed mock exam (100 questions, 2 hrs)",
              "AI Tutor explanations on every question",
              "Module-by-module performance tracking",
            ]}
            onUnlocked={() => {
              setTrialUnlocked();
              setTrialDone(false);
              const next = getNextQuestion();
              setCurrent(next);
              setSelected(null);
              setConfidence(null);
              setConfirmed(false);
              setShowSteps(false);
            }}
          />
        ) : (
          current && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "28px 24px" }}>
              {/* Module badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                  letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 20,
                  background: (MODULE_COLORS[current.module] ?? { bg: "#F1F5F9" }).bg,
                  color: (MODULE_COLORS[current.module] ?? { color: "#475569" }).color,
                }}>
                  {MODULE_ICONS[current.module] ?? "📚"} {current.module}
                </span>
                <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>
                  Q{current.id}
                </span>
              </div>

              {/* Question text */}
              <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", lineHeight: 1.6, margin: "0 0 20px" }}>
                {current.text}
              </p>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 20 }}>
                {current.options.map((opt, i) => {
                  let bg = "#F8FAFC", border = "#E2E8F0", color = "#0F172A";
                  if (selected === i && !confirmed) { bg = "#EFF6FF"; border = "#3B82F6"; color = "#1D4ED8"; }
                  if (confirmed) {
                    if (i === current.correctAnswer) { bg = "#DCFCE7"; border = "#22C55E"; color = "#15803D"; }
                    else if (i === selected && i !== current.correctAnswer) { bg = "#FEE2E2"; border = "#EF4444"; color = "#B91C1C"; }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => !confirmed && setSelected(i)}
                      style={{
                        padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${border}`,
                        background: bg, color, fontSize: 14, fontWeight: selected === i ? 600 : 400,
                        cursor: confirmed ? "default" : "pointer", textAlign: "left" as const,
                        fontFamily: "inherit", lineHeight: 1.5, transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Confidence meter */}
              {selected !== null && !confirmed && (
                <ConfidenceMeter value={confidence} onChange={setConfidence} />
              )}

              {/* Confirm button */}
              {selected !== null && confidence !== null && !confirmed && (
                <button
                  onClick={handleConfirm}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 10, marginTop: 12,
                    background: "linear-gradient(135deg, #0F766E, #0891B2)",
                    color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Confirm Answer
                </button>
              )}

              {/* Post-answer */}
              {confirmed && (
                <div>
                  {/* Explanation */}
                  <div style={{
                    background: selected === current.correctAnswer ? "#F0FDF4" : "#FFF7ED",
                    border: `1px solid ${selected === current.correctAnswer ? "#BBF7D0" : "#FED7AA"}`,
                    borderRadius: 12, padding: "16px", marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selected === current.correctAnswer ? "#15803D" : "#C2410C", marginBottom: 6 }}>
                      {selected === current.correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                    </div>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                      {current.explanation}
                    </p>
                    {current.steps && current.steps.length > 0 && (
                      <button
                        onClick={() => setShowSteps(!showSteps)}
                        style={{
                          marginTop: 10, background: "none", border: "none",
                          color: "#0369A1", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", padding: 0, fontFamily: "inherit",
                        }}
                      >
                        {showSteps ? "Hide" : "Show"} Step-by-Step Solution
                      </button>
                    )}
                    {showSteps && current.steps && (
                      <div style={{ marginTop: 10 }}>
                        {current.steps.map((step, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                            <span style={{ minWidth: 20, height: 20, borderRadius: "50%", background: "#0F766E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: 12, color: "#064E3B", background: "#F0FDF4", borderRadius: 6, padding: "4px 8px", flex: 1, border: "1px solid #BBF7D0" }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={handleNext}
                      style={{
                        flex: 1, padding: "12px 0", borderRadius: 10,
                        background: "linear-gradient(135deg, #0F766E, #0891B2)",
                        color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit", minWidth: 140,
                      }}
                    >
                      Next Question →
                    </button>
                    <button
                      onClick={() => setTutorOpen(true)}
                      style={{
                        padding: "12px 18px", borderRadius: 10, background: "#fff",
                        color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 13,
                        fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      🤖 Ask AI Tutor
                    </button>
                    <button
                      onClick={() => setReportModalOpen(true)}
                      style={{
                        padding: "12px 14px", borderRadius: 10, background: "#fff",
                        color: "#94A3B8", border: "1.5px solid #E2E8F0", fontSize: 12,
                        fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
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
            <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(correctCount / history.length) * 100}%`,
                background: "linear-gradient(90deg, #0F766E, #0891B2)",
                borderRadius: 3, transition: "width 0.3s",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#94A3B8" }}>
              <span>{correctCount} correct</span>
              <span>{history.length - correctCount} incorrect</span>
            </div>
          </div>
        )}

        {/* ── Mock exam CTA ── */}
        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: "linear-gradient(135deg, #F0FDFA, #ECFEFF)",
          borderRadius: 14, border: "1px solid #99F6E4",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Ready for the full exam experience?
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              100-question timed mock exam · 2 hours · 70% pass threshold
            </div>
          </div>
          <Link href="/wpi-class3-wastewater-mock">
            <button style={{
              padding: "10px 22px", borderRadius: 10,
              background: "linear-gradient(135deg, #0F766E, #0891B2)",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const,
            }}>
              Take Mock Exam →
            </button>
          </Link>
        </div>

        {/* ── Formula sheet CTA ── */}
        <div style={{
          marginTop: 12, padding: "16px 24px",
          background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Class III Wastewater Formula Sheet
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              BNR, SRT, SVI, biosolids, mass balance, regulatory calculations
            </div>
          </div>
          <Link href="/formulas-wpi-class3-ww">
            <button style={{
              padding: "10px 22px", borderRadius: 10, background: "#fff",
              color: "#0F172A", border: "1.5px solid #E2E8F0", fontSize: 13,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              View Formulas →
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
          questionText={current.text}
          module={current.module}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}
