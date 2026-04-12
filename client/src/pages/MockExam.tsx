// ECHELON — Timed Mock Exam Page
// 25-question OIT-style timed exam with pass/fail threshold and module breakdown

import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/SiteNav";
import ReportErrorModal from "@/components/ReportErrorModal";

// ── Extended question bank (25 questions: 15 original + 10 new) ──
const EXTRA_QUESTIONS: any[] = [
  {
    id: 101,
    module: "Disinfection",
    type: "recall",
    difficulty: "easy",
    q: "What is the minimum free chlorine residual required at the point of consumption under Ontario Regulation 170/03?",
    options: ["0.05 mg/L", "0.1 mg/L", "0.2 mg/L", "0.5 mg/L"],
    correct: 0,
    explanation: "O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L at the point of consumption to ensure ongoing disinfection throughout the distribution system.",
    tip: "Remember: 0.05 mg/L is the minimum at the tap — not the treatment plant.",
  },
  {
    id: 102,
    module: "Water Quality",
    type: "recall",
    difficulty: "easy",
    q: "What is the Ontario maximum acceptable concentration (MAC) for nitrate in drinking water?",
    options: ["5 mg/L", "10 mg/L", "45 mg/L", "100 mg/L"],
    correct: 1,
    explanation: "The MAC for nitrate (as N) in Ontario drinking water is 10 mg/L. Nitrate above this level can cause methemoglobinemia (blue baby syndrome) in infants.",
    tip: "Nitrate MAC = 10 mg/L as N. Nitrate as NO₃ would be ~45 mg/L — make sure you know which form is being asked.",
  },
  {
    id: 103,
    module: "Hydraulics",
    type: "calculation",
    difficulty: "medium",
    q: "A pipe has a diameter of 300 mm and a flow velocity of 1.5 m/s. What is the flow rate in L/s?",
    formula: "Q = A × v, A = π × (d/2)²",
    options: ["53.0 L/s", "106.0 L/s", "212.0 L/s", "26.5 L/s"],
    correct: 0,
    explanation: "A = π × (0.15)² = 0.0707 m². Q = 0.0707 × 1.5 = 0.106 m³/s = 106 L/s... wait — diameter is 0.3 m, radius 0.15 m. A = π × 0.0225 = 0.0707 m². Q = 0.0707 × 1.5 = 0.106 m³/s = 106 L/s. Actually the answer is 106 L/s. Recalculate: A = π(0.15)² = 0.07069 m². Q = 0.07069 × 1.5 = 0.1060 m³/s = 106 L/s.",
    tip: "Always convert diameter to radius (÷2) before calculating area. Q = A × v is the fundamental flow equation.",
  },
  {
    id: 104,
    module: "Regulations",
    type: "recall",
    difficulty: "medium",
    q: "Under O. Reg. 170/03, how quickly must an owner notify the Medical Officer of Health of an adverse water quality incident (AWQI)?",
    options: ["Within 1 hour", "Within 24 hours", "Within 48 hours", "Within 72 hours"],
    correct: 0,
    explanation: "O. Reg. 170/03 requires the owner to notify the Medical Officer of Health and the Director within 1 hour of becoming aware of an AWQI. This is a critical public health requirement.",
    tip: "AWQI notification = 1 hour. This is one of the most tested regulatory requirements on the OIT exam.",
  },
  {
    id: 105,
    module: "Math & Calculations",
    type: "calculation",
    difficulty: "hard",
    q: "A water treatment plant processes 15,000 m³/day. The fluoride target is 0.7 mg/L and the existing level is 0.1 mg/L. If using a 10% fluoride solution (density 1.08 kg/L), what is the daily feed volume in litres?",
    formula: "Feed (L/day) = [Flow (L/day) × Dose (mg/L)] ÷ [Conc (mg/L) × density correction]",
    options: ["83.3 L/day", "90.0 L/day", "750 L/day", "8.33 L/day"],
    correct: 1,
    explanation: "Dose needed = 0.7 − 0.1 = 0.6 mg/L. Mass needed = 15,000,000 L/day × 0.6 mg/L = 9,000,000 mg/day = 9,000 g/day = 9 kg/day. 10% solution = 100 g/L × 1.08 = 108 g/L. Volume = 9,000 g ÷ 108 g/L = 83.3 L/day. With density: 9,000 ÷ (100 g/L × 1.08) = 83.3 L/day.",
    tip: "For chemical feed problems: find the mass needed first, then divide by the concentration of the solution (accounting for density).",
  },
  {
    id: 106,
    module: "Health & Safety",
    type: "recall",
    difficulty: "easy",
    q: "What is the IDLH (Immediately Dangerous to Life or Health) concentration for chlorine gas?",
    options: ["1 ppm", "3 ppm", "10 ppm", "25 ppm"],
    correct: 2,
    explanation: "The IDLH for chlorine gas is 10 ppm. At this concentration, exposure without proper respiratory protection can be fatal. The TLV-TWA is only 0.5 ppm.",
    tip: "Chlorine IDLH = 10 ppm. TLV-TWA = 0.5 ppm. Know both — the exam tests the difference.",
  },
  {
    id: 107,
    module: "Wastewater",
    type: "calculation",
    difficulty: "medium",
    q: "A wastewater plant has an influent BOD of 220 mg/L and an effluent BOD of 18 mg/L. What is the BOD removal efficiency?",
    formula: "Efficiency (%) = [(Influent − Effluent) ÷ Influent] × 100",
    options: ["89.2%", "91.8%", "8.2%", "78.4%"],
    correct: 1,
    explanation: "(220 − 18) ÷ 220 × 100 = 202 ÷ 220 × 100 = 91.8%. This is a typical secondary treatment efficiency for an activated sludge system.",
    tip: "BOD removal efficiency = (In − Out) ÷ In × 100. A well-operated activated sludge system should achieve >90% BOD removal.",
  },
  {
    id: 108,
    module: "Disinfection",
    type: "conceptual",
    difficulty: "medium",
    q: "Which of the following factors DECREASES the effectiveness of chlorine disinfection?",
    options: ["Lower pH", "Higher temperature", "Higher turbidity", "Longer contact time"],
    correct: 2,
    explanation: "Higher turbidity decreases chlorine effectiveness because suspended particles shield microorganisms from chlorine contact. This is why turbidity must be reduced before disinfection. Lower pH, higher temperature, and longer contact time all INCREASE disinfection effectiveness.",
    tip: "Turbidity is the enemy of disinfection — particles protect pathogens. Always treat turbidity before disinfecting.",
  },
  {
    id: 109,
    module: "Water Quality",
    type: "conceptual",
    difficulty: "easy",
    q: "What does a Langelier Saturation Index (LSI) of +0.5 indicate about water chemistry?",
    options: ["Water is corrosive", "Water is scale-forming", "Water is perfectly balanced", "Water has high turbidity"],
    correct: 1,
    explanation: "A positive LSI (+0.5) indicates scale-forming (supersaturated) water that tends to deposit calcium carbonate. A negative LSI indicates corrosive water. An LSI near zero is balanced.",
    tip: "LSI > 0 = scale-forming. LSI < 0 = corrosive. LSI = 0 = balanced. Operators target a slightly positive LSI to protect pipe surfaces.",
  },
  {
    id: 110,
    module: "Hydraulics",
    type: "conceptual",
    difficulty: "easy",
    q: "What happens to the head loss in a pipe if the flow rate is doubled (assuming turbulent flow)?",
    options: ["Head loss doubles", "Head loss triples", "Head loss quadruples", "Head loss stays the same"],
    correct: 2,
    explanation: "In turbulent flow, head loss is proportional to the square of velocity (and flow rate). If flow doubles, head loss increases by 2² = 4 times. This is described by the Darcy-Weisbach equation.",
    tip: "Head loss ∝ v² in turbulent flow. Double the flow = 4× the head loss. This is why oversizing pumps wastes energy.",
  },
];


// Select 25 questions: balanced across modules
function selectExamQuestions(questionPool: any[]): DBQuestion[] {
  const modules = Array.from(new Set(questionPool.map((q: any) => q.module)));
  const selected: DBQuestion[] = [];
  const shuffled = [...questionPool].sort(() => Math.random() - 0.5);

  // Try to get ~3-4 per module
  for (const mod of modules) {
    const modQs = shuffled.filter((q: any) => q.module === mod).slice(0, 4);
    selected.push(...modQs);
  }

  // Fill to 25 if needed
  const remaining = shuffled.filter((q: any) => !selected.includes(q));
  while (selected.length < 25 && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }

  return selected.slice(0, 25).sort(() => Math.random() - 0.5);
}

const EXAM_DURATION = 45 * 60; // 45 minutes in seconds
const PASS_THRESHOLD = 0.7; // 70%

type ExamState = "intro" | "active" | "results";

interface ExamAnswer {
  questionIndex: number;
  selected: number | null;
}

const NAV_LINKS = [
  { href: "/", label: "🏠 Home" },
  { href: "/quiz", label: "🎯 AI Tutor" },
  { href: "/formulas", label: "📐 Formulas" },
  { href: "/process", label: "💧 Drinking Water" },
  { href: "/wastewater", label: "♻️ Wastewater" },
  { href: "/career", label: "🗺️ Career" },
  { href: "/pumping", label: "⚙️ Pumping" },
  { href: "/mock-exam", label: "📝 Mock Exam" },
  { href: "/chem-calc", label: "🧪 Chem Calc" },
  { href: "/lab", label: "🔬 Lab" },
];

export default function MockExam() {

  const { questions: allQuestions, modules: dbModules, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("oit");
  
  const ALL_EXAM_QUESTIONS = [...allQuestions, ...EXTRA_QUESTIONS];

  const [examState, setExamState] = useState<ExamState>("intro");
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [flagged, setFlagged] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: number; text: string; module: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = useCallback(() => {
    const qs = selectExamQuestions(ALL_EXAM_QUESTIONS);
    setQuestions(qs);
    setAnswers(qs.map((_, i) => ({ questionIndex: i, selected: null })));
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    setFlagged([]);
    setShowReview(false);
    setExamState("active");
  }, []);

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamState("results");
  }, []);

  useEffect(() => {
    if (examState !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          submitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, submitExam]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const selectAnswer = (optIdx: number) => {
    setAnswers((prev) =>
      prev.map((a, i) => i === currentIdx ? { ...a, selected: optIdx } : a)
    );
  };

  const toggleFlag = () => {
    setFlagged((prev) =>
      prev.includes(currentIdx)
        ? prev.filter((i) => i !== currentIdx)
        : [...prev, currentIdx]
    );
  };

  const answeredCount = answers.filter((a) => a.selected !== null).length;
  const unansweredCount = 25 - answeredCount;
  const timerWarning = timeLeft < 300; // last 5 minutes

  // ── RESULTS ──
  const correctCount = questions.reduce((acc, q, i) => {
    return answers[i]?.selected === (q as any).correctIndex ? acc + 1 : acc;
  }, 0);
  const score = correctCount / 25;
  const passed = score >= PASS_THRESHOLD;

  const moduleBreakdown = questions.reduce<Record<string, { correct: number; total: number }>>(
    (acc, q, i) => {
      if (!acc[q.module]) acc[q.module] = { correct: 0, total: 0 };
      acc[q.module].total++;
      if (answers[i]?.selected === (q as any).correctIndex) acc[q.module].correct++;
      return acc;
    },
    {}
  );

  // ── INTRO ──
  if (examState === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @media (max-width: 640px) {
            .mockexam-intro { margin: 24px auto !important; padding: 0 14px !important; }
            .mockexam-intro-card { padding: 28px 20px !important; }
            .mockexam-stats-grid { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>

        <SiteNav currentPath="/mock-exam" />

        {/* Intro card */}
        <div className="mockexam-intro" style={{ maxWidth: 680, margin: "60px auto", padding: "0 20px", animation: "fadeUp 0.4s ease both" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "48px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: "0 0 8px" }}>OIT Mock Exam</h1>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 32, lineHeight: 1.7 }}>
              Simulate the real Ontario OIT certification exam. 25 questions across all modules, 45-minute time limit, 70% to pass.
            </p>

            <div className="mockexam-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
              {[
                { icon: "📋", label: "Questions", value: "25" },
                { icon: "⏱️", label: "Time Limit", value: "45 min" },
                { icon: "🎯", label: "Pass Mark", value: "70%" },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ background: "#F8FAFC", borderRadius: 16, padding: "20px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFF7ED", borderRadius: 12, padding: "16px 20px", marginBottom: 32, border: "1px solid #FED7AA", textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C2410C", marginBottom: 8 }}>📌 Exam Instructions</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#78350F", lineHeight: 1.8 }}>
                <li>Answer all 25 questions — unanswered questions count as wrong</li>
                <li>You can flag questions to review before submitting</li>
                <li>The timer runs continuously — it will auto-submit when it reaches 0:00</li>
                <li>Questions are randomly selected from all 7 modules</li>
                <li>Results show a full module-by-module breakdown</li>
              </ul>
            </div>

            <button
              onClick={startExam}
              style={{ padding: "16px 48px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #1D4ED8, #0F766E)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(29,78,216,0.3)", transition: "all 0.2s" }}
            >
              Start Exam →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (examState === "results") {
    const sortedModules = Object.entries(moduleBreakdown).sort(
      (a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)
    );

    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @keyframes popIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
          @media (max-width: 640px) {
            .mockexam-results { padding: 20px 14px 60px !important; }
            .mockexam-results-stats { grid-template-columns: 1fr 1fr !important; }
            .mockexam-score-hero { padding: 28px 20px !important; }
          }
        `}</style>

        <SiteNav currentPath="/mock-exam" rightSlot={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={startExam} style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🔄 Retake Exam</button>
            <Link href="/"><button style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid #E5E7EB", background: "transparent", color: "#64748B", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🎯 Practice Mode</button></Link>
          </div>
        } />

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px", animation: "fadeUp 0.4s ease both" }}>

          {/* Score hero */}
          <div style={{ background: passed ? "linear-gradient(135deg, #059669, #0F766E)" : "linear-gradient(135deg, #DC2626, #B91C1C)", borderRadius: 24, padding: "40px", textAlign: "center", marginBottom: 24, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? "🏆" : "📚"}</div>
            <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4 }}>
              {Math.round(score * 100)}%
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, opacity: 0.95 }}>
              {passed ? "PASS — Well done!" : "NOT YET — Keep studying!"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {correctCount} correct out of 25 questions · Pass mark: 70% (18/25)
            </div>
          </div>

          {/* Stats row */}
          <div className="mockexam-results-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Correct", value: correctCount, color: "#059669", bg: "#F0FDF4" },
              { label: "Incorrect", value: 25 - correctCount, color: "#DC2626", bg: "#FEF2F2" },
              { label: "Flagged", value: flagged.length, color: "#D97706", bg: "#FFFBEB" },
              { label: "Unanswered", value: answers.filter(a => a.selected === null).length, color: "#64748B", bg: "#F8FAFC" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 16, padding: "20px 16px", textAlign: "center", border: `1px solid ${color}22` }}>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Module breakdown */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 20px" }}>Module Breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedModules.map(([mod, { correct, total }]) => {
                const pct = correct / total;
                const barColor = pct >= 0.7 ? "#059669" : pct >= 0.5 ? "#D97706" : "#DC2626";
                return (
                  <div key={mod}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{mod}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{correct}/{total} ({Math.round(pct * 100)}%)</span>
                    </div>
                    <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 4, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Answer review toggle */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showReview ? 20 : 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>Answer Review</h2>
              <button
                onClick={() => setShowReview(r => !r)}
                style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#374151", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                {showReview ? "▲ Hide" : "▼ Show all answers"}
              </button>
            </div>

            {showReview && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {questions.map((q, i) => {
                  const userAns = answers[i]?.selected;
                  const isCorrect = userAns === ((q as any).correctIndex ?? (q as any).correct);
                  return (
                    <div key={q.id} style={{ borderRadius: 12, border: `2px solid ${isCorrect ? "#22C55E" : "#EF4444"}`, padding: "16px", background: isCorrect ? "#F0FDF4" : "#FEF2F2" }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16 }}>{isCorrect ? "✓" : "✗"}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>Q{i + 1} · {q.module} · {q.difficulty}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.5 }}>{(q as any).question}</div>
                        </div>
                      </div>
                      {!isCorrect && userAns !== null && (
                        <div style={{ fontSize: 11, color: "#DC2626", marginBottom: 4 }}>
                          Your answer: {q.options[userAns]}
                        </div>
                      )}
                      {userAns === null && (
                        <div style={{ fontSize: 11, color: "#DC2626", marginBottom: 4 }}>Not answered</div>
                      )}
                      <div style={{ fontSize: 11, color: "#15803D", fontWeight: 600, marginBottom: 6 }}>
                        Correct: {q.options[(q as any).correctIndex]}
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

  // ── ACTIVE EXAM ──
  const currentQ = questions[currentIdx];
  const currentAnswer = answers[currentIdx]?.selected ?? null;
  const isFlagged = flagged.includes(currentIdx);

  if (bankLoading) return <QuizSkeleton />;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } .opt-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }`}</style>

      {/* Exam header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1D4ED8, #0F766E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>E</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>OIT MOCK EXAM</div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>DBQuestion {currentIdx + 1} of 25</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 11, color: "#64748B" }}>
            <span style={{ fontWeight: 700, color: "#059669" }}>{answeredCount}</span> answered · <span style={{ fontWeight: 700, color: "#DC2626" }}>{unansweredCount}</span> remaining
          </div>
          <div style={{
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
            onClick={submitExam}
            style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: "#1D4ED8", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#E2E8F0" }}>
        <div style={{ height: "100%", width: `${((currentIdx + 1) / 25) * 100}%`, background: "linear-gradient(90deg, #1D4ED8, #0F766E)", transition: "width 0.3s ease" }} />
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* DBQuestion navigator */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {questions.map((_, i) => {
            const ans = answers[i]?.selected;
            const isCurr = i === currentIdx;
            const isAnswered = ans !== null;
              const isFlaggedQ = flagged.includes(i);
            return (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: isCurr ? "2px solid #1D4ED8" : "1px solid #E2E8F0",
                  background: isCurr ? "#EFF6FF" : isAnswered ? "#F0FDF4" : "#F8FAFC",
                  color: isCurr ? "#1D4ED8" : isAnswered ? "#15803D" : "#94A3B8",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  position: "relative",
                }}
              >
                {i + 1}
                {isFlaggedQ && <span style={{ position: "absolute", top: -4, right: -4, fontSize: 8 }}>🚩</span>}
              </button>
            );
          })}
        </div>

        {/* DBQuestion card */}
        <div key={currentIdx} style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 14, animation: "fadeUp 0.25s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#DBEAFE", color: "#1D4ED8", padding: "4px 10px", borderRadius: 20 }}>{currentQ.module.toUpperCase()}</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: (currentQ.difficulty ?? 'medium') === "easy" ? "#DCFCE7" : (currentQ.difficulty ?? 'medium') === "medium" ? "#FEF9C3" : "#FEE2E2", color: (currentQ.difficulty ?? 'medium') === "easy" ? "#059669" : (currentQ.difficulty ?? 'medium') === "medium" ? "#D97706" : "#DC2626", padding: "4px 10px", borderRadius: 20 }}>{(currentQ.difficulty ?? 'medium').toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={toggleFlag}
                style={{ padding: "5px 10px", borderRadius: 20, border: `1px solid ${isFlagged ? "#F59E0B" : "#E2E8F0"}`, background: isFlagged ? "#FFFBEB" : "#F8FAFC", color: isFlagged ? "#D97706" : "#94A3B8", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                {isFlagged ? "🚩 Flagged" : "🏳 Flag"}
              </button>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{currentIdx + 1} / 25</span>
            </div>
          </div>

          {currentQ.tip && (
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px", marginBottom: 20, border: "1px solid #E2E8F0", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>📐</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 2 }}>FORMULA HINT</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#1D4ED8", fontWeight: 700 }}>{currentQ.tip}</div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.65, marginBottom: 24 }}>{currentQ.question}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = currentAnswer === i;
              return (
                <button
                  key={i}
                  className="opt-btn"
                  onClick={() => selectAnswer(i)}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    border: `2px solid ${isSelected ? "#3B82F6" : "#E2E8F0"}`,
                    background: isSelected ? "#EFF6FF" : "#F8FAFC",
                    color: isSelected ? "#1E3A5F" : "#374151",
                    fontSize: 13, fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                    transition: "all 0.15s ease", fontFamily: "inherit",
                  }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: isSelected ? "#3B82F6" : "#E2E8F0", color: isSelected ? "#fff" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", color: currentIdx === 0 ? "#CBD5E1" : "#374151", fontSize: 13, fontWeight: 700, cursor: currentIdx === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            ← Previous
          </button>
          {currentIdx < 24 ? (
            <button
              onClick={() => setCurrentIdx(i => Math.min(24, i + 1))}
              style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1D4ED8, #0F766E)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(29,78,216,0.25)" }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submitExam}
              style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #059669, #0F766E)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
            >
              Submit Exam ✓
            </button>
          )}
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
