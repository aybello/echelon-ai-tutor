// CLASS 2 WATER TREATMENT PRACTICE QUIZ
// 282-question bank · 15-question free trial · paid full access via PurchaseGate
// Sources: RoyCEU Water Operator Study Guide 1 + AWWA Water Operator Certification Study Guide

import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  QUESTIONS as CLASS2_WATER_QUESTIONS,
  type Question as Class2WaterQuestion,
} from "@/lib/class2WaterQuestions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import ReportErrorModal from "@/components/ReportErrorModal";
import QuizGate, { isTrialUnlocked, setTrialUnlocked } from "@/components/QuizGate";
import SiteNav from "@/components/SiteNav";
import { shuffle } from "@/lib/utils";
import { CLASS2_WATER_FORMULA_LINKS } from "@/lib/formulaLinks";

// Adapt Question to the shape expected by sub-components
type QCompat = Class2WaterQuestion & { q: string; wrongExp?: Record<number, string> };

function toCompat(q: Class2WaterQuestion): QCompat {
  return { ...q, q: q.question };
}


const DIFF_COLOR: Record<string, string> = { easy: "#059669", medium: "#D97706", hard: "#DC2626" };
const DIFF_BG: Record<string, string>    = { easy: "#DCFCE7", medium: "#FEF9C3", hard: "#FEE2E2" };

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":              { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":            { bg: "#FEF9C3", color: "#A16207" },
  "Equipment Operation & Maintenance": { bg: "#DCFCE7", color: "#15803D" },
  "Source Water Characteristics":   { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety & Administrative": { bg: "#FEE2E2", color: "#B91C1C" },
};
const MODULE_ICONS: Record<string, string> = {
  "Treatment Process":              "⚗️",
  "Laboratory Analysis":            "🔬",
  "Equipment Operation & Maintenance": "🔧",
  "Source Water Characteristics":   "🌊",
  "Security, Safety & Administrative": "🛡️",
};

const CLASS2_WATER_MODULES = Object.keys(MODULE_COLORS);
const SESSION_SIZE = 15;

export default function Class2WaterQuiz() {
  usePageMeta({
    title: "Class 2 Water Treatment Practice Quiz — 500 Questions",
    description: "Practice for the Ontario Class 2 Water Treatment operator exam with 500 questions across 5 modules. AI Tutor, step-by-step solutions, and confidence tracking included.",
    path: "/class2-water",
    keywords: "Class 2 water treatment exam prep, Ontario operator certification, water treatment practice questions, OWWCO Class 2, O. Reg. 128/04",
  });

  const [history, setHistory]       = useState<Array<{ questionId: number; module: string; topic: string; correct: boolean; confidence: number; selectedOption: number; wrongExplanation: string | null }>>([]);
  const [current, setCurrent]       = useState<QCompat | null>(() => toCompat(CLASS2_WATER_QUESTIONS[0]));
  const [selected, setSelected]     = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [showSteps, setShowSteps]   = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [shakeKey, setShakeKey]     = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [calcOnly, setCalcOnly] = useState(false);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isTrialUnlocked());
  const [showGate, setShowGate]     = useState(false);

  const activeQuestions = useMemo<QCompat[]>(() => {
    const pool = selectedModule
      ? CLASS2_WATER_QUESTIONS.filter(q => q.module === selectedModule)
      : CLASS2_WATER_QUESTIONS;
    return pool.map(toCompat);
  }, [selectedModule]);

  const confirm = useCallback(() => {
    if (selected === null || confidence === null) {
      setShakeKey(k => k + 1);
      return;
    }
    if (!current) return;
    const isCorrect = selected === current.correct;
    const entry = {
      questionId: current.id,
      module: current.module,
      topic: current.topic,
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      wrongExplanation: !isCorrect ? null : null,
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setConfirmed(true);
    if (updatedHistory.length >= SESSION_SIZE && !trialUnlocked) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlocked]);

  const getNextQ = useCallback((hist: typeof history): QCompat | null => {
    const answeredIds = new Set(hist.map(h => h.questionId));
    const unanswered = activeQuestions.filter(q => !answeredIds.has(q.id));
    if (unanswered.length === 0) return null;
    const wrongModules = new Set(hist.filter(h => !h.correct).map(h => h.module));
    const weak = unanswered.filter(q => wrongModules.has(q.module));
    const pool = weak.length > 0 ? weak : unanswered;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [activeQuestions]);

  const next = useCallback(() => {
    if (history.length >= SESSION_SIZE) {
      setCurrent(null);
      return;
    }
    const nextQ = getNextQ(history);
    setCurrent(nextQ);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [history, getNextQ]);

  const resetSession = useCallback(() => {
    const shuffled = shuffle([...activeQuestions]);
    setHistory([]);
    setCurrent(shuffled[0] ?? null);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  }, [activeQuestions]);

  const handleModuleSelect = (mod: string | null) => {
    setSelectedModule(mod);
    setShowModuleSelector(false);
    const pool = mod
      ? CLASS2_WATER_QUESTIONS.filter(q => q.module === mod).map(toCompat)
      : CLASS2_WATER_QUESTIONS.map(toCompat);
    setHistory([]);
    setCurrent(pool[0] ?? null);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setTutorOpen(false);
  };

  const correctCount = history.filter(h => h.correct).length;
  const wrongCount   = history.filter(h => !h.correct).length;
  const progress     = (history.length / SESSION_SIZE) * 100;

  const moduleStyle = current
    ? MODULE_COLORS[current.module] ?? { bg: "#DBEAFE", color: "#1D4ED8" }
    : { bg: "#DBEAFE", color: "#1D4ED8" };

  const moduleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CLASS2_WATER_QUESTIONS.forEach(q => {
      stats[q.module] = (stats[q.module] ?? 0) + 1;
    });
    return stats;
  }, []);

  // Session complete screen
  if (!current && history.length > 0) {
    const pct = Math.round((correctCount / history.length) * 100);
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/class2-water" />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 70 ? "🎉" : "📚"}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Session Complete!</h2>
            <div style={{ fontSize: 40, fontWeight: 900, color: pct >= 70 ? "#059669" : "#DC2626", marginBottom: 4 }}>{pct}%</div>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>{correctCount} correct · {wrongCount} incorrect · {SESSION_SIZE} questions</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={resetSession}
                style={{ flex: 1, padding: "14px 20px", borderRadius: 14, background: "linear-gradient(135deg, #0369A1, #0E7490)", color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                🔄 New Session
              </button>
              <Link href="/class2-water-mock" style={{ flex: 1 }}>
                <button style={{ width: "100%", padding: "14px 20px", borderRadius: 14, background: "#fff", color: "#0369A1", fontWeight: 700, fontSize: 15, border: "1.5px solid #0369A1", cursor: "pointer", fontFamily: "inherit" }}>
                  📝 Mock Exam
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
      `}</style>

      <SiteNav currentPath="/class2-water" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0369A1 0%, #0E7490 100%)", color: "#fff", padding: "24px 16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.75, textTransform: "uppercase", marginBottom: 4 }}>Echelon Institute</div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Class 2 Water Treatment</h1>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Practice Quiz · 500 Questions · Intermediate Level</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/formulas-water2">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📐 Formula Sheet
                </button>
              </Link>
              <Link href="/class2-water-mock">
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  📋 Mock Exam
                </button>
              </Link>
            </div>
          </div>
          {/* Stats bar */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Answered", value: history.length },
              { label: "Correct", value: correctCount },
              { label: "Accuracy", value: `${history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0}%` },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
            <button
              onClick={() => setShowModuleSelector(v => !v)}
              style={{ padding: "6px 14px", background: selectedModule ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {selectedModule ? `📚 ${selectedModule.split(" ")[0]}` : "📚 All Modules"}
            </button>
            <button
              onClick={() => setCalcOnly(v => !v)}
              style={{ padding: "6px 14px", background: calcOnly ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.15)", color: "#fff", border: calcOnly ? "1px solid rgba(167,139,250,0.8)" : "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              🧮 Calc Only
            </button>
          </div>
          {/* Module selector inline */}
          {showModuleSelector && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => handleModuleSelect(null)}
                style={{ padding: "6px 12px", background: !selectedModule ? "#fff" : "rgba(255,255,255,0.15)", color: !selectedModule ? "#0369A1" : "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                All Modules
              </button>
              {CLASS2_WATER_MODULES.map(mod => (
                <button
                  key={mod}
                  onClick={() => handleModuleSelect(mod)}
                  style={{ padding: "6px 12px", background: selectedModule === mod ? "#fff" : "rgba(255,255,255,0.15)", color: selectedModule === mod ? "#0369A1" : "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {MODULE_ICONS[mod] ?? "📖"} {mod}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "rgba(0,0,0,0.1)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.6)", transition: "width 0.4s ease" }} />
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* Question card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 16, animation: "fadeUp 0.25s ease" }}>
          {/* Module + topic + difficulty badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <span style={{ padding: "3px 10px", borderRadius: 100, background: moduleStyle.bg, color: moduleStyle.color, fontSize: 10, fontWeight: 700 }}>
              {MODULE_ICONS[current.module] ?? "📖"} {current.module}
            </span>
            <span style={{ padding: "3px 10px", borderRadius: 100, background: "#F1F5F9", color: "#64748B", fontSize: 10, fontWeight: 700 }}>
              {current.topic}
            </span>
            {current.difficulty && (
              <span style={{ padding: "3px 10px", borderRadius: 100, background: DIFF_BG[current.difficulty] ?? "#F1F5F9", color: DIFF_COLOR[current.difficulty] ?? "#64748B", fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>
                {current.difficulty}
              </span>
            )}
          </div>

          <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", lineHeight: 1.65, marginBottom: 24 }}>
            {current.question}
          </div>

          {/* Options */}
          <div
            key={shakeKey}
            style={{ display: "flex", flexDirection: "column", gap: 10, animation: shakeKey > 0 ? "shake 0.4s ease" : undefined }}
          >
            {current.options.map((opt, i) => {
              const isSelected  = selected === i;
              const isCorrect   = confirmed && i === current.correct;
              const isWrong     = confirmed && isSelected && i !== current.correct;
              return (
                <button
                  key={i}
                  onClick={() => !confirmed && setSelected(i)}
                  disabled={confirmed}
                  style={{
                    padding: "14px 18px", borderRadius: 12, textAlign: "left",
                    border: isCorrect ? "2px solid #059669" : isWrong ? "2px solid #DC2626" : isSelected ? "2px solid #0369A1" : "1.5px solid #E2E8F0",
                    background: isCorrect ? "#F0FDF4" : isWrong ? "#FFF1F2" : isSelected ? "#EFF6FF" : "#FAFAFA",
                    color: isCorrect ? "#15803D" : isWrong ? "#B91C1C" : isSelected ? "#0369A1" : "#0F172A",
                    fontWeight: isSelected || isCorrect ? 700 : 500, fontSize: 14,
                    cursor: confirmed ? "default" : "pointer", fontFamily: "inherit", lineHeight: 1.5,
                    transition: "all 0.1s",
                  }}
                >
                  <span style={{ marginRight: 10, fontWeight: 800, color: isCorrect ? "#059669" : isWrong ? "#DC2626" : isSelected ? "#0369A1" : "#94A3B8" }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                  {isCorrect && <span style={{ marginLeft: 8 }}>✓</span>}
                  {isWrong   && <span style={{ marginLeft: 8 }}>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Confidence meter */}
          {!confirmed && selected !== null && (
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

          {/* Step solution */}
          {confirmed && showSteps && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginTop: 8, padding: "14px 16px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", letterSpacing: "0.08em", marginBottom: 6 }}>EXPLANATION</div>
                <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.65 }}>{current.explanation}</div>
                {CLASS2_WATER_FORMULA_LINKS[current.id] && (
                  <a
                    href={CLASS2_WATER_FORMULA_LINKS[current.id]}
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

        {/* AI Tutor */}
        {tutorOpen && confirmed && (
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
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => setReportModalOpen(true)}
            style={{ fontSize: 11, color: "#CBD5E1", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            Report an error with this question
          </button>
        </div>
      </div>

      {/* Quiz Gate (shown after 15 questions for non-unlocked users) */}
      {showGate && (
        <QuizGate
          questionsAnswered={history.length}
          productKey="class2-water"
          productName="Class 2 Water Treatment Practice Pass"
          priceLabel="CA$99"
          paidFeatures={[
            "Full 280+ question bank — unlimited attempts",
            "Class 2 Water Treatment Mock Exam (100 questions, 2-hour timer)",
            "AI Tutor explanations on every question",
            "Score history & module breakdown",
          ]}
          onUnlocked={() => {
            setTrialUnlocked();
            setTrialUnlockedState(true);
            setShowGate(false);
            const nextQ = getNextQ(history);
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
