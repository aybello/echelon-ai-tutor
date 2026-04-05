// CLASS 4 WATER TREATMENT PRACTICE QUIZ
// 500-question bank · 15-question free trial · paid full access via QuizGate
// Based on Ontario MECP Class 4 Water Treatment Operator exam criteria
// Advanced operator level — complex calculations, regulatory compliance, plant management
import { useState, useCallback, useMemo } from "react";
import { Link, useSearch} from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  QUESTIONS as CLASS4_WATER_QUESTIONS,
  type Question as Class4WaterQuestion,
} from "@/lib/class4WaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import { CLASS4_WATER_FORMULA_LINKS } from "@/lib/formulaLinks";

type QCompat = Class4WaterQuestion & { q: string; wrongExp?: Record<number, string> };
function toCompat(q: Class4WaterQuestion): QCompat {
  return { ...q, q: q.question };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":     { bg: "#FEF9C3", color: "#A16207" },
  "Equipment O&M":           { bg: "#DCFCE7", color: "#15803D" },
  "Regulations & Management":{ bg: "#FEE2E2", color: "#B91C1C" },
  "Source Water & Quality":  { bg: "#EDE9FE", color: "#6D28D9" },
};
const MODULE_ICONS: Record<string, string> = {
  "Treatment Process":       "⚗️",
  "Laboratory Analysis":     "🔬",
  "Equipment O&M":           "🔧",
  "Regulations & Management":"📋",
  "Source Water & Quality":  "🌊",
};

const SESSION_SIZE = 15;

export default function Class4WaterQuiz() {
  usePageMeta({
    title: "Class 4 Water Treatment Practice Quiz — 500 Questions",
    description: "Prepare for the Ontario Class 4 Water Treatment operator exam with 500 advanced questions across 5 modules. AI Tutor, adaptive learning, and confidence tracking included.",
    path: "/class4-water",
    keywords: "Class 4 water treatment exam prep, Ontario operator certification, advanced water treatment, MECP Class 4, O. Reg. 128/04",
  });

  const [history, setHistory] = useState<Array<{
    questionId: number; module: string; topic: string;
    correct: boolean; confidence: number;
    selectedOption: number; wrongExplanation: string | null;
  }>>([]);
  const [current, setCurrent]       = useState<QCompat | null>(() => toCompat(CLASS4_WATER_QUESTIONS[0]));
  const [selected, setSelected]     = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [showSteps, setShowSteps]   = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [shakeKey, setShakeKey]     = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const searchString = useSearch();
  const initialCalcOnly = new URLSearchParams(searchString).get("calcOnly") === "true";
    const [calcOnly, setCalcOnly] = useState(initialCalcOnly);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isTrialUnlocked());
  const [showGate, setShowGate] = useState(false);

  const activeQuestions = useMemo<QCompat[]>(() => {
    const pool = selectedModule
      ? CLASS4_WATER_QUESTIONS.filter(q => q.module === selectedModule && (!calcOnly || (q.steps && q.steps.length > 0)))
      : (calcOnly ? CLASS4_WATER_QUESTIONS.filter(q => q.steps && q.steps.length > 0) : CLASS4_WATER_QUESTIONS);
    return pool.map(toCompat);
  }, [selectedModule, calcOnly]);

  const confirm = useCallback(() => {
    if (selected === null || confidence === null) {
      setShakeKey(k => k + 1);
      return;
    }
    if (!current) return;
    const isCorrect = selected === current.correct;
    setHistory(h => [...h, {
      questionId: current.id,
      module: current.module,
      topic: current.topic,
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      wrongExplanation: null,
    }]);
    setConfirmed(true);
  }, [selected, confidence, current]);

  const nextQuestion = useCallback(() => {
    const sessionCount = history.length + 1;
    if (!trialUnlocked && sessionCount >= SESSION_SIZE) {
      setShowGate(true);
      return;
    }
    const answeredIds = new Set(history.map(h => h.questionId));
    const weakIds = new Set(
      history
        .filter(h => !h.correct || h.confidence < 40)
        .map(h => h.questionId)
    );
    let pool = selectedModule
      ? CLASS4_WATER_QUESTIONS.filter(q => q.module === selectedModule)
      : CLASS4_WATER_QUESTIONS;
    if (calcOnly) pool = pool.filter(q => q.steps && q.steps.length > 0);
    const unanswered = pool.filter(q => !answeredIds.has(q.id));
    const weak = pool.filter(q => weakIds.has(q.id));
    let next: Class4WaterQuestion;
    if (weak.length > 0 && Math.random() < 0.35) {
      next = weak[Math.floor(Math.random() * weak.length)];
    } else if (unanswered.length > 0) {
      next = unanswered[Math.floor(Math.random() * unanswered.length)];
    } else {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
    setCurrent(toCompat(next));
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history, trialUnlocked, selectedModule]);

  const sessionCount = history.length;
  const correctCount = history.filter(h => h.correct).length;
  const accuracy = sessionCount > 0 ? Math.round((correctCount / sessionCount) * 100) : 0;

  if (!current) return null;
  const moduleColor = MODULE_COLORS[current.module] ?? { bg: "#F1F5F9", color: "#475569" };
  const diffColor = current.difficulty === "easy" ? "#059669" : current.difficulty === "medium" ? "#D97706" : "#DC2626";
  const diffBg = current.difficulty === "easy" ? "#DCFCE7" : current.difficulty === "medium" ? "#FEF9C3" : "#FEE2E2";

  if (showGate) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
        <SiteNav currentPath="/class4-water" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 16px" }}>
          <QuizGate
            questionsAnswered={sessionCount}
            onUnlocked={() => { setTrialUnlocked(); setTrialUnlockedState(true); setShowGate(false); nextQuestion(); }}
            onDismiss={() => { setShowGate(false); setHistory([]); setCurrent(toCompat(CLASS4_WATER_QUESTIONS[0])); setSelected(null); setConfidence(null); setConfirmed(false); }}
            productKey="class4-water"
            productName="Class 4 Water Treatment Practice Pass"
            priceLabel="CA$149"
            paidFeatures={[
              "500 advanced questions (Class 4 difficulty)",
              "5 modules: Treatment Process, Lab Analysis, Equipment O&M, Regulations & Management, Source Water & Quality",
              "Adaptive engine prioritizes your weak spots",
              "AI Tutor explains every question in depth",
              "Timed 100-question mock exam with pass/fail breakdown",
              "Class 4 Water formula sheet with worked examples",
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      <SiteNav currentPath="/class4-water" />
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)", color: "#fff", padding: "24px 16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.75, textTransform: "uppercase", marginBottom: 4 }}>
                Echelon Institute
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Class 4 Water Treatment</h1>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                Practice Quiz · 500 Questions · Advanced Operator Level
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/formulas-water4">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📐 Formula Sheet
                </button>
              </Link>
              <Link href="/class4-water-mock">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📋 Mock Exam
                </button>
              </Link>
            </div>
          </div>
          {/* Stats bar */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Answered", value: sessionCount },
              { label: "Correct", value: correctCount },
              { label: "Accuracy", value: `${accuracy}%` },
              { label: "Module", value: selectedModule ?? "All" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 14px", minWidth: 70 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontSize: 10, opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
        {/* Module filter */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowModuleSelector(v => !v)}
            style={{ padding: "8px 14px", background: "#fff", color: "#475569", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            🎯 {selectedModule ? `Module: ${selectedModule}` : "All Modules"} ▾
          </button>
          <button
            onClick={() => setCalcOnly(v => !v)}
            style={{ padding: "8px 14px", background: calcOnly ? "#EDE9FE" : "#fff", color: calcOnly ? "#7C3AED" : "#475569", border: calcOnly ? "1px solid #7C3AED" : "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            🧮 Calc Only
          </button>
          </div>
          {showModuleSelector && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => { setSelectedModule(null); setShowModuleSelector(false); }}
                style={{ padding: "6px 12px", background: !selectedModule ? "#1E40AF" : "#fff", color: !selectedModule ? "#fff" : "#475569", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                All Modules
              </button>
              {Object.keys(MODULE_COLORS).map(mod => (
                <button
                  key={mod}
                  onClick={() => { setSelectedModule(mod); setShowModuleSelector(false); }}
                  style={{ padding: "6px 12px", background: selectedModule === mod ? MODULE_COLORS[mod].color : "#fff", color: selectedModule === mod ? "#fff" : "#475569", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {MODULE_ICONS[mod]} {mod}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Question card */}
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {/* Question header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ background: moduleColor.bg, color: moduleColor.color, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
              {MODULE_ICONS[current.module] ?? "📚"} {current.module}
            </div>
            <div style={{ background: diffBg, color: diffColor, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
              {current.difficulty}
            </div>
            <div style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
              #{current.id}
            </div>
          </div>

          {/* Question text */}
          <div style={{ padding: "20px 20px 16px" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.65 }}>
              {current.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {current.options.map((opt, i) => {
              let bg = "#F8FAFC", border = "#E2E8F0", color = "#374151";
              if (confirmed) {
                if (i === current.correct) { bg = "#F0FDF4"; border = "#86EFAC"; color = "#15803D"; }
                else if (i === selected && i !== current.correct) { bg = "#FEF2F2"; border = "#FCA5A5"; color = "#DC2626"; }
              } else if (selected === i) {
                bg = "#EFF6FF"; border = "#93C5FD"; color = "#1D4ED8";
              }
              return (
                <button
                  key={i}
                  onClick={() => !confirmed && setSelected(i)}
                  style={{ width: "100%", padding: "12px 16px", background: bg, border: `1.5px solid ${border}`, borderRadius: 10, color, textAlign: "left", fontSize: 14, fontWeight: selected === i || (confirmed && i === current.correct) ? 600 : 400, cursor: confirmed ? "default" : "pointer", transition: "all 0.15s", lineHeight: 1.5 }}
                >
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Confidence meter */}
          {!confirmed && (
            <div style={{ padding: "0 20px 16px" }}>
              <ConfidenceMeter value={confidence} onChange={setConfidence} />
            </div>
          )}

          {/* Confirm / Next buttons */}
          <div style={{ padding: "0 20px 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!confirmed ? (
              <button
                onClick={confirm}
                disabled={selected === null || confidence === null}
                style={{ flex: 1, padding: "12px", background: selected !== null && confidence !== null ? "linear-gradient(135deg, #1E3A5F, #1D4ED8)" : "#E2E8F0", color: selected !== null && confidence !== null ? "#fff" : "#94A3B8", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed", transition: "all 0.15s" }}
              >
                Confirm Answer
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowSteps(v => !v)}
                  style={{ flex: 1, padding: "12px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  {showSteps ? "Hide" : "Show"} Explanation
                </button>
                <button
                  onClick={nextQuestion}
                  style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Next Question →
                </button>
              </>
            )}
          </div>

          {/* Explanation */}
          {confirmed && showSteps && (
            <div style={{ margin: "0 20px 20px", padding: "16px", background: "#F0F9FF", borderRadius: 10, border: "1px solid #BAE6FD" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0369A1", marginBottom: 8 }}>📖 Explanation</div>
              <p style={{ margin: 0, fontSize: 14, color: "#0C4A6E", lineHeight: 1.7 }}>{current.explanation}</p>
              {CLASS4_WATER_FORMULA_LINKS[current.id] && (
                <a
                  href={CLASS4_WATER_FORMULA_LINKS[current.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "7px 14px", borderRadius: 8, background: "#CCFBF1", border: "1px solid #99F6E4", color: "#0F766E", fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}
                >
                  📐 View formula sheet ↗
                </a>
              )}
              <button
                onClick={() => setReportModalOpen(true)}
                style={{ marginTop: 10, padding: "4px 10px", background: "transparent", color: "#94A3B8", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
              >
                🚩 Report an issue
              </button>
            </div>
          )}

          {/* AI Tutor */}
          {confirmed && (
            <div style={{ padding: "0 20px 20px" }}>
              <button
                onClick={() => setTutorOpen(v => !v)}
                style={{ width: "100%", padding: "10px", background: tutorOpen ? "#EFF6FF" : "#F8FAFC", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                🤖 {tutorOpen ? "Close" : "Ask"} AI Tutor
              </button>
              {tutorOpen && (
                <div style={{ marginTop: 10 }}>
                  <AITutor
                    question={current as any}
                    userAnswer={selected}
                    history={[]}
                    patternMode={false}
                    onClose={() => setTutorOpen(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {reportModalOpen && (
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
