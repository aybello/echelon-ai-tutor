// ECHELON AI TUTOR — FlashcardShell Component
// Flip-card study mode derived from any question bank
// Handles all field name variants: question/q/text, correct/correctAnswer/correctIndex
// Persists spaced-repetition state (known/unknown) to the database per email+examType

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteNav from "@/components/SiteNav";
import {
  flashcardProgressKey,
  normalizeKnownFlashcardIds,
  stillLearningCards,
  summarizeFlashcardProgress,
} from "@/lib/flashcardProgress";
import { advanceReviewQueue } from "@/lib/flashcardStudy";

const FREE_FLIP_LIMIT = 10; // cards that can be flipped before paywall

export interface FlashcardQuestion {
  id: number | string;
  module: string;
  topic?: string;
  question?: string;
  q?: string;
  text?: string;
  options: string[];
  correct?: number;
  correctAnswer?: number;
  correctIndex?: number;
  explanation: string;
  difficulty?: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  diagramId?: string | null;
  /** Calculation questions are excluded from flashcard decks */
  isCalc?: boolean;
  type?: string;
}

export interface FlashcardCardContent {
  kicker?: string;
  topic?: string;
  title?: string;
  prompt: string;
  answer: string;
  explanation: string;
  takeaway?: string;
  diagramNote?: string;
}

interface FlashcardShellProps {
  questions: FlashcardQuestion[];
  examName: string;
  examType: string;   // e.g. "class1-water" — used for persistence key
  backPath: string;
  modules: string[];
  /** If set, show a paywall overlay after this many flips (for free preview pages) */
  freeFlipLimit?: number;
  /** Product key to link to on the paywall CTA */
  productKey?: string;
  /** Optional course-specific study-card projection from governed question data. */
  cardContent?: (card: FlashcardQuestion) => FlashcardCardContent;
  /** Optional course-specific visual shown on the front of the card. */
  renderFrontSupplement?: (card: FlashcardQuestion) => ReactNode;
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

function guestProgressKey(examType: string): string {
  return `echelon_flashcard_progress:guest:${examType}`;
}

function loadGuestKnown(examType: string): (number | string)[] {
  try {
    const raw = localStorage.getItem(guestProgressKey(examType));
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(id => typeof id === "number" || typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveGuestKnown(examType: string, ids: Set<string>): void {
  try {
    localStorage.setItem(guestProgressKey(examType), JSON.stringify(Array.from(ids)));
  } catch {
    // The in-memory session still works when storage is unavailable.
  }
}

/** Strip calculation questions — they require multi-step math and are not suitable for flip-card study */
function filterConceptual(qs: FlashcardQuestion[]): FlashcardQuestion[] {
  return qs.filter(q => !q.isCalc && q.type !== "calculation");
}

export default function FlashcardShell({ questions, examName, examType, backPath, modules, freeFlipLimit, productKey, cardContent, renderFrontSupplement }: FlashcardShellProps) {
  // Remove calculation questions once, before any deck operations
  const conceptualQuestions = useMemo(() => filterConceptual(questions), [questions]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [totalFlips, setTotalFlips] = useState(0);
  const [paywallDismissed, setPaywallDismissed] = useState(false);
  const limit = freeFlipLimit ?? FREE_FLIP_LIMIT;
  const showPaywall = freeFlipLimit !== undefined && totalFlips >= limit && !paywallDismissed;
  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [reviewStartCount, setReviewStartCount] = useState(0);
  const [deck, setDeck] = useState<FlashcardQuestion[]>(() => shuffleArr(conceptualQuestions));
  const [sessionComplete, setSessionComplete] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Use auth user email first, fall back to localStorage
  const { user } = useAuth();
  const email = user?.email || getStoredEmail();

  // ── Load saved progress on mount ──────────────────────────────────────────
  const { data: savedProgress } = trpc.flashcard.getProgress.useQuery(
    { email, examType },
    {
      enabled: !!email,
      staleTime: Infinity,
      retry: false,
    }
  );

  // Reset and load the correct identity whenever the learner or course changes.
  // Anonymous learners use local storage; signed-in learners use server progress.
  useEffect(() => {
    setKnown(new Set());
    setProgressLoaded(false);
    if (!email) {
      setKnown(normalizeKnownFlashcardIds(loadGuestKnown(examType), conceptualQuestions));
      setProgressLoaded(true);
    }
  }, [email, examType, conceptualQuestions]);

  useEffect(() => {
    if (email && savedProgress && !progressLoaded) {
      setKnown(normalizeKnownFlashcardIds(savedProgress.knownIds ?? [], conceptualQuestions));
      setProgressLoaded(true);
    }
  }, [email, savedProgress, progressLoaded, conceptualQuestions]);

  // ── Save progress ──────────────────────────────────────────────────────────
  // Serialize writes so rapid ratings cannot arrive out of order and overwrite
  // a newer known/learning decision with an older snapshot.
  const saveProgress = trpc.flashcard.saveProgress.useMutation();
  const queuedSaveRef = useRef<{
    email: string;
    examType: string;
    knownIds: string[];
    totalCards: number;
  } | null>(null);
  const saveInFlightRef = useRef(false);

  const drainSaveQueue = useCallback(async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    try {
      while (queuedSaveRef.current) {
        const payload = queuedSaveRef.current;
        queuedSaveRef.current = null;
        try {
          await saveProgress.mutateAsync(payload);
        } catch {
          // The next learner action queues the full latest state and retries it.
          break;
        }
      }
    } finally {
      saveInFlightRef.current = false;
    }
  }, [saveProgress]);

  const persistKnown = useCallback((nextKnown: Set<string>) => {
    if (!email) {
      saveGuestKnown(examType, nextKnown);
      return;
    }
    queuedSaveRef.current = {
      email,
      examType,
      knownIds: Array.from(nextKnown),
      totalCards: conceptualQuestions.length,
    };
    void drainSaveQueue();
  }, [email, examType, conceptualQuestions.length, drainSaveQueue]);

  const selectedScope = useMemo(
    () => selectedModule ? conceptualQuestions.filter((question) => question.module === selectedModule) : conceptualQuestions,
    [conceptualQuestions, selectedModule],
  );

  const card = deck[index] ?? null;
  const questionText = card ? getQText(card) : "";
  const correctIdx = card ? getCorrectIdx(card) : 0;
  const answerText = card ? (card.options[correctIdx] ?? "").replace(/^[A-Da-d][.):]\s*/, "") : "";
  const explanation = card?.explanation ?? "";
  const difficulty = card?.difficulty ?? "medium";
  const diffStyle = DIFF_COLOR[difficulty] ?? DIFF_COLOR.medium;
  const projectedContent = card ? cardContent?.(card) : undefined;
  const frontSupplement = card ? renderFrontSupplement?.(card) : undefined;
  const displayPrompt = projectedContent?.prompt ?? questionText;
  const displayAnswer = projectedContent?.answer ?? answerText;
  const displayExplanation = projectedContent?.explanation ?? explanation;

  const total = deck.length;
  const progress = reviewing && reviewStartCount > 0
    ? Math.round(((reviewStartCount - deck.length) / reviewStartCount) * 100)
    : total > 0 ? Math.round((index / total) * 100) : 0;
  const scopeSummary = summarizeFlashcardProgress(selectedScope, known);
  const sessionSummary = summarizeFlashcardProgress(deck, known);

  const reshuffleDeck = useCallback((qs: FlashcardQuestion[]) => {
    setDeck(shuffleArr(qs));
    setIndex(0);
    setFlipped(false);
    setSessionComplete(false);
  }, []);

  const handleModuleChange = (mod: string | null) => {
    setSelectedModule(mod);
    const base = mod ? conceptualQuestions.filter(q => q.module === mod) : conceptualQuestions;
    const next = reviewing ? stillLearningCards(base, known) : base;
    if (reviewing) setReviewStartCount(next.length);
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

  // Flip the card. The free-flip counter is incremented OUTSIDE the setFlipped
  // updater so it can't double-count (which would burn a free-preview user's
  // flips twice as fast). Only counts a flip when revealing the answer.
  const handleFlip = () => {
    if (showPaywall) return;
    if (!flipped) setTotalFlips(n => n + 1);
    setFlipped(f => !f);
  };

  const markKnown = () => {
    if (!card) return;
    const nextKnown = new Set(known);
    nextKnown.add(flashcardProgressKey(card.id));
    setKnown(nextKnown);
    persistKnown(nextKnown);

    if (reviewing) {
      const next = advanceReviewQueue(deck, index, "known");
      setDeck(next.deck);
      setIndex(next.index);
      setFlipped(false);
      if (next.complete) setSessionComplete(true);
      return;
    }
    handleNext();
  };

  const markUnknown = () => {
    if (!card) return;
    const nextKnown = new Set(known);
    nextKnown.delete(flashcardProgressKey(card.id));
    setKnown(nextKnown);
    persistKnown(nextKnown);

    if (reviewing) {
      const next = advanceReviewQueue(deck, index, "learning");
      setDeck(next.deck);
      setIndex(next.index);
      setFlipped(false);
      return;
    }
    handleNext();
  };

  const handleShuffle = () => {
    const base = selectedModule ? conceptualQuestions.filter(q => q.module === selectedModule) : conceptualQuestions;
    const next = reviewing ? stillLearningCards(base, known) : base;
    reshuffleDeck(next);
  };

  const handleReviewUnknown = () => {
    const missed = stillLearningCards(selectedScope, known);
    if (missed.length === 0) return;
    setReviewStartCount(missed.length);
    setReviewing(true);
    reshuffleDeck(missed);
  };

  const handleStudyDeck = () => {
    setReviewStartCount(0);
    setReviewing(false);
    reshuffleDeck(selectedScope);
  };

  if (sessionComplete) {
    const { gotIt: deckKnownCount, stillLearning: standardUnknownCount } = sessionSummary;
    const unknownCount = reviewing ? 0 : standardUnknownCount;
    const reviewedTotal = reviewing ? reviewStartCount : deck.length;
    return (
      <div style={{ minHeight: "100vh", background: "var(--echelon-canvas)" }}>
        <SiteNav currentPath={window.location.pathname} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ background: "#fff", borderRadius: "18px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", border: "1px solid var(--echelon-line)", boxShadow: "var(--echelon-shadow-md)" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Session Complete!</h2>
          <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "32px" }}>You reviewed all {reviewedTotal} cards</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "32px" }}>
            <div style={{ background: "#DCFCE7", borderRadius: "12px", padding: "16px 24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#15803D" }}>{deckKnownCount}</div>
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
            <button onClick={handleStudyDeck} style={{ background: "#f1f5f9", color: "#0f172a", border: "none", borderRadius: "10px", padding: "14px 24px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
              Study This Deck Again
            </button>
            <Link href={backPath}>
              <button style={{ background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", cursor: "pointer", width: "100%" }}>
                Back to {examName}
              </button>
            </Link>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--echelon-canvas)", fontFamily: "'Sora', sans-serif" }}>
      <SiteNav currentPath={window.location.pathname} />
      <style>{`
        .fc-wrap { perspective: 1200px; width: 100%; max-width: 680px; margin: 0 auto 8px; }
        .fc-inner { position: relative; width: 100%; height: 240px; transform-style: preserve-3d; transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .fc-inner.flipped { transform: rotateY(180deg); }
        .fc-face { position: absolute; top: 0; left: 0; right: 0; bottom: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 20px; padding: 24px 28px; display: flex; flex-direction: column; justify-content: center; overflow-y: auto; }
        .fc-face.fc-face-projected { justify-content: flex-start; }
        .fc-front { background: #ffffff; border: 1px solid var(--echelon-line); box-shadow: var(--echelon-shadow-md); }
        .fc-back { background: linear-gradient(135deg, #1E3A5F 0%, #0047AB 100%); transform: rotateY(180deg); box-shadow: var(--echelon-shadow-md); }
        .fc-actions-row { position: relative; z-index: 4; padding: 12px 24px 20px; background: var(--echelon-canvas); }
        .fc-mod-tab { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
        .fc-mod-tab.active { border-color: #0047AB; }
        .fc-act-btn { border: none; border-radius: 12px; padding: 14px 20px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.15s; flex: 1; }
        .fc-act-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .fc-nav-btn { background: #fff; border: 1px solid var(--echelon-line); color: var(--echelon-ink); border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 650; cursor: pointer; transition: all 0.15s; }
        .fc-nav-btn:hover { border-color: #AFC5E3; background: #EEF4FB; color: #1E3A5F; }
        .fc-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        @media (max-width: 640px) {
          .fc-inner { height: 220px; }
          .fc-face { padding: 20px 18px; }
          .fc-act-btn { padding: 12px 14px; font-size: 14px; }
          .fc-wrap { max-width: 100%; }
          .fc-header { padding: 12px 16px !important; }
          .fc-header-title { font-size: 14px !important; }
          .fc-header-sub { font-size: 11px !important; }
          .fc-module-row { padding: 8px 16px !important; }
          .fc-progress-row { padding: 0 16px 6px !important; }
          .fc-card-area { padding: 12px 16px 6px !important; }
          .fc-actions-row { padding: 12px 16px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="fc-header" style={{ background: "#fff", borderBottom: "1px solid var(--echelon-line)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href={backPath}>
            <button style={{ background: "#F8FAFC", border: "1px solid var(--echelon-line)", color: "#475569", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer" }}>
              Back
            </button>
          </Link>
          <div>
            <div className="fc-header-title" style={{ color: "var(--echelon-ink)", fontWeight: 750, fontSize: "16px" }}>Flashcards: {examName}</div>
            <div className="fc-header-sub" style={{ color: "#94a3b8", fontSize: "12px" }}>{deck.length} cards{reviewing ? " (missed only)" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{scopeSummary.gotIt}</span> got it · {scopeSummary.stillLearning} still learning
            {email && <span style={{ color: "#475569", marginLeft: 6, fontSize: "11px" }}>· saved</span>}
          </span>
          <button onClick={handleShuffle} style={{ background: "#EEF4FB", border: "1px solid #B8CAE2", color: "#1E3A5F", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            Shuffle
          </button>
        </div>
      </div>

      <div style={{ padding: "10px 24px", background: "#F8FAFC", borderBottom: "1px solid var(--echelon-line)", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        <button className="fc-nav-btn" onClick={handleStudyDeck} style={{ background: !reviewing ? "#E5EFF9" : "#fff", color: !reviewing ? "#1E3A5F" : undefined }}>
          Study deck
        </button>
        <button className="fc-nav-btn" onClick={handleReviewUnknown} disabled={scopeSummary.stillLearning === 0} style={{ background: reviewing ? "#FEE2E2" : "#fff", color: reviewing ? "#B91C1C" : undefined }}>
          Review {scopeSummary.stillLearning} still-learning
        </button>
      </div>

      {/* Module Filter */}
      {modules.length > 1 && (
        <div className="fc-module-row" style={{ padding: "12px 24px", overflowX: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            className={"fc-mod-tab" + (selectedModule === null ? " active" : "")}
            style={{ background: selectedModule === null ? "#1E3A5F" : "#fff", color: selectedModule === null ? "#fff" : "#475569", borderColor: selectedModule === null ? "#1E3A5F" : "var(--echelon-line)" }}
            onClick={() => handleModuleChange(null)}
          >
            All Modules
          </span>
          {modules.map(mod => (
            <span
              key={mod}
              className={"fc-mod-tab" + (selectedModule === mod ? " active" : "")}
              style={{ background: selectedModule === mod ? "#1E3A5F" : "#fff", color: selectedModule === mod ? "#fff" : "#475569", borderColor: selectedModule === mod ? "#1E3A5F" : "var(--echelon-line)" }}
              onClick={() => handleModuleChange(mod)}
            >
              {mod}
            </span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="fc-progress-row" style={{ padding: "0 24px 8px" }}>
        <div style={{ background: "#DBE4EF", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
          <div style={{ background: "#0047AB", height: "100%", width: progress + "%", transition: "width 0.3s ease", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: "#64748b", fontSize: "12px" }}>Card {Math.min(index + 1, deck.length)} of {deck.length}</span>
          <span style={{ color: "#64748b", fontSize: "12px" }}>{progress}% complete</span>
        </div>
      </div>

      {/* Card */}
      <div className="fc-card-area" style={{ padding: "16px 24px 8px" }}>
        {card ? (
          <div className="fc-wrap">
            {!flipped && (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: "13px", marginBottom: "10px" }}>
                Tap card to reveal answer
              </div>
            )}
            <button
              type="button"
              className={"fc-inner" + (flipped ? " flipped" : "")}
              onClick={handleFlip}
              aria-pressed={flipped}
              aria-label={flipped ? "Hide answer" : "Reveal answer"}
              style={{ background: "none", border: "none", padding: 0, width: "100%", textAlign: "left" }}
            >
              {/* Front */}
              <div className={"fc-face fc-front" + (projectedContent ? " fc-face-projected" : "")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}>
                    {projectedContent?.kicker ?? card.module}
                  </span>
                  <span style={{ background: diffStyle.bg, color: diffStyle.fg, borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}>
                    {difficulty}
                  </span>
                </div>
                {projectedContent?.topic && (
                  <div style={{ color: "#0047AB", fontSize: "13px", fontWeight: 750, marginBottom: "10px" }}>
                    {projectedContent.topic}
                  </div>
                )}
                {projectedContent?.title && (
                  <div style={{ color: "#0f172a", fontSize: "20px", fontWeight: 800, lineHeight: 1.25, marginBottom: "10px" }}>
                    {projectedContent.title}
                  </div>
                )}
                {frontSupplement && (
                  <div style={{ marginBottom: "18px", width: "100%" }}>
                    {frontSupplement}
                  </div>
                )}
                <div style={{ fontSize: projectedContent ? "15px" : "18px", fontWeight: projectedContent ? 500 : 600, color: "#0f172a", lineHeight: 1.5, flex: 1, display: "flex", alignItems: projectedContent ? "flex-start" : "center" }}>
                  {displayPrompt}
                </div>
                <div style={{ marginTop: "12px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>
                  Tap to flip
                </div>
              </div>
              {/* Back */}
              <div className={"fc-face fc-back" + (projectedContent ? " fc-face-projected" : "")}>
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#93c5fd", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}>
                    Correct Answer
                  </span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", marginBottom: "16px", lineHeight: 1.4 }}>
                  {displayAnswer}
                </div>
                <div style={{ fontSize: "14px", color: "#bfdbfe", lineHeight: 1.6 }}>
                  {displayExplanation}
                </div>
                {projectedContent?.takeaway && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.16)", paddingTop: "14px", color: "#fff", fontSize: "13px", lineHeight: 1.5 }}>
                    <strong>Key takeaway:</strong> {projectedContent.takeaway}
                  </div>
                )}
                {projectedContent?.diagramNote && (
                  <div style={{ marginTop: "10px", color: "#BFDBFE", fontSize: "12px", lineHeight: 1.45 }}>
                    {projectedContent.diagramNote}
                  </div>
                )}
                <div style={{ marginTop: "16px", color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center" }}>
                  Tap to flip back
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#64748b", padding: "48px" }}>No cards in this filter.</div>
        )}
      </div>

      {/* Action buttons — only show after flip */}
      {flipped && card && (
        <div className="fc-actions-row">
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

      {/* Free trial paywall overlay */}
      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "40px 36px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🃏</div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>You've previewed {limit} free cards!</h2>
            <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              Unlock the full <strong>{examName}</strong> flashcard deck — {questions.length}+ concept flashcards with module filters and saved progress.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href={productKey ? `/pricing#${productKey}` : "/pricing"}>
                <button style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                  Get Full Access →
                </button>
              </Link>
              <button
                onClick={() => setPaywallDismissed(true)}
                style={{ width: "100%", padding: "12px 20px", borderRadius: "12px", border: "1.5px solid #CBD5E1", background: "#F8FAFC", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                🔄 Try {limit} More Free Cards
              </button>
              <Link href="/pricing">
                <button style={{ width: "100%", padding: "10px 20px", borderRadius: "12px", border: "none", background: "transparent", color: "#94A3B8", fontSize: "12px", cursor: "pointer" }}>
                  📋 View All Courses & Pricing
                </button>
              </Link>
            </div>
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
            style={{ background: "#fff", border: "1px solid var(--echelon-line)", color: "#64748B", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", cursor: "pointer" }}
            onClick={handleFlip}
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
