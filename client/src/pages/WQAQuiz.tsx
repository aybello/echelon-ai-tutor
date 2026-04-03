// ECHELON AI TUTOR — WQA (Water Quality Analyst) Practice Quiz
// Certification: Ontario Water Quality Analyst (WQA)
// Based on O. Reg. 248/03, O. Reg. 170/03, and WQA Need-to-Know document
import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { WQA_QUESTIONS, WQA_MODULES, WQA_FORMULA_LINKS, type WQAQuestion, type WQAModule } from "@/lib/wqaQuestions";
import { type Question, type HistoryEntry, getNextQuestion, getPatternInsights } from "@/lib/questions";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AITutor from "@/components/AITutor";
import QuizGate, { isTrialUnlocked } from "@/components/QuizGate";
import { shuffle } from "@/lib/utils";

// ── Adapter: convert WQAQuestion → Question (for adaptive engine + AITutor) ──
let _wqaIdCounter = 90000;
const wqaIdMap = new Map<string, number>();
// Reverse map: numeric Question.id → original WQA string ID (for formula deep-links)
const wqaReverseMap = new Map<number, string>();
function toQuestion(q: WQAQuestion): Question {
  if (!wqaIdMap.has(q.id)) {
    wqaIdMap.set(q.id, _wqaIdCounter);
    wqaReverseMap.set(_wqaIdCounter, q.id);
    _wqaIdCounter++;
  }
  return {
    id: wqaIdMap.get(q.id)!,
    module: q.module,
    type: "conceptual",
    difficulty: q.difficulty,
    q: q.question,
    options: q.options,
    correct: q.correctIndex,
    explanation: q.explanation,
    tip: `Review the ${q.module} module for this concept.`,
  };
}

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Math":                               { bg: "#EDE9FE", color: "#6D28D9" },
  "Science":                            { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory & Sampling":              { bg: "#E0F2FE", color: "#0369A1" },
  "Safety":                             { bg: "#FEE2E2", color: "#B91C1C" },
  "Water Characteristics":              { bg: "#DCFCE7", color: "#15803D" },
  "Bacteriological Testing":            { bg: "#FEF9C3", color: "#A16207" },
  "Chemical Testing":                   { bg: "#FFEDD5", color: "#C2410C" },
  "Disinfection":                       { bg: "#CCFBF1", color: "#0F766E" },
  "Quality Assurance & Quality Control":{ bg: "#F0FDF4", color: "#166534" },
  "Regulation":                         { bg: "#F5F3FF", color: "#5B21B6" },
};
const MODULE_ICONS: Record<string, string> = {
  "Math":                               "📐",
  "Science":                            "🔬",
  "Laboratory & Sampling":              "🧪",
  "Safety":                             "⛑️",
  "Water Characteristics":              "💧",
  "Bacteriological Testing":            "🦠",
  "Chemical Testing":                   "⚗️",
  "Disinfection":                       "🧴",
  "Quality Assurance & Quality Control":"📊",
  "Regulation":                         "📋",
};
const DIFF_COLOR: Record<string, string> = { easy: "#059669", medium: "#D97706", hard: "#DC2626" };
const DIFF_BG:    Record<string, string> = { easy: "#DCFCE7", medium: "#FEF9C3", hard: "#FEE2E2" };
const SESSION_SIZE = 20;

export default function WQAQuiz() {
  usePageMeta({
    title: "WQA Practice Quiz — Water Quality Analyst",
    description: "300 practice questions for the Ontario Water Quality Analyst (WQA) certification exam. Covers math, science, sampling, safety, bacteriological testing, disinfection, QA/QC, and regulations across 10 modules.",
    path: "/wqa",
    keywords: "WQA exam, Water Quality Analyst Ontario, O. Reg. 248/03, drinking water sampling, bacteriological testing, QA QC water",
  });

  const [selectedModule, setSelectedModule] = useState<WQAModule | "All">("All");
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [showSteps, setShowSteps]   = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [patternMode, setPatternMode] = useState(false);
  const [shakeKey, setShakeKey]     = useState(0);
  const [adaptive, setAdaptive]     = useState<string | null>(null);
  const [trialUnlocked, setTrialUnlockedState] = useState<boolean>(() => isTrialUnlocked());
  const [showGate, setShowGate]     = useState(false);

  // Build active question pool
  const activePool = useMemo((): Question[] => {
    const filtered = selectedModule === "All"
      ? WQA_QUESTIONS
      : WQA_QUESTIONS.filter(q => q.module === selectedModule);
    return filtered.map(toQuestion);
  }, [selectedModule]);

  const [current, setCurrent] = useState<Question | null>(() => activePool[0] ?? null);

  const patterns = getPatternInsights(history);
  const allDone  = !current;
  const correctCount = history.filter(h => h.correct).length;
  const wrongCount   = history.filter(h => !h.correct).length;
  const progress     = (history.length / SESSION_SIZE) * 100;

  const moduleStyle = useMemo(() => {
    if (!current) return { bg: "#E0F2FE", color: "#0369A1" };
    return MODULE_COLORS[current.module] ?? { bg: "#E0F2FE", color: "#0369A1" };
  }, [current]);

  const handleSelect = useCallback((idx: number) => {
    if (confirmed) return;
    setSelected(idx);
  }, [confirmed]);

  const handleConfirm = useCallback(() => {
    if (selected === null || confidence === null || !current) return;
    const isCorrect = selected === current.correct;
    if (!isCorrect) setShakeKey(k => k + 1);
    const entry: HistoryEntry = {
      questionId: current.id,
      module: current.module,
      difficulty: current.difficulty,
      correct: isCorrect,
      confidence,
      selectedOption: selected,
      wrongExplanation: !isCorrect && current.wrongExp ? (current.wrongExp[selected] ?? null) : null,
    };
    const updatedHistory = [...history, entry];
    setHistory(updatedHistory);
    setConfirmed(true);
    setShowSteps(false);
    setAdaptive(null);
    if (!isCorrect && confidence >= 4) {
      setAdaptive("You were confident but got this wrong — let's review this module.");
    }
    // Fire gate immediately after 15th answer — avoids stale state in handleNext()
    if (updatedHistory.length >= 15 && !trialUnlocked) {
      setShowGate(true);
    }
  }, [selected, confidence, current, history, trialUnlocked]);

  const handleNext = useCallback(() => {
    const next = getNextQuestion(history, activePool);
    setCurrent(next);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setAdaptive(null);
  }, [history, activePool, trialUnlocked]);

  const handleModuleChange = useCallback((mod: WQAModule | "All") => {
    setSelectedModule(mod);
    setShowModuleSelector(false);
    setHistory([]);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setPatternMode(false);
    setAdaptive(null);
    const pool = mod === "All"
      ? WQA_QUESTIONS
      : WQA_QUESTIONS.filter(q => q.module === mod);
    setCurrent(pool.length > 0 ? toQuestion(pool[0]) : null);
  }, []);

  const handleRestart = useCallback(() => {
    const shuffled = shuffle(activePool.length > 0 ? activePool : []);
    setHistory([]);
    setSelected(null);
    setConfidence(null);
    setConfirmed(false);
    setShowSteps(false);
    setPatternMode(false);
    setAdaptive(null);
    setCurrent(shuffled[0] ?? null);
  }, [activePool]);

  const modLabel = selectedModule === "All" ? "All Modules" : selectedModule;
  const modStyle = selectedModule === "All"
    ? { bg: "#E0F2FE", color: "#0369A1" }
    : MODULE_COLORS[selectedModule] ?? { bg: "#E0F2FE", color: "#0369A1" };

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @keyframes popIn   { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
        .wqa-option-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .wqa-next-btn:hover { transform: translateY(-1px); }
        .wqa-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        @media (max-width: 640px) {
          .wqa-main { max-width: 100% !important; padding: 16px 14px 80px !important; }
          .wqa-q-card { padding: 20px 16px !important; }
          .wqa-meta-row { flex-wrap: wrap !important; gap: 6px !important; }
          .wqa-action-row { flex-wrap: wrap !important; gap: 8px !important; }
          .wqa-action-row .wqa-confidence { width: 100% !important; }
          .wqa-action-row .wqa-confirm-btn { width: 100% !important; padding: 12px 16px !important; }
          .wqa-q-text { font-size: 15px !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0369A1, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", boxShadow: "0 2px 8px rgba(3,105,161,0.3)", cursor: "pointer" }}>E</div>
            </Link>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "0.04em" }}>ECHELON INSTITUTE</div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>WQA — {WQA_QUESTIONS.length} Questions · {modLabel}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Module selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowModuleSelector(!showModuleSelector)}
                style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${modStyle.color}`, background: modStyle.bg, color: modStyle.color, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
              >
                🧪 {modLabel.length > 22 ? modLabel.slice(0, 20) + "…" : modLabel}
                <span style={{ fontSize: 8 }}>▼</span>
              </button>
              {showModuleSelector && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 260, padding: 8 }}>
                  <button
                    onClick={() => handleModuleChange("All")}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: selectedModule === "All" ? "#E0F2FE" : "transparent", color: "#0369A1", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left", fontFamily: "inherit", marginBottom: 4 }}
                  >
                    🎓 All Modules ({WQA_QUESTIONS.length})
                  </button>
                  {WQA_MODULES.map(mod => {
                    const count = WQA_QUESTIONS.filter(q => q.module === mod).length;
                    const ms = MODULE_COLORS[mod] ?? { bg: "#E0F2FE", color: "#0369A1" };
                    return (
                      <button
                        key={mod}
                        onClick={() => handleModuleChange(mod)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: selectedModule === mod ? ms.bg : "transparent", color: ms.color, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span>{MODULE_ICONS[mod]} {mod}</span>
                        <span style={{ fontSize: 10, opacity: 0.7 }}>{count}q</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Score */}
            <div style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 800, color: "#059669", fontSize: 13 }}>{correctCount}</span>
              <span style={{ color: "#CBD5E1" }}>/</span>
              <span style={{ fontWeight: 800, color: "#DC2626", fontSize: 13 }}>{wrongCount}</span>
              <span style={{ color: "#94A3B8", marginLeft: 2 }}>· {history.length} done</span>
            </div>
            {patterns && (
              <button onClick={() => { setPatternMode(true); setTutorOpen(true); }} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #F59E0B", background: "#FFFBEB", color: "#B45309", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ⚠️ Pattern Alert
              </button>
            )}
            <button onClick={() => setTutorOpen(true)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #0369A1", background: "#E0F2FE", color: "#0369A1", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              🤖 AI Tutor
            </button>
            <Link href="/wqa-mock">
              <button style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #6D28D9", background: "#EDE9FE", color: "#6D28D9", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📋 Mock Exam
              </button>
            </Link>
            <Link href="/formulas-wqa">
              <button style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #0F766E", background: "#CCFBF1", color: "#0F766E", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📐 Formulas
              </button>
            </Link>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#E2E8F0" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #0369A1, #0F766E)", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="wqa-main" style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* Freemium gate overlay */}
        {showGate && (
          <QuizGate
            questionsAnswered={history.length}
            onUnlocked={() => {
              setTrialUnlockedState(true);
              setShowGate(false);
              handleNext();
            }}
            onDismiss={() => {
              setShowGate(false);
              handleRestart();
            }}
          />
        )}

        {/* All done */}
        {allDone && !showGate && (
          <div style={{ textAlign: "center", padding: "60px 20px", animation: "popIn 0.4s ease" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Session Complete!</div>
            <div style={{ fontSize: 15, color: "#64748B", marginBottom: 24 }}>
              {correctCount} correct · {wrongCount} incorrect · {history.length} questions answered
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleRestart} style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg, #0369A1, #0F766E)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                🔄 New Session
              </button>
              <Link href="/wqa-mock">
                <button style={{ padding: "12px 24px", borderRadius: 12, background: "#EDE9FE", color: "#6D28D9", fontWeight: 700, fontSize: 14, border: "1px solid #C4B5FD", cursor: "pointer", fontFamily: "inherit" }}>
                  📋 Try Mock Exam
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Question card */}
        {current && !showGate && (
          <div className="wqa-q-card" style={{ background: "#fff", borderRadius: 20, padding: "28px 28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animation: "fadeUp 0.3s ease" }}>

            {/* Meta row */}
            <div className="wqa-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span className="wqa-chip" style={{ padding: "4px 10px", borderRadius: 20, background: moduleStyle.bg, color: moduleStyle.color, fontSize: 10, fontWeight: 700 }}>
                  {MODULE_ICONS[current.module] ?? "🔬"} {current.module}
                </span>
                <span style={{ padding: "4px 10px", borderRadius: 20, background: DIFF_BG[current.difficulty], color: DIFF_COLOR[current.difficulty], fontSize: 10, fontWeight: 700 }}>
                  {current.difficulty.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
                Q{history.length + 1} / {SESSION_SIZE}
              </div>
            </div>

            {/* Question text */}
            <div className="wqa-q-text" style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.6, marginBottom: 22 }}>
              {current.q}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }} key={shakeKey}>
              {current.options.map((opt, idx) => {
                let bg = "#F8FAFC", border = "#E2E8F0", color = "#334155";
                if (selected === idx && !confirmed) { bg = "#EFF6FF"; border = "#3B82F6"; color = "#1D4ED8"; }
                if (confirmed) {
                  if (idx === current.correct) { bg = "#DCFCE7"; border = "#22C55E"; color = "#15803D"; }
                  else if (idx === selected && selected !== current.correct) { bg = "#FEE2E2"; border = "#EF4444"; color = "#B91C1C"; }
                }
                return (
                  <button
                    key={idx}
                    className="wqa-option-btn"
                    onClick={() => handleSelect(idx)}
                    disabled={confirmed}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color, fontSize: 13, fontWeight: 600, textAlign: "left", cursor: confirmed ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.15s", lineHeight: 1.5 }}
                  >
                    <span style={{ fontWeight: 800, marginRight: 8, opacity: 0.5 }}>{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {confirmed && (
              <div style={{ padding: "14px 16px", borderRadius: 12, background: selected === current.correct ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${selected === current.correct ? "#BBF7D0" : "#FED7AA"}`, marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: selected === current.correct ? "#15803D" : "#C2410C", marginBottom: 6 }}>
                  {selected === current.correct ? "✅ Correct!" : "❌ Incorrect"}
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{current.explanation}</div>
                {/* Formula deep-link — shown when question involves a formula */}
                {(() => {
                  const wqaId = wqaReverseMap.get(current.id);
                  const formulaHref = wqaId ? WQA_FORMULA_LINKS[wqaId] : undefined;
                  if (!formulaHref) return null;
                  return (
                    <a
                      href={formulaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "7px 14px", borderRadius: 8, background: "#CCFBF1", border: "1px solid #99F6E4", color: "#0F766E", fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}
                    >
                      📐 View formula sheet ↗
                    </a>
                  );
                })()}
                {adaptive && (
                  <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 12, color: "#92400E" }}>
                    💡 {adaptive}
                  </div>
                )}
              </div>
            )}

            {/* Action row */}
            <div className="wqa-action-row" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {!confirmed ? (
                <>
                  <div className="wqa-confidence" style={{ flex: 1, minWidth: 200 }}>
                    <ConfidenceMeter value={confidence} onChange={setConfidence} />
                  </div>
                  <button
                    className="wqa-confirm-btn"
                    onClick={handleConfirm}
                    disabled={selected === null || confidence === null}
                    style={{ padding: "11px 22px", borderRadius: 12, background: selected !== null && confidence !== null ? "linear-gradient(135deg, #0369A1, #0F766E)" : "#E2E8F0", color: selected !== null && confidence !== null ? "#fff" : "#94A3B8", fontWeight: 700, fontSize: 13, border: "none", cursor: selected !== null && confidence !== null ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
                  >
                    Confirm →
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setTutorOpen(true)} style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #0369A1", background: "#E0F2FE", color: "#0369A1", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    🤖 Ask AI Tutor
                  </button>
                  <button
                    className="wqa-next-btn"
                    onClick={handleNext}
                    style={{ flex: 1, padding: "11px 22px", borderRadius: 12, background: "linear-gradient(135deg, #0369A1, #0F766E)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  >
                    Next Question →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Module overview cards */}
        {!allDone && !showGate && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", marginBottom: 12 }}>MODULES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {WQA_MODULES.map(mod => {
                const ms = MODULE_COLORS[mod] ?? { bg: "#E0F2FE", color: "#0369A1" };
                const count = WQA_QUESTIONS.filter(q => q.module === mod).length;
                const done = history.filter(h => h.module === mod).length;
                const correct = history.filter(h => h.module === mod && h.correct).length;
                return (
                  <button
                    key={mod}
                    onClick={() => handleModuleChange(mod)}
                    style={{ padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${selectedModule === mod ? ms.color : "#E5E7EB"}`, background: selectedModule === mod ? ms.bg : "#fff", color: ms.color, fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{MODULE_ICONS[mod]}</div>
                    <div style={{ lineHeight: 1.3, marginBottom: 4 }}>{mod}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{done > 0 ? `${correct}/${done} correct` : `${count} questions`}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Tutor panel */}
      {tutorOpen && (
        <AITutor
          question={current}
          userAnswer={selected}
          history={history}
          patternMode={patternMode}
          onClose={() => { setTutorOpen(false); setPatternMode(false); }}
        />
      )}
    </div>
  );
}
