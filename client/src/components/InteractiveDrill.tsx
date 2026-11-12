import { useId, useLayoutEffect, useRef, useState } from "react";
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

export interface BeforeAfterExample extends DrillBase {
  mode: "before-after";
  correctAnswer: "before" | "after";
  explanation: string;
}

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

function isValidExample(example: DrillExample): boolean {
  if (example.mode === "speed-match") {
    return example.pairs.length >= 2 && new Set(example.pairs.map(pair => pair.id)).size === example.pairs.length;
  }
  if (example.mode === "rapid-swipe" || example.mode === "before-after") return true;
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
  focusHeadingIfRequested: (heading: HTMLHeadingElement | null) => void;
}

function Activity({ example, index, count, onPrevious, onNext, onRestart, focusHeadingIfRequested }: ActivityProps) {
  const titleId = useId();
  const instructionId = useId();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answered, setAnswered] = useState(false);
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
    if (answered) return;
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
        <h2 id={titleId} ref={headingRef} tabIndex={-1}>{example.prompt}</h2>
        <p id={instructionId} className="interactive-drill__instruction">
          {example.instruction || (example.mode === "rapid-swipe"
            ? "Swipe left for No or right for Yes, or choose a button."
            : example.mode === "speed-match"
              ? "Choose one item from each column to make a pair."
              : "Choose one answer.")}
        </p>
        {!valid ? (
          <p className="interactive-drill__invalid" role="status">This activity is unavailable because its choices or pairs are incomplete.</p>
        ) : example.mode === "rapid-swipe" ? (
          <>
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
          <div className="interactive-drill__options interactive-drill__options--two" aria-describedby={instructionId}>
            {(["before", "after"] as const).map(choice => (
              <button key={choice} type="button" disabled={answered} onClick={() => answer(choice === example.correctAnswer, example.correctAnswer === "before" ? "Before" : "After", example.explanation)}>{choice === "before" ? "Before" : "After"}</button>
            ))}
          </div>
        ) : (
          <div className="interactive-drill__options" aria-describedby={instructionId}>
            {example.options.map(option => (
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

/** A local-only practice UI. Switching activities resets their temporary state. */
export function InteractiveDrill({ examples, className }: InteractiveDrillProps) {
  const availableModes = MODES.filter(mode => examples.some(example => example.mode === mode.id));
  const [requestedMode, setRequestedMode] = useState<DrillMode | null>(null);
  const [requestedIndex, setRequestedIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const headingFocusRequested = useRef(false);
  const activeMode = availableModes.find(mode => mode.id === requestedMode) ?? availableModes[0];
  const modeExamples = activeMode ? examples.filter(example => example.mode === activeMode.id) : [];
  const index = Math.min(requestedIndex, Math.max(0, modeExamples.length - 1));
  const example = modeExamples[index];

  const chooseMode = (mode: DrillMode) => {
    headingFocusRequested.current = true;
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
          <Activity key={`${example.id}-${attempt}`} example={example} index={index} count={modeExamples.length} onPrevious={() => changeIndex(index - 1)} onNext={() => changeIndex(index + 1)} onRestart={() => changeIndex(0)} focusHeadingIfRequested={focusHeadingIfRequested} />
        </div>
      )}
    </div>
  );
}

export default InteractiveDrill;
