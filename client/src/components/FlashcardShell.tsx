// ECHELON AI TUTOR — FlashcardShell Component
// Flip-card study mode derived from any question bank
// Handles all field name variants: question/q/text, correct/correctAnswer/correctIndex
// Persists spaced-repetition state (known/unknown) to the database per email+examType

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export interface FlashcardQuestion {
  id: number | string;
  module: string;
  question?: string;
  q?: string;
  text?: string;
  options: string[];
  correct?: number;
  correctAnswer?: number;
  correctIndex?: number;
  explanation: string;
  difficulty?: string;
  /** Calculation questions are excluded from flashcard decks */
  isCalc?: boolean;
  type?: string;
}

interface FlashcardShellProps {
  questions: FlashcardQuestion[];
  examName: string;
  examType: string;   // e.g. "class1-water" — used for persistence key
  backPath: string;
  modules: string[];
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function getQText(card: FlashcardQuestion): string {
  return card.question ?? card.q ?? card.text ?? "";
}

function getCorrectIdx(card: FlashcardQuestion): number {
  return card.correct ?? card.correctAnswer ?? card.correctIndex ?? 0;
}

const DIFF_COLOR: Record<string, { bg: string; fg: string }> = {
  easy:   { bg: "#DCFCE7", fg: "#15803D" },
  medium: { bg: "#FEF9C3", fg: "#A16207" },
  hard:   { bg: "#FEE2E2", fg: "#B91C1C" },
};

/** Get email from localStorage (set by Account page restore flow) */
function getStoredEmail(): string {
  try { return localStorage.getItem("echelon_purchase_email") ?? localStorage.getItem("echelon_trial_email") ?? ""; }
  catch { return ""; }
}

/** Strip calculation questions — they require multi-step math and are not suitable for flip-card study */
function filterConceptual(qs: FlashcardQuestion[]): FlashcardQuestion[] {
  return qs.filter(q => !q.isCalc && q.type !== "calculation");
}

export default function FlashcardShell({ questions, examName, examType, backPath, modules }: FlashcardShellProps) {
  // Remove calculation questions once, before any deck operations
  const conceptualQuestions = useMemo(() => filterConceptual(questions), [questions]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState<Set<number | string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [deck, setDeck] = useState<FlashcardQuestion[]>(() => shuffleArr(conceptualQuestions));
  const [sessionComplete, setSessionComplete] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Stable email for persistence — read once on mount
  const emailRef = useRef(getStoredEmail());
  const email = emailRef.current;

  // ── Load saved progress on mount ──────────────────────────────────────────
  const { data: savedProgress } = trpc.flashcard.getProgress.useQuery(
    { email, examType },
    {
      enabled: !!email,
      staleTime: Infinity,
      retry: false,
    }
  );

  useEffect(() => {
    if (savedProgress && !progressLoaded) {
      const ids = savedProgress.knownIds ?? [];
      if (ids.length > 0) {
        setKnown(new Set(ids));
      }
      setProgressLoaded(true);
    }
  }, [savedProgress, progressLoaded]);

  // ── Save progress (debounced) ─────────────────────────────────────────────
  const saveProgress = trpc.flashcard.saveProgress.useMutation();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistKnown = useCallback((nextKnown: Set<number | string>) => {
    if (!email) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress.mutate({
        email,
        examType,
        knownIds: Array.from(nextKnown),
        totalCards: conceptualQuestions.length,
      });
    }, 800);
  }, [email, examType, questions.length, saveProgress]);

  // Memoized filtered list (used for module switching)
  const _filtered = useMemo(() => {
    const base = selectedModule ? conceptualQuestions.filter(q => q.module === selectedModule) : conceptualQuestions;
    return reviewing ? base.filter(q => !known.has(q.id)) : base;
  }, [conceptualQuestions, selectedModule, reviewing, known]);
  void _filtered;

  const card = deck[index] ?? null;
  const questionText = card ? getQText(card) : "";
  const correctIdx = card ? getCorrectIdx(card) : 0;
  const answerText = card ? (card.options[correctIdx] ?? "") : "";
  const explanation = card?.explanation ?? "";
  const difficulty = card?.difficulty ?? "medium";
  const diffStyle = DIFF_COLOR[difficulty] ?? DIFF_COLOR.medium;

  const total = deck.length;
  const progress = total > 0 ? Math.round((index / total) * 100) : 0;
  const knownCount = known.size;

  const reshuffleDeck = useCallback((qs: FlashcardQuestion[]) => {
    setDeck(shuffleArr(qs));
    setIndex(0);
    setFlipped(false);
    setSessionComplete(false);
  }, []);

  const handleModuleChange = (mod: string | null) => {
    setSelectedModule(mod);
    const base = mod ? conceptualQuestions.filter(q => q.module === mod) : conceptualQuestions;
    const next = reviewing ? base.filter(q => !known.has(q.id)) : base;
    reshuffleDeck(next);
  };

  const handleNext = () => {
    if (index + 1 >= deck.length) {
      setSessionComplete(true);
    } else {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(i => i - 1);
      setFlipped(false);
    }
  };

  const markKnown = () => {
    if (card) {
      setKnown(prev => {
        const s = new Set(prev);
        s.add(card.id);
        persistKnown(s);
        return s;
      });
    }
    handleNext();
  };

  const markUnknown = () => {
    if (card) {
      setKnown(prev => {
        const s = new Set(prev);
        s.delete(card.id);
        persistKnown(s);
        return s;
      });
    }
    handleNext();
  };

  const handleShuffle = () => {
    const base = selectedModule ? questions.filter(q => q.module === selectedModule) : questions;
    const next = reviewing ? base.filter(q => !known.has(q.id)) : base;
    reshuffleDeck(next);
    const empty = new Set<number | string>();
    setKnown(empty);
    persistKnown(empty);
  };

  const handleReviewUnknown = () => {
    const base = selectedModule ? questions.filter(q => q.module === selectedModule) : questions;
    const missed = base.filter(q => !known.has(q.id));
    if (missed.length === 0) return;
    setReviewing(true);
    reshuffleDeck(missed);
  };

  if (sessionComplete) {
    const unknownCount = deck.length - knownCount;
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Session Complete!</h2>
          <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "32px" }}>You reviewed all {deck.length} cards</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "32px" }}>
            <div style={{ background: "#DCFCE7", borderRadius: "12px", padding: "16px 24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#15803D" }}>{knownCount}</div>
              <div style={{ fontSize: "13px", color: "#15803D", fontWeight: 600 }}>Known</div>
            </div>
            <div style={{ background: "#FEE2E2", borderRadius: "12px", padding: "16px 24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#B91C1C" }}>{unknownCount}</div>
              <div style={{ fontSize: "13px", color: "#B91C1C", fontWeight: 600 }}>Review Again</div>
            </div>
          </div>
          {email && (
            <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "16px" }}>
              ✓ Progress saved for {email}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {unknownCount > 0 && (
              <button onClick={handleReviewUnknown} style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: "10px", padding: "14px 24px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                Review {unknownCount} Missed Cards
              </button>
            )}
            <button onClick={handleShuffle} style={{ background: "#f1f5f9", color: "#0f172a", border: "none", borderRadius: "10px", padding: "14px 24px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
              Shuffle &amp; Restart
            </button>
            <Link href={backPath}>
              <button style={{ background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", cursor: "pointer", width: "100%" }}>
                Back to {examName}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .fc-wrap { perspective: 1200px; width: 100%; max-width: 680px; margin: 0 auto; }
        .fc-inner { position: relative; width: 100%; min-height: 320px; transform-style: preserve-3d; transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .fc-inner.flipped { transform: rotateY(180deg); }
        .fc-face { position: absolute; top: 0; left: 0; right: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 20px; padding: 36px 32px; min-height: 320px; display: flex; flex-direction: column; justify-content: center; }
        .fc-front { background: #ffffff; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .fc-back { background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); transform: rotateY(180deg); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .fc-mod-tab { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .fc-mod-tab.active { border-color: #3b82f6; }
        .fc-act-btn { border: none; border-radius: 12px; padding: 14px 20px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.15s; flex: 1; }
        .fc-act-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .fc-nav-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .fc-nav-btn:hover { background: rgba(255,255,255,0.2); }
        .fc-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        @media (max-width: 640px) {
          .fc-face { padding: 24px 20px; min-height: 260px; }
          .fc-act-btn { padding: 12px 14px; font-size: 14px; }
          .fc-wrap { max-width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href={backPath}>
            <button style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" }}>
              Back
            </button>
          </Link>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Flashcards: {examName}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>{deck.length} cards{reviewing ? " (missed only)" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{knownCount}</span> known
            {email && <span style={{ color: "#475569", marginLeft: 6, fontSize: "11px" }}>· saved</span>}
          </span>
          <button onClick={handleShuffle} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" }}>
            Shuffle
          </button>
        </div>
      </div>

      {/* Module Filter */}
      {modules.length > 1 && (
        <div style={{ padding: "12px 24px", overflowX: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            className={"fc-mod-tab" + (selectedModule === null ? " active" : "")}
            style={{ background: selectedModule === null ? "#1e40af" : "rgba(255,255,255,0.1)", color: "#fff" }}
            onClick={() => handleModuleChange(null)}
          >
            All Modules
          </span>
          {modules.map(mod => (
            <span
              key={mod}
              className={"fc-mod-tab" + (selectedModule === mod ? " active" : "")}
              style={{ background: selectedModule === mod ? "#1e40af" : "rgba(255,255,255,0.1)", color: "#fff" }}
              onClick={() => handleModuleChange(mod)}
            >
              {mod}
            </span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ padding: "0 24px 8px" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4)", height: "100%", width: progress + "%", transition: "width 0.3s ease", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: "#64748b", fontSize: "12px" }}>Card {Math.min(index + 1, deck.length)} of {deck.length}</span>
          <span style={{ color: "#64748b", fontSize: "12px" }}>{progress}% complete</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ padding: "16px 24px 8px" }}>
        {card ? (
          <div className="fc-wrap">
            {!flipped && (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: "13px", marginBottom: "10px" }}>
                Tap card to reveal answer
              </div>
            )}
            <div
              className={"fc-inner" + (flipped ? " flipped" : "")}
              onClick={() => setFlipped(f => !f)}
            >
              {/* Front */}
              <div className="fc-face fc-front">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}>
                    {card.module}
                  </span>
                  <span style={{ background: diffStyle.bg, color: diffStyle.fg, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}>
                    {difficulty}
                  </span>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", lineHeight: 1.5, flex: 1, display: "flex", alignItems: "center" }}>
                  {questionText}
                </div>
                <div style={{ marginTop: "20px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>
                  Tap to flip
                </div>
              </div>
              {/* Back */}
              <div className="fc-face fc-back">
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#93c5fd", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}>
                    Correct Answer
                  </span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", marginBottom: "16px", lineHeight: 1.4 }}>
                  {answerText}
                </div>
                <div style={{ fontSize: "14px", color: "#bfdbfe", lineHeight: 1.6 }}>
                  {explanation}
                </div>
                <div style={{ marginTop: "16px", color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center" }}>
                  Tap to flip back
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#64748b", padding: "48px" }}>No cards in this filter.</div>
        )}
      </div>

      {/* Action buttons — only show after flip */}
      {flipped && card && (
        <div style={{ padding: "12px 24px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", gap: "12px" }}>
            <button
              className="fc-act-btn"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}
              onClick={(e) => { e.stopPropagation(); markUnknown(); }}
            >
              Still Learning
            </button>
            <button
              className="fc-act-btn"
              style={{ background: "#DCFCE7", color: "#15803D" }}
              onClick={(e) => { e.stopPropagation(); markKnown(); }}
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ padding: "8px 24px 32px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="fc-nav-btn" onClick={handlePrev} disabled={index === 0}>
            Prev
          </button>
          <button
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", cursor: "pointer" }}
            onClick={() => setFlipped(f => !f)}
          >
            {flipped ? "Show Question" : "Show Answer"}
          </button>
          <button className="fc-nav-btn" onClick={handleNext} disabled={index >= deck.length - 1}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
