// WPI CLASS IV WASTEWATER TREATMENT PRACTICE QUIZ
// 502-question bank aligned with WPI Need-to-Know Criteria (Chief Operator)
// Used for: BC (EOCP Level IV), Alberta (AWWOA Class IV), Saskatchewan, Manitoba
// 15-question free trial · paid full access via PurchaseGate
import StepSolution from "@/components/StepSolution";
import { useState, useCallback, useMemo } from "react";
import { Link, useSearch} from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  wpiClass4WastewaterQuestions,
  WPI_CLASS4_WASTEWATER_MODULES,
  type WpiClass4WastewaterQuestion,
} from "@/lib/wpiClass4WastewaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import PurchaseGate from "@/components/PurchaseGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";

type QCompat = WpiClass4WastewaterQuestion & { q: string; wrongExp?: Record<number, string> };
function toCompat(q: WpiClass4WastewaterQuestion): QCompat {
  return { ...q, q: q.text };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Process Control & Optimization":           { bg: "#DBEAFE", color: "#1D4ED8" },
  "Advanced Nutrient Removal & Resource Recovery":     { bg: "#DCFCE7", color: "#15803D" },
  "Emerging Technologies & Innovation":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Plant Management, Asset Management & Leadership":   { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulatory Compliance, Reporting & Environmental Management": { bg: "#FEF9C3", color: "#A16207" },
  "Emergency Response & Resilience Planning":          { bg: "#FFEDD5", color: "#C2410C" },
  "Health, Safety & Environmental Stewardship":        { bg: "#F1F5F9", color: "#475569" },
};

const MODULE_ICONS: Record<string, string> = {
  "Advanced Process Control & Optimization":           "⚙️",
  "Advanced Nutrient Removal & Resource Recovery":     "♻️",
  "Emerging Technologies & Innovation":                "🔬",
  "Plant Management, Asset Management & Leadership":   "🏛️",
  "Regulatory Compliance, Reporting & Environmental Management": "📋",
  "Emergency Response & Resilience Planning":          "🚨",
  "Health, Safety & Environmental Stewardship":        "🦺",
};

const SESSION_SIZE = 15;

export default function WpiClass4WastewaterQuiz() {
  usePageMeta({
    title: "WPI Class IV Wastewater Practice Quiz | Echelon Institute",
    description: "502-question WPI Class IV Wastewater Treatment practice quiz. Chief operator level — advanced process control, nutrient recovery, emerging technologies, plant management, regulatory compliance.",
  });

  const [history, setHistory] = useState<{
    questionId: number; module: string; correct: boolean; confidence: number; selectedOption: number;
  }[]>([]);
  const [current, setCurrent] = useState<QCompat | null>(() =>
    toCompat(shuffle([...wpiClass4WastewaterQuestions])[0])
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
        ? wpiClass4WastewaterQuestions.filter((q) => q.module === selectedModule && (!calcOnly || (q.isCalc)))
        : (calcOnly ? wpiClass4WastewaterQuestions.filter((q) => q.isCalc) : wpiClass4WastewaterQuestions);
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
        ? wpiClass4WastewaterQuestions.filter((q) => q.module === mod && !answeredIds.has(q.id))
        : wpiClass4WastewaterQuestions.filter((q) => !answeredIds.has(q.id));
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
      <SiteNav currentPath="/wpi-class4-wastewater" />
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
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", background: "#EDE9FE", padding: "2px 10px", borderRadius: 20 }}>
              Class IV Wastewater
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              🏛️
            </div>
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(18px, 3vw, 24px)",
              fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px",
            }}>
              WPI Class IV Wastewater Practice Quiz
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0", lineHeight: 1.5 }}>
            502 questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB ·{" "}
            <span style={{ color: "#7C3AED", fontWeight: 600 }}>Chief Operator Level</span>
          </p>
        </div>

        {/* ── Module selector ── */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowModuleSelector((v) => !v)}
            style={{
              padding: "8px 16px", borderRadius: 10, background: "#fff",
              border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 600,
              color: "#0F172A", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {selectedModule ? `📂 ${selectedModule}` : "📂 All Modules"}
            <span style={{ color: "#94A3B8" }}>▾</span>
          </button>
          {showModuleSelector && (
            <div style={{
              marginTop: 8, background: "#fff", border: "1.5px solid #E2E8F0",
              borderRadius: 12, padding: 12, display: "flex", flexWrap: "wrap", gap: 8,
            }}>
              <button
                onClick={() => handleModuleChange(null)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  background: !selectedModule ? "#0F172A" : "#F1F5F9",
                  color: !selectedModule ? "#fff" : "#475569",
                  border: "none",
                }}
              >
                All Modules
              </button>
              {WPI_CLASS4_WASTEWATER_MODULES.map((mod) => {
                const c = MODULE_COLORS[mod] || { bg: "#F1F5F9", color: "#475569" };
                const icon = MODULE_ICONS[mod] || "📚";
                const stats = moduleStats[mod];
                return (
                  <button
                    key={mod}
                    onClick={() => handleModuleChange(mod)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      background: selectedModule === mod ? c.color : c.bg,
                      color: selectedModule === mod ? "#fff" : c.color,
                      border: "none",
                    }}
                  >
                    {icon} {mod}
                    {stats && (
                      <span style={{ marginLeft: 6, opacity: 0.8 }}>
                        {Math.round((stats.correct / stats.total) * 100)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Stats bar ── */}
        {history.length > 0 && (
          <div style={{
            display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap",
          }}>
            {[
              { label: "Answered", value: history.length, color: "#0F172A" },
              { label: "Correct", value: correctCount, color: "#059669" },
              { label: "Accuracy", value: `${accuracy}%`, color: accuracy! >= 70 ? "#059669" : "#DC2626" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, minWidth: 80, background: "#fff", borderRadius: 10,
                padding: "10px 14px", border: "1px solid #E2E8F0", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Trial gate ── */}
        {trialDone && !trialUnlocked ? (
          <QuizGate
            questionsAnswered={history.length}
            productKey="wpi-class4-wastewater"
            productName="WPI Class IV Wastewater Practice Pass"
            priceLabel="CA$149"
            paidFeatures={[
              "502 WPI Class IV questions — unlimited attempts",
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
          <PurchaseGate examType="wpi-class4-wastewater" productKey="wpi-class4-wastewater" productName="WPI Class IV Wastewater Practice Pass" price={149}>
            {allDone ? (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "32px 24px",
                border: "1px solid #E2E8F0", textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 900, color: "#0F172A", margin: "0 0 8px" }}>
                  All Questions Answered!
                </h2>
                <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
                  Final score: <strong style={{ color: accuracy! >= 70 ? "#059669" : "#DC2626" }}>{accuracy}%</strong> ({correctCount}/{history.length})
                </p>
                <button
                  onClick={() => {
                    setHistory([]);
                    setCurrent(toCompat(shuffle([...wpiClass4WastewaterQuestions])[0]));
                    setSelected(null);
                    setConfidence(null);
                    setConfirmed(false);
                    setShowSteps(false);
                    setSelectedModule(null);
                  }}
                  style={{
                    padding: "12px 28px", borderRadius: 12,
                    background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                    color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Start New Session
                </button>
              </div>
            ) : current ? (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "24px",
                border: "1px solid #E2E8F0",
              }}>
                {/* Module badge */}
                <div style={{ marginBottom: 12 }}>
                  {(() => {
                    const c = MODULE_COLORS[current.module] || { bg: "#F1F5F9", color: "#475569" };
                    const icon = MODULE_ICONS[current.module] || "📚";
                    return (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: c.color,
                        background: c.bg, padding: "3px 10px", borderRadius: 20,
                      }}>
                        {icon} {current.module}
                      </span>
                    );
                  })()}
                </div>

                {/* Question */}
                <p style={{
                  fontSize: "clamp(14px, 2.5vw, 16px)", fontWeight: 600,
                  color: "#0F172A", lineHeight: 1.6, margin: "0 0 20px",
                }}>
                  {current.text}
                </p>

                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {current.options.map((opt, i) => {
                    let bg = "#F8FAFC", border = "#E2E8F0", color = "#0F172A";
                    if (confirmed) {
                      if (i === current.correctAnswer) { bg = "#DCFCE7"; border = "#86EFAC"; color = "#15803D"; }
                      else if (i === selected) { bg = "#FEE2E2"; border = "#FCA5A5"; color = "#B91C1C"; }
                    } else if (selected === i) {
                      bg = "#EEF2FF"; border = "#818CF8"; color = "#3730A3";
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => !confirmed && setSelected(i)}
                        style={{
                          padding: "12px 16px", borderRadius: 10, background: bg,
                          border: `1.5px solid ${border}`, color, fontSize: 14,
                          fontWeight: 500, cursor: confirmed ? "default" : "pointer",
                          textAlign: "left", fontFamily: "inherit", lineHeight: 1.5,
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontWeight: 700, marginRight: 8 }}>
                          {["A", "B", "C", "D"][i]}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Confidence meter */}
                {!confirmed && selected !== null && (
                  <div style={{ marginBottom: 16 }}>
                    <ConfidenceMeter value={confidence} onChange={setConfidence} />
                  </div>
                )}

                {/* Confirm button */}
                {!confirmed && selected !== null && confidence !== null && (
                  <button
                    onClick={handleConfirm}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 12,
                      background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                      color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit", marginBottom: 8,
                    }}
                  >
                    Confirm Answer
                  </button>
                )}

                {/* Explanation */}
                {confirmed && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{
                      padding: "14px 16px", borderRadius: 12,
                      background: selected === current.correctAnswer ? "#F0FDF4" : "#FFF1F2",
                      border: `1px solid ${selected === current.correctAnswer ? "#BBF7D0" : "#FECDD3"}`,
                      marginBottom: 12,
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, marginBottom: 6,
                        color: selected === current.correctAnswer ? "#15803D" : "#B91C1C",
                      }}>
                        {selected === current.correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                      </div>
                      <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
                        {current.explanation}
                      </p>
                    </div>

                    {current.steps && current.steps.length > 0 && (
                      <StepSolution
                        steps={current.steps as { l: string; c: string }[]}
                        tip={current.tip || ""}
                      />
                    )}


                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={handleNext}
                        style={{
                          padding: "12px 24px", borderRadius: 10,
                          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
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
            ) : null}
          </PurchaseGate>
        )}

        {/* ── Progress bar ── */}
        {history.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(correctCount / history.length) * 100}%`,
                background: "linear-gradient(90deg, #7C3AED, #4F46E5)",
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
          background: "linear-gradient(135deg, #F5F3FF, #EEF2FF)",
          borderRadius: 14, border: "1px solid #C4B5FD",
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
          <Link href="/wpi-class4-wastewater-mock">
            <button style={{
              padding: "10px 22px", borderRadius: 10,
              background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
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
              Class IV Wastewater Formula Sheet
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Advanced process control, BNR, biogas, mass balance, regulatory calculations
            </div>
          </div>
          <Link href="/formulas-wpi-class4-ww">
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
