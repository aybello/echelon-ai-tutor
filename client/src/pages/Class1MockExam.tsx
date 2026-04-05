// CLASS 1 MOCK EXAM
// 100 questions · 2-hour timer · 70% pass threshold · module breakdown
// Streams: Water (Treatment + Distribution) | Wastewater (Treatment + Collection)

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { CLASS1_QUESTIONS, getClass1Questions } from "@/lib/class1Questions";
import type { Question } from "@/lib/questions";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { isTrialUnlocked } from "@/components/QuizGate";
import { trpc } from "@/lib/trpc";
import ScoreHistory from "@/components/ScoreHistory";
import PurchaseGate from "@/components/PurchaseGate";
import ReportErrorModal from "@/components/ReportErrorModal";

const EXAM_DURATION = 2 * 60 * 60; // 2 hours in seconds
const EXAM_QUESTIONS = 100;
const PASS_THRESHOLD = 0.7; // 70%

type Stream = "water" | "wastewater";
type ExamState = "stream-select" | "intro" | "active" | "results";

interface ExamAnswer {
  questionIndex: number;
  selected: number | null;
}

const STREAM_CONFIG: Record<Stream, { label: string; icon: string; color: string; bg: string; modules: string[] }> = {
  water: {
    label: "Water Class 1",
    icon: "💧",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    modules: ["Water Treatment", "Water Distribution"],
  },
  wastewater: {
    label: "Wastewater Class 1",
    icon: "♻️",
    color: "#0F766E",
    bg: "#F0FDFA",
    modules: ["Wastewater Treatment", "Wastewater Collection"],
  },
};

function selectExamQuestions(stream: Stream): Question[] {
  const pool = getClass1Questions(stream);
  const modules = STREAM_CONFIG[stream].modules;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected: Question[] = [];

  // Proportional allocation: Water = 60 Treatment + 40 Distribution (from 100/60 pool)
  // Wastewater = 60 Treatment + 40 Collection (from 50/40 pool — use all available)
  const perModule = Math.floor(EXAM_QUESTIONS / modules.length);

  for (const mod of modules) {
    const modQs = shuffled.filter(q => q.module === mod).slice(0, perModule);
    selected.push(...modQs);
  }

  // Fill remaining slots if any module was short
  const remaining = shuffled.filter(q => !selected.includes(q));
  while (selected.length < EXAM_QUESTIONS && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }

  return selected.slice(0, EXAM_QUESTIONS).sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Class1MockExam() {
  usePageMeta({
    title: "Class 1 Timed Mock Exam — Water & Wastewater",
    description: "100-question timed mock exam for Ontario Class 1 Water and Wastewater operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results.",
    path: "/class1-mock",
    keywords: "Class 1 mock exam, Ontario water operator exam, wastewater operator practice test, EOCP Class 1, OWWCO exam prep",
  });
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  const initialStream = useMemo<Stream | null>(() => {
    const s = params.get("stream");
    if (s === "water" || s === "wastewater") return s;
    return null;
  }, [params]);

  // Persistent anonymous session ID for score history
  const [sessionId] = useState<string>(() => {
    const key = "echelon_session_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(key, id);
    }
    return id;
  });
  const saveResult = trpc.exam.saveResult.useMutation();
  const resultSavedRef = useRef(false);
  const [examState, setExamState] = useState<ExamState>(
    initialStream ? "intro" : "stream-select"
  );
  const [stream, setStream] = useState<Stream>(initialStream ?? "water");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unlocked = isTrialUnlocked();

  const startExam = useCallback((examStream?: Stream) => {
    const activeStream = examStream ?? stream;
    const qs = selectExamQuestions(activeStream);
    setStream(activeStream);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setTimeLeft(EXAM_DURATION);
    setFlagged([]);
    setShowReview(false);
    setExamState("active");
  }, [stream]);

  // Timer
  useEffect(() => {
    if (examState !== "active") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setExamState("results");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState]);

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamState("results");
    resultSavedRef.current = false; // reset so the effect can save
  }, []);

  const selectAnswer = useCallback((optionIdx: number) => {
    setAnswers(prev => prev.map((a, i) =>
      i === currentIdx ? { ...a, selected: optionIdx } : a
    ));
  }, [currentIdx]);

  const toggleFlag = useCallback(() => {
    setFlagged(prev =>
      prev.includes(currentIdx)
        ? prev.filter(i => i !== currentIdx)
        : [...prev, currentIdx]
    );
  }, [currentIdx]);

  const cfg = STREAM_CONFIG[stream];

  // -- STREAM SELECTOR --
  if (examState === "stream-select") {
    return (
      <PurchaseGate examType="class1-water" productKey="class1-water" productName="Class 1 Water Treatment Practice Pass" price={79}>
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/class1-mock" />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Class 1 Mock Exam</h1>
            <p style={{ color: "#64748B", fontSize: 16, lineHeight: 1.6 }}>
              100 questions · 2-hour timer · 70% to pass<br />
              Simulates the real EOCP/OWWCO Class 1 certification exam
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {(["water", "wastewater"] as Stream[]).map(s => {
              const c = STREAM_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setStream(s); setExamState("intro"); /* stream stored for intro screen */ }}
                  style={{
                    padding: "32px 24px",
                    borderRadius: 20,
                    border: `2px solid ${c.color}`,
                    background: "#fff",
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = c.bg; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c.color, marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{c.modules.join(" + ")}</div>
                </button>
              );
            })}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href={`/class1?stream=${stream}`}>
              <button style={{ padding: "10px 24px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ← Back to Practice Mode
              </button>
            </Link>
          </div>
        </div>
      </div>
      </PurchaseGate>
    );
  }

  // -- INTRO --
  if (examState === "intro") {
    const waterCount = getClass1Questions("water").length;
    const wwCount = getClass1Questions("wastewater").length;
    const poolCount = stream === "water" ? waterCount : wwCount;

    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/class1-mock" />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 80px" }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${cfg.color}, #0F766E)`, borderRadius: 24, padding: "36px 40px", color: "#fff", marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{cfg.icon}</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{cfg.label} Mock Exam</h1>
            <p style={{ opacity: 0.9, fontSize: 15, lineHeight: 1.6 }}>
              Simulates the real EOCP/OWWCO Class 1 certification exam format
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { icon: "❓", label: "Questions", value: "100" },
              { icon: "⏱", label: "Time Limit", value: "2 Hours" },
              { icon: "🎯", label: "Pass Mark", value: "70%" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Modules covered */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>📚 Modules Covered</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {cfg.modules.map(mod => (
                <span key={mod} style={{ padding: "6px 14px", borderRadius: 100, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700 }}>{mod}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>
              Drawing from {poolCount} questions in the {cfg.label} bank
            </div>
          </div>

          {/* Instructions */}
          <div style={{ background: "#FFFBEB", borderRadius: 16, padding: "20px 24px", marginBottom: 28, border: "1px solid #FDE68A" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>📌 Exam Instructions</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#78350F", fontSize: 13, lineHeight: 2 }}>
              <li>You can navigate between questions freely using the question grid</li>
              <li>Flag questions to review them before submitting</li>
              <li>The timer runs continuously — it will auto-submit when it reaches 0:00</li>
              <li>You can submit early once you've answered all questions</li>
              <li>Results show a full module-by-module breakdown with explanations</li>
            </ul>
          </div>

          {/* Freemium gate notice if not unlocked */}
          {!unlocked && (
            <div style={{ background: "#EFF6FF", borderRadius: 16, padding: "16px 20px", marginBottom: 20, border: "1px solid #BFDBFE", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>
                🔓 Complete 15 practice questions first to unlock the full exam bank
              </div>
              <Link href={`/class1?stream=${stream}`}>
                <button style={{ marginTop: 10, padding: "8px 20px", borderRadius: 20, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Go to Practice Mode →
                </button>
              </Link>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setExamState("stream-select")}
              style={{ padding: "12px 28px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Change Stream
            </button>
            <button
              onClick={() => startExam(stream)}
              disabled={!unlocked}
              style={{
                padding: "14px 48px",
                borderRadius: 20,
                border: "none",
                background: unlocked ? `linear-gradient(135deg, ${cfg.color}, #0F766E)` : "#CBD5E1",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: unlocked ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                boxShadow: unlocked ? `0 4px 20px ${cfg.color}40` : "none",
              }}
            >
              Start Exam →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- RESULTS --
  if (examState === "results") {
    const correctCount = answers.filter((a, i) => a.selected === questions[i]?.correct).length;
    const score = correctCount / EXAM_QUESTIONS;
    const passed = score >= PASS_THRESHOLD;
    const timeUsed = EXAM_DURATION - timeLeft;

    const moduleBreakdown = questions.reduce<Record<string, { correct: number; total: number }>>(
      (acc, q, i) => {
        const mod = q.module;
        if (!acc[mod]) acc[mod] = { correct: 0, total: 0 };
        acc[mod].total++;
        if (answers[i]?.selected === q.correct) acc[mod].correct++;
        return acc;
      },
      {}
    );

    const sortedModules = Object.entries(moduleBreakdown).sort(([, a], [, b]) => {
      const pctA = a.correct / a.total;
      const pctB = b.correct / b.total;
      return pctA - pctB; // weakest first
    });

    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <SiteNav currentPath="/class1-mock" />
        <style>{`
          @media (max-width: 600px) {
            .c1mock-results { padding: 20px 14px 60px !important; }
            .c1mock-stats { grid-template-columns: 1fr 1fr !important; }
            .c1mock-score-hero { padding: 28px 20px !important; }
          }
        `}</style>
        <div className="c1mock-results" style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
          {/* Action bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            <button onClick={() => startExam(stream)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: cfg.color, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🔄 Retake Exam</button>
            <button onClick={() => setExamState("stream-select")} style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🔀 Change Stream</button>
            <Link href={`/class1?stream=${stream}`}><button style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🎯 Practice Mode</button></Link>
          </div>

          {/* Score hero */}
          <div className="c1mock-score-hero" style={{ background: passed ? "linear-gradient(135deg, #059669, #0F766E)" : "linear-gradient(135deg, #DC2626, #B91C1C)", borderRadius: 24, padding: "40px", textAlign: "center", marginBottom: 24, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? "🏆" : "📚"}</div>
            <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 4 }}>{Math.round(score * 100)}%</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, opacity: 0.95 }}>
              {passed ? "PASS — Well done!" : "NOT YET — Keep studying!"}
            </div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {correctCount} correct out of {EXAM_QUESTIONS} questions · Pass mark: 70% ({Math.round(EXAM_QUESTIONS * 0.7)}/{EXAM_QUESTIONS})
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              {cfg.icon} {cfg.label} · Time used: {formatTime(timeUsed)}
            </div>
          </div>

          {/* Stats grid */}
          <div className="c1mock-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Correct", value: correctCount, color: "#059669", bg: "#F0FDF4" },
              { label: "Incorrect", value: EXAM_QUESTIONS - correctCount - answers.filter(a => a.selected === null).length, color: "#DC2626", bg: "#FEF2F2" },
              { label: "Skipped", value: answers.filter(a => a.selected === null).length, color: "#D97706", bg: "#FFFBEB" },
              { label: "Flagged", value: flagged.length, color: "#7C3AED", bg: "#F5F3FF" },
            ].map(stat => (
              <div key={stat.label} style={{ background: stat.bg, borderRadius: 16, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Module breakdown */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>📊 Module Breakdown</div>
            {sortedModules.map(([mod, { correct, total }]) => {
              const pct = correct / total;
              const barColor = pct >= 0.7 ? "#059669" : pct >= 0.5 ? "#D97706" : "#DC2626";
              return (
                <div key={mod} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{mod}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{correct}/{total} ({Math.round(pct * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 100 }}>
                    <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 100, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score history */}
          <ScoreHistory sessionId={sessionId} examType="class1" stream={stream} />

          {/* Question review toggle */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <button
              onClick={() => setShowReview(!showReview)}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "#F8FAFC", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {showReview ? "▲ Hide Question Review" : "▼ Show All Questions & Explanations"}
            </button>
            {showReview && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {questions.map((q, i) => {
                  const userAns = answers[i]?.selected ?? null;
                  const isCorrect = userAns === q.correct;
                  return (
                    <div key={q.id} style={{ borderRadius: 12, border: `1.5px solid ${isCorrect ? "#22C55E" : "#EF4444"}`, padding: "16px", background: isCorrect ? "#F0FDF4" : "#FEF2F2" }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16 }}>{isCorrect ? "✓" : "✗"}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>Q{i + 1} · {q.module} · {q.difficulty}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.5 }}>{q.q}</div>
                        </div>
                      </div>
                      {!isCorrect && userAns !== null && (
                        <div style={{ fontSize: 11, color: "#DC2626", marginBottom: 4 }}>Your answer: {q.options[userAns]}</div>
                      )}
                      {userAns === null && (
                        <div style={{ fontSize: 11, color: "#DC2626", marginBottom: 4 }}>Not answered</div>
                      )}
                      <div style={{ fontSize: 11, color: "#15803D", fontWeight: 600, marginBottom: 6 }}>
                        Correct: {q.options[q.correct]}
                      </div>
                      <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6, background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px 10px" }}>
                        <span style={{ whiteSpace: "pre-line" }}>{q.explanation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -- ACTIVE EXAM --
  const currentQ = questions[currentIdx];
  const currentAnswer = answers[currentIdx]?.selected ?? null;
  const isFlagged = flagged.includes(currentIdx);
  const answeredCount = answers.filter(a => a.selected !== null).length;
  const unansweredCount = EXAM_QUESTIONS - answeredCount;
  const timerWarning = timeLeft < 600; // last 10 minutes

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .opt-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
        @media (max-width: 600px) {
          .c1mock-exam-header { padding: 10px 14px !important; flex-wrap: wrap; gap: 8px !important; }
          .c1mock-header-right { gap: 8px !important; }
          .c1mock-timer { font-size: 13px !important; padding: 6px 12px !important; }
          .c1mock-submit-btn { font-size: 10px !important; padding: 6px 12px !important; }
          .c1mock-nav-grid { gap: 4px !important; }
          .c1mock-nav-btn { width: 28px !important; height: 28px !important; font-size: 10px !important; }
        }
      `}</style>

      {/* Sticky exam header */}
      <div className="c1mock-exam-header" style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${cfg.color}, #0F766E)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>E</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0F172A" }}>{cfg.label.toUpperCase()} MOCK EXAM</div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>Question {currentIdx + 1} of {EXAM_QUESTIONS}</div>
          </div>
        </div>
        <div className="c1mock-header-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 11, color: "#64748B" }}>
            <span style={{ fontWeight: 700, color: "#059669" }}>{answeredCount}</span> answered · <span style={{ fontWeight: 700, color: "#DC2626" }}>{unansweredCount}</span> remaining
          </div>
          <div className="c1mock-timer" style={{
            padding: "8px 16px",
            borderRadius: 20,
            background: timerWarning ? "#FEF2F2" : "#F0FDF4",
            border: `2px solid ${timerWarning ? "#EF4444" : "#22C55E"}`,
            fontSize: 15,
            fontWeight: 800,
            color: timerWarning ? "#DC2626" : "#15803D",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <button
            className="c1mock-submit-btn"
            onClick={submitExam}
            style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: cfg.color, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#E2E8F0" }}>
        <div style={{ height: "100%", width: `${((currentIdx + 1) / EXAM_QUESTIONS) * 100}%`, background: `linear-gradient(90deg, ${cfg.color}, #0F766E)`, transition: "width 0.3s ease" }} />
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Question navigator */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 10 }}>QUESTION NAVIGATOR</div>
          <div className="c1mock-nav-grid" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {questions.map((_, i) => {
              const ans = answers[i]?.selected;
              const isCurr = i === currentIdx;
              const isAnswered = ans !== null;
              const isFlaggedQ = flagged.includes(i);
              return (
                <button
                  key={i}
                  className="c1mock-nav-btn"
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: isCurr ? `2px solid ${cfg.color}` : "1px solid #E2E8F0",
                    background: isFlaggedQ ? "#FEF9C3" : isCurr ? cfg.bg : isAnswered ? "#DCFCE7" : "#F8FAFC",
                    color: isCurr ? cfg.color : isAnswered ? "#15803D" : "#94A3B8",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {isFlaggedQ ? "🚩" : i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { color: "#DCFCE7", border: "#E2E8F0", label: "Answered" },
              { color: "#F8FAFC", border: "#E2E8F0", label: "Unanswered" },
              { color: "#FEF9C3", border: "#E2E8F0", label: "Flagged" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1px solid ${l.border}` }} />
                <span style={{ fontSize: 10, color: "#94A3B8" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", animation: "fadeUp 0.2s ease" }}>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ padding: "4px 10px", borderRadius: 100, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{currentQ.module}</span>
            <span style={{
              padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
              background: currentQ.difficulty === "easy" ? "#DCFCE7" : currentQ.difficulty === "medium" ? "#FEF9C3" : "#FEE2E2",
              color: currentQ.difficulty === "easy" ? "#15803D" : currentQ.difficulty === "medium" ? "#A16207" : "#B91C1C",
            }}>{currentQ.difficulty}</span>
            <span style={{ padding: "4px 10px", borderRadius: 100, background: "#F1F5F9", color: "#64748B", fontSize: 11, fontWeight: 600 }}>Q{currentIdx + 1}/{EXAM_QUESTIONS}</span>
            <button
              onClick={toggleFlag}
              style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 100, border: `1px solid ${isFlagged ? "#D97706" : "#E5E7EB"}`, background: isFlagged ? "#FFFBEB" : "transparent", color: isFlagged ? "#D97706" : "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {isFlagged ? "🚩 Flagged" : "🏳 Flag"}
            </button>
          </div>

          {/* Question text */}
          <div style={{ fontSize: 17, fontWeight: 600, color: "#0F172A", lineHeight: 1.65, marginBottom: 24 }}>
            {currentQ.q}
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = currentAnswer === i;
              return (
                <button
                  key={i}
                  className="opt-btn"
                  onClick={() => selectAnswer(i)}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: isSelected ? `2px solid ${cfg.color}` : "1.5px solid #E5E7EB",
                    background: isSelected ? cfg.bg : "#FAFAFA",
                    color: isSelected ? cfg.color : "#374151",
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: isSelected ? `2px solid ${cfg.color}` : "1.5px solid #CBD5E1",
                    background: isSelected ? cfg.color : "#fff",
                    color: isSelected ? "#fff" : "#94A3B8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              style={{ padding: "10px 24px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: currentIdx === 0 ? "#CBD5E1" : "#374151", fontSize: 13, fontWeight: 600, cursor: currentIdx === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              {currentAnswer !== null ? "✓ Answered" : "Not answered"}
            </span>
            {currentIdx < EXAM_QUESTIONS - 1 ? (
              <button
                onClick={() => setCurrentIdx(Math.min(EXAM_QUESTIONS - 1, currentIdx + 1))}
                style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: cfg.color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submitExam}
                style={{ padding: "10px 24px", borderRadius: 20, border: "none", background: "linear-gradient(135deg, #059669, #0F766E)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Submit Exam ✓
              </button>
            )}
          </div>
        </div>
      </div>
      {reportModal && (
        <ReportErrorModal
          questionId={reportModal.id}
          questionText={reportModal.text}
          module={reportModal.module}
          onClose={() => setReportModal(null)}
        />
      )}
    </div>

  );
}
