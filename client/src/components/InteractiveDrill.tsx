import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import "./InteractiveDrill.css";

/** Each item needs a stable, unique id across the examples array. */
export type DrillMode =
  | "rapid-swipe"
  | "speed-match"
  | "odd-one-out"
  | "cause-effect"
  | "tap-the-flaw"
  | "before-after";

interface DrillBase {
  id: string;
  prompt: string;
  /** Optional context or directions shown below the prompt. */
  instruction?: string;
}

export interface RapidSwipeExample extends DrillBase {
  mode: "rapid-swipe";
  /** True means Yes / swipe right; false means No / swipe left. */
  correctAnswer: boolean;
  explanation: string;
}

export interface DrillMatchPair {
  /** Unique within this matching activity. */
  id: string;
  left: string;
  right: string;
}

export interface SpeedMatchExample extends DrillBase {
  mode: "speed-match";
  /** Each pair associates its left and right labels; supply at least two pairs. */
  pairs: readonly DrillMatchPair[];
  explanation?: string;
}

export interface DrillOption {
  /** Unique within this question. */
  id: string;
  label: string;
}

export interface ChoiceDrillExample extends DrillBase {
  mode: "odd-one-out" | "cause-effect" | "tap-the-flaw";
  /** Supply at least two choices, including the correctOptionId. */
  options: readonly DrillOption[];
  correctOptionId: string;
  explanation: string;
}

interface BeforeAfterBase extends DrillBase {
  mode: "before-after";
  explanation: string;
}

/** Legacy direction question, or a question asking which of two supplied labels fits.
 * Frame the prompt and instruction without either option label or any answer hint.
 * Correct answers match one option after whitespace normalization and case-folding.
 */
export type BeforeAfterExample = BeforeAfterBase & (
  | { options?: never; correctAnswer: "before" | "after" }
  | { options: readonly string[]; correctAnswer: string }
);

export type DrillExample =
  | RapidSwipeExample
  | SpeedMatchExample
  | ChoiceDrillExample
  | BeforeAfterExample;

export interface InteractiveDrillProps {
  /** Parent-provided content only. Examples are grouped by mode in their original order. */
  examples: readonly DrillExample[];
  className?: string;
}

const MODES: readonly { id: DrillMode; label: string; description: string }[] = [
  { id: "rapid-swipe", label: "Rapid Swipe", description: "Make a quick call" },
  { id: "speed-match", label: "Speed-Match", description: "Connect the right pairs" },
  { id: "odd-one-out", label: "Odd-One-Out", description: "Spot what does not belong" },
  { id: "cause-effect", label: "Cause Effect", description: "Predict what happens next" },
  { id: "tap-the-flaw", label: "Tap-the-Flaw", description: "Find the incorrect statement" },
  { id: "before-after", label: "Before/After", description: "Put things in order" },
];

type Feedback = { correct: boolean; text: string };
type Selection = { side: "left" | "right"; pairId: string };

const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const normalizedLabel = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
// Deterministic presentation only, not a secret or a source of grading information.
// Seed from the activity's stable identity, never from the answer or option IDs.
function shuffleChoices<T>(choices: readonly T[], mode: DrillMode, activityId: string): T[] {
  let state = 2166136261;
  for (const char of JSON.stringify([mode, activityId])) {
    state = Math.imul(state ^ char.codePointAt(0)!, 16777619);
  }
  const shuffled = [...choices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Mulberry32 produces a stable sequence for a given activity identity.
    state = (state + 0x6D2B79F5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const j = Math.floor(((value ^ (value >>> 14)) >>> 0) / 4294967296 * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
// Match the server's visible-label check: short labels need Unicode word boundaries;
// longer labels use conservative substring matching.
const containsVisibleLabel = (visible: string, label: string) => {
  if (Array.from(label).length > 3) return visible.includes(label);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}_])`, "u").test(visible);
};

function isValidExample(example: DrillExample): boolean {
  if (example.mode === "speed-match") {
    return example.pairs.length >= 2 && new Set(example.pairs.map(pair => pair.id)).size === example.pairs.length;
  }
  if (example.mode === "rapid-swipe") return true;
  if (example.mode === "before-after") {
    if (example.options === undefined) return example.correctAnswer === "before" || example.correctAnswer === "after";
    if (!Array.isArray(example.options) || example.options.length !== 2 ||
        typeof example.correctAnswer !== "string" ||
        !example.options.every(option => typeof option === "string" && option.trim().length > 0)) return false;
    const labels = example.options.map(normalizeLabel);
    const visiblePrompt = normalizeLabel(`${example.prompt} ${example.instruction ?? ""}`);
    const visibleConservative = normalizedLabel(`${example.prompt} ${example.instruction ?? ""}`);
    return labels[0] !== labels[1] && labels.filter(label => label === normalizeLabel(example.correctAnswer)).length === 1 &&
      example.options.every(label => !containsVisibleLabel(visiblePrompt, normalizeLabel(label)) &&
        !containsVisibleLabel(visibleConservative, normalizedLabel(label)));
  }
  return example.options.length >= 2 &&
    new Set(example.options.map(option => option.id)).size === example.options.length &&
    example.options.some(option => option.id === example.correctOptionId);
}

interface ActivityProps {
  example: DrillExample;
  index: number;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
  onRestart: () => void;
  onStartRound: () => void;
  focusHeadingIfRequested: (heading: HTMLHeadingElement | null) => void;
}

function Activity({ example, index, count, onPrevious, onNext, onRestart, onStartRound, focusHeadingIfRequested }: ActivityProps) {
  const titleId = useId();
  const instructionId = useId();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answered, setAnswered] = useState(false);
  const answeredRef = useRef(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const focusFeedback = useRef(false);
  const swipeStart = useRef<{ id: number; x: number; y: number; element: HTMLDivElement } | null>(null);
  const valid = isValidExample(example);

  useLayoutEffect(() => {
    focusHeadingIfRequested(headingRef.current);
  }, []);

  useLayoutEffect(() => {
    if (feedback && focusFeedback.current) {
      focusFeedback.current = false;
      feedbackRef.current?.focus();
    }
  }, [feedback]);

  const clearSwipe = () => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start) {
      try {
        if (start.element.hasPointerCapture(start.id)) start.element.releasePointerCapture(start.id);
      } catch {
        // Synthetic events and already-ended pointers may not have capture.
      }
    }
  };

  const answer = (correct: boolean, correctLabel: string, explanation: string) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    focusFeedback.current = true;
    clearSwipe();
    setFeedback({
      correct,
      text: correct ? explanation : `The correct answer is ${correctLabel}. ${explanation}`,
    });
    setAnswered(true);
  };

  const handleSwipeStart = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.pointerType !== "touch" && event.pointerType !== "pen") || !event.isPrimary || event.button !== 0 || answered || swipeStart.current) return;
    const element = event.currentTarget;
    swipeStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY, element };
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Untrusted synthetic pointer events have no active pointer to capture.
    }
  };

  const handleSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start || start.id !== event.pointerId) return;
    clearSwipe();
    if (answered || example.mode !== "rapid-swipe") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy)) {
      const choice = dx > 0;
      answer(choice === example.correctAnswer, example.correctAnswer ? "Yes" : "No", example.explanation);
    }
  };

  const handleSwipeCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (swipeStart.current?.id === event.pointerId) clearSwipe();
  };

  const selectPair = (side: "left" | "right", pairId: string) => {
    if (example.mode !== "speed-match" || answered || matched.includes(pairId)) return;
    if (!selected || selected.side === side) {
      setSelected(selected?.side === side && selected.pairId === pairId ? null : { side, pairId });
      setFeedback(null);
      return;
    }
    setSelected(null);
    if (selected.pairId !== pairId) {
      setFeedback({ correct: false, text: "Those do not match. Try another pair." });
      return;
    }
    focusFeedback.current = true;
    const nextMatched = [...matched, pairId];
    setMatched(nextMatched);
    if (nextMatched.length === example.pairs.length) {
      setAnswered(true);
      setFeedback({ correct: true, text: example.explanation || "You matched all the pairs." });
    } else {
      setFeedback({ correct: true, text: "Pair matched. Keep going." });
    }
  };

  // Rotate the right column so answers are not presented in matching row order.
  const rightPairs = example.mode === "speed-match" && example.pairs.length > 1
    ? [...example.pairs.slice(1), example.pairs[0]]
    : [];

  return (
    <section className="interactive-drill__activity" aria-labelledby={titleId}>
      <div className="interactive-drill__meta">
        <span>Activity {index + 1} of {count}</span>
        <span className="interactive-drill__pill">Practice · not saved</span>
      </div>
      <div className="interactive-drill__track" aria-hidden="true">
        <span style={{ width: `${((index + 1) / count) * 100}%` }} />
      </div>
      <div className="interactive-drill__content">
        <h2 id={titleId} ref={headingRef} tabIndex={-1}>{!valid && example.mode === "before-after" && example.options !== undefined ? "Before/After activity unavailable" : example.prompt}</h2>
        <p id={instructionId} className="interactive-drill__instruction">
          {(!valid && example.mode === "before-after" && example.options !== undefined ? undefined : example.instruction) || (example.mode === "rapid-swipe"
            ? "Swipe left for No or right for Yes, or choose a button."
            : example.mode === "speed-match"
              ? "Choose one item from each column to make a pair."
              : "Choose one answer.")}
        </p>
        {!valid ? (
          <p className="interactive-drill__invalid" role="status">This activity is unavailable because its content is incomplete or ambiguous.</p>
        ) : example.mode === "rapid-swipe" ? (
          <>
            <button type="button" className="interactive-drill__round-start interactive-drill__secondary" onClick={onStartRound}>Start 30-second round</button>
            <div className="interactive-drill__swipe" onPointerDown={handleSwipeStart} onPointerUp={handleSwipeEnd} onPointerCancel={handleSwipeCancel} onLostPointerCapture={handleSwipeCancel}>
              <span aria-hidden="true">← No</span>
              <span>Swipe to choose</span>
              <span aria-hidden="true">Yes →</span>
            </div>
            <div className="interactive-drill__options interactive-drill__options--two" aria-describedby={instructionId}>
              <button type="button" disabled={answered} onClick={() => answer(!example.correctAnswer, example.correctAnswer ? "Yes" : "No", example.explanation)}>No</button>
              <button type="button" disabled={answered} onClick={() => answer(example.correctAnswer, example.correctAnswer ? "Yes" : "No", example.explanation)}>Yes</button>
            </div>
          </>
        ) : example.mode === "speed-match" ? (
          <div className="interactive-drill__matching" aria-describedby={instructionId}>
            <div className="interactive-drill__column" role="group" aria-label="First items">
              {example.pairs.map(pair => (
                <button key={pair.id} type="button" className={matched.includes(pair.id) ? "is-matched" : selected?.side === "left" && selected.pairId === pair.id ? "is-selected" : ""} disabled={matched.includes(pair.id)} aria-pressed={selected?.side === "left" && selected.pairId === pair.id} onClick={() => selectPair("left", pair.id)}>
                  {pair.left}{matched.includes(pair.id) && <span className="interactive-drill__matched-label"> · Matched</span>}
                </button>
              ))}
            </div>
            <div className="interactive-drill__column" role="group" aria-label="Second items">
              {rightPairs.map(pair => (
                <button key={pair.id} type="button" className={matched.includes(pair.id) ? "is-matched" : selected?.side === "right" && selected.pairId === pair.id ? "is-selected" : ""} disabled={matched.includes(pair.id)} aria-pressed={selected?.side === "right" && selected.pairId === pair.id} onClick={() => selectPair("right", pair.id)}>
                  {pair.right}{matched.includes(pair.id) && <span className="interactive-drill__matched-label"> · Matched</span>}
                </button>
              ))}
            </div>
          </div>
        ) : example.mode === "before-after" ? (
          <div className={`interactive-drill__options ${example.options ? "interactive-drill__options--ordering" : "interactive-drill__options--two"}`} role="group" aria-label="Answer choices" aria-describedby={instructionId}>
            {(example.options ? shuffleChoices(example.options, example.mode, example.id) : ["Before", "After"]).map(choice => (
              <button key={choice} type="button" disabled={answered} onClick={() => {
                const correct = normalizeLabel(choice) === normalizeLabel(example.correctAnswer);
                const correctLabel = (example.options ?? ["Before", "After"]).find(label => normalizeLabel(label) === normalizeLabel(example.correctAnswer)) ?? "";
                answer(correct, correctLabel, example.explanation);
              }}>{choice}</button>
            ))}
          </div>
        ) : (
          <div className="interactive-drill__options" aria-describedby={instructionId}>
            {shuffleChoices(example.options, example.mode, example.id).map(option => (
              <button key={option.id} type="button" disabled={answered} onClick={() => answer(option.id === example.correctOptionId, example.options.find(item => item.id === example.correctOptionId)?.label ?? "", example.explanation)}>{option.label}</button>
            ))}
          </div>
        )}
        <div ref={feedbackRef} tabIndex={-1} className="interactive-drill__feedback-region" role="status" aria-live="polite" aria-atomic="true">
          {feedback && <div className={`interactive-drill__feedback ${feedback.correct ? "is-correct" : "is-incorrect"}`}><strong>{feedback.correct ? "Correct" : "Not quite"}</strong><span>{feedback.text}</span></div>}
        </div>
        <div className="interactive-drill__controls">
          <button type="button" className="interactive-drill__secondary" disabled={index === 0} onClick={onPrevious}>Previous</button>
          {index + 1 < count ? (
            <button type="button" className="interactive-drill__primary" disabled={!answered && valid} onClick={onNext}>Next activity →</button>
          ) : (
            <button type="button" className="interactive-drill__primary" onClick={onRestart}>Start again</button>
          )}
        </div>
      </div>
    </section>
  );
}

type RoundAnswer = { example: RapidSwipeExample; choice: boolean; correct: boolean };
const ROUND_MS = 30_000;
/** Timed rounds never invent material: they cycle through the supplied statements. */
function RapidSwipeRound({ examples, onExit }: { examples: readonly RapidSwipeExample[]; onExit: () => void }) {
  type Phase = "answer" | "feedback" | "finished";
  const [phase, setPhase] = useState<Phase>("answer");
  const [remaining, setRemaining] = useState(30);
  const [answers, setAnswers] = useState<RoundAnswer[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<RoundAnswer | null>(null);
  // Mutable clock and phase guard are updated synchronously, before React renders.
  const clock = useRef<{ phase: Phase; left: number; started: number | null }>({
    phase: "answer", left: ROUND_MS, started: document.hidden ? null : performance.now(),
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const swipeStart = useRef<{ id: number; x: number; y: number; element: HTMLDivElement } | null>(null);
  const current = phase === "feedback" && lastAnswer ? lastAnswer.example : examples[answers.length % examples.length];

  const clearSwipe = () => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start) {
      try { if (start.element.hasPointerCapture(start.id)) start.element.releasePointerCapture(start.id); } catch { /* Pointer already ended. */ }
    }
  };
  // Settle the precise elapsed active time, not the rounded display value.
  const settleClock = () => {
    const state = clock.current;
    if (state.started !== null) {
      const now = performance.now();
      state.left = Math.max(0, state.left - Math.max(0, now - state.started));
      state.started = now;
    }
    setRemaining(Math.ceil(state.left / 1000));
    return state.left;
  };
  const finish = () => {
    if (clock.current.phase === "finished") return;
    clock.current.phase = "finished";
    clock.current.started = null;
    clearSwipe();
    setPhase("finished");
  };

  useLayoutEffect(() => { headingRef.current?.focus(); }, []);
  useLayoutEffect(() => {
    if (phase === "feedback") feedbackRef.current?.focus();
    else if (phase === "finished") headingRef.current?.focus();
  }, [phase]);
  useEffect(() => {
    const tick = () => {
      if (clock.current.phase === "answer" && settleClock() <= 0) finish();
    };
    const onVisibilityChange = () => {
      const state = clock.current;
      if (state.phase !== "answer") return;
      if (document.hidden) {
        if (settleClock() <= 0) { finish(); return; }
        state.started = null;
        clearSwipe();
      } else if (state.started === null) {
        state.started = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(tick, 200);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearSwipe();
    };
  }, []);

  const choose = (choice: boolean) => {
    const state = clock.current;
    if (state.phase !== "answer" || document.hidden || state.started === null) return;
    if (settleClock() <= 0) { finish(); return; }
    state.phase = "feedback";
    state.started = null;
    clearSwipe();
    const correct = choice === current.correctAnswer;
    const result = { example: current, choice, correct };
    const nextStreak = correct ? streak + 1 : 0;
    setAnswers(previous => [...previous, result]);
    setStreak(nextStreak);
    setBestStreak(previous => Math.max(previous, nextStreak));
    setLastAnswer(result);
    setPhase("feedback");
  };
  const next = () => {
    const state = clock.current;
    if (state.phase !== "feedback") return;
    state.phase = "answer";
    state.started = document.hidden ? null : performance.now();
    setLastAnswer(null);
    setPhase("answer");
  };
  useLayoutEffect(() => {
    // The first heading is focused on entry; later cards receive focus after Next.
    if (phase === "answer" && answers.length > 0) promptRef.current?.focus();
  }, [phase, answers.length]);
  const onSwipeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (clock.current.phase !== "answer" || document.hidden || swipeStart.current || !event.isPrimary || event.button !== 0 || (event.pointerType !== "touch" && event.pointerType !== "pen")) return;
    const element = event.currentTarget;
    swipeStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY, element };
    try { element.setPointerCapture(event.pointerId); } catch { /* Synthetic event. */ }
  };
  const onSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    clearSwipe();
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy)) choose(dx > 0);
  };
  const onSwipeCancel = (event: PointerEvent<HTMLDivElement>) => { if (swipeStart.current?.id === event.pointerId) clearSwipe(); };
  const correctCount = answers.filter(answer => answer.correct).length;
  return (
    <section className="interactive-drill__activity" aria-labelledby={titleId} onPointerDownCapture={event => {
      if (event.detail > 1) {
        event.preventDefault();
        if (clock.current.phase === "feedback") feedbackRef.current?.focus();
      }
    }} onKeyDown={event => {
      if (event.repeat && (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        if (clock.current.phase === "answer") choose(event.key === "ArrowRight");
      }
    }}>
      <div className="interactive-drill__meta"><span>Rapid Swipe round</span><span className="interactive-drill__pill">Practice · not saved</span></div>
      <div className="interactive-drill__content interactive-drill__round">
        <h2 id={titleId} ref={headingRef} tabIndex={-1}>{phase === "finished" ? "Round complete" : "30-second round"}</h2>
        <p>Time: {remaining}s · Correct: {correctCount}/{answers.length} · Streak: {streak} · Best combo: {bestStreak}</p>
        {phase === "finished" ? <>
          <p role="status">Round complete. {correctCount} correct out of {answers.length} answered. Best combo: {bestStreak}.</p>
          {answers.length > 0 && <><h3>Answer review</h3><ol className="interactive-drill__review">{answers.map((answer, index) => <li key={index}>
            <strong>{answer.example.prompt}</strong><br />
            {answer.correct ? "Correct" : "Not quite"} · Your answer: {answer.choice ? "Yes" : "No"} · Correct answer: {answer.example.correctAnswer ? "Yes" : "No"}. {answer.example.explanation}
          </li>)}</ol></>}
          <button type="button" className="interactive-drill__primary" onClick={onExit}>Back to practice</button>
        </> : <>
          <p className="interactive-drill__instruction">Swipe/keys: ← No · Yes →. Buttons work too. Explanations pause; Next continues. Statements repeat. Course-tab return rechecks access and resets the round.</p>
          <>
            <h3 ref={promptRef} tabIndex={-1}>{current.prompt}</h3>
            {current.instruction && <p>{current.instruction}</p>}
            <div className="interactive-drill__swipe" onPointerDown={onSwipeStart} onPointerUp={onSwipeEnd} onPointerCancel={onSwipeCancel} onLostPointerCapture={onSwipeCancel}>
              <span aria-hidden="true">← No</span><span>Swipe to choose</span><span aria-hidden="true">Yes →</span>
            </div>
            <div className="interactive-drill__options interactive-drill__options--two">
              <button type="button" disabled={phase !== "answer"} onClick={event => { if (event.detail <= 1) choose(false); }}>No</button><button type="button" disabled={phase !== "answer"} onClick={event => { if (event.detail <= 1) choose(true); }}>Yes</button>
            </div>
          </>
          <div ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="interactive-drill__feedback-region">
            {lastAnswer && <div className={`interactive-drill__feedback ${lastAnswer.correct ? "is-correct" : "is-incorrect"}`}><strong>{lastAnswer.correct ? "Correct" : "Not quite"}</strong><span>Correct answer: {lastAnswer.example.correctAnswer ? "Yes" : "No"}. {lastAnswer.example.explanation}</span><span>Timer paused. Choose Next to continue.</span></div>}
          </div>
          {phase === "feedback" && <button type="button" className="interactive-drill__primary interactive-drill__round-next" onClick={event => { if (event.detail <= 1) next(); }}>Next →</button>}
          <button type="button" className="interactive-drill__secondary interactive-drill__round-end" onClick={() => { if (clock.current.phase === "answer") settleClock(); finish(); }}>End round</button>
        </>}
      </div>
    </section>
  );
}

/** A local-only practice UI. Switching activities resets their temporary state. */
export function InteractiveDrill({ examples, className }: InteractiveDrillProps) {
  const availableModes = MODES.filter(mode => examples.some(example => example.mode === mode.id));
  const [requestedMode, setRequestedMode] = useState<DrillMode | null>(null);
  const [requestedIndex, setRequestedIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState(false);
  const headingFocusRequested = useRef(false);
  const activeMode = availableModes.find(mode => mode.id === requestedMode) ?? availableModes[0];
  const modeExamples = activeMode ? examples.filter(example => example.mode === activeMode.id) : [];
  const index = Math.min(requestedIndex, Math.max(0, modeExamples.length - 1));
  const example = modeExamples[index];

  const chooseMode = (mode: DrillMode) => {
    headingFocusRequested.current = true;
    setRound(false);
    setRequestedMode(mode);
    setRequestedIndex(0);
    setAttempt(value => value + 1);
  };
  const changeIndex = (next: number) => {
    headingFocusRequested.current = true;
    setRequestedIndex(next);
    setAttempt(value => value + 1);
  };
  const focusHeadingIfRequested = (heading: HTMLHeadingElement | null) => {
    if (headingFocusRequested.current && heading) {
      headingFocusRequested.current = false;
      heading.focus();
    }
  };

  return (
    <div className={["interactive-drill", className].filter(Boolean).join(" ")}>
      {availableModes.length === 0 || !example ? (
        <p className="interactive-drill__empty">No practice activities are available yet.</p>
      ) : (
        <div className="interactive-drill__layout">
          <nav className="interactive-drill__nav" aria-label="Choose a practice mode">
            {availableModes.map(mode => (
              <button type="button" key={mode.id} className={mode.id === activeMode.id ? "is-active" : ""} aria-current={mode.id === activeMode.id ? "true" : undefined} onClick={() => chooseMode(mode.id)}>
                <span>{mode.label}</span><small>{mode.description}</small>
              </button>
            ))}
          </nav>
          {round && activeMode.id === "rapid-swipe" ? (
            <RapidSwipeRound key={JSON.stringify(modeExamples)} examples={modeExamples.filter((item): item is RapidSwipeExample => item.mode === "rapid-swipe")} onExit={() => { setRound(false); changeIndex(0); }} />
          ) : (
            <Activity key={`${example.id}-${attempt}`} example={example} index={index} count={modeExamples.length} onPrevious={() => changeIndex(index - 1)} onNext={() => changeIndex(index + 1)} onRestart={() => changeIndex(0)} onStartRound={() => setRound(true)} focusHeadingIfRequested={focusHeadingIfRequested} />
          )}
        </div>
      )}
    </div>
  );
}

export default InteractiveDrill;
