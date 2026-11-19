import { useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ChevronDown, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { getCourseByKey } from "@shared/courseRegistry";
import { ECHELON_LOGO_URL } from "@/components/SiteNav";
import StepSolution from "@/components/StepSolution";
import "./HomepageProductDemo.css";

const CLASS_ONE_COURSE = getCourseByKey("class1-water");
const WORKED_STEPS = [
  { l: "Relationship", c: "Q (m³/d) = Q (L/s) × 86.4" },
  { l: "Substitution", c: "Q = 25 × 86.4" },
  { l: "Result", c: "2,160 m³/d" },
];

type Feedback = { kind: "invalid" | "incorrect" | "correct"; message: string };

/** A self-contained example: no requests, saved learning records, or tracking. */
export default function HomepageProductDemo() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [firstIncorrect, setFirstIncorrect] = useState<string | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entered = answer.trim();
    // Accept plain decimals and correctly grouped thousands, never expressions.
    const numeric = /^[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)$/;
    const value = Number(entered.replaceAll(",", ""));
    if (!numeric.test(entered) || !Number.isFinite(value)) {
      setFeedback({ kind: "invalid", message: "Enter a number, with or without thousands commas." });
      return;
    }
    if (value === 2160) {
      setFeedback({ kind: "correct", message: "Correct. 25 × 86.4 = 2,160 m³/d." });
      return;
    }
    setFirstIncorrect(previous => previous ?? entered);
    setFeedback({
      kind: "incorrect",
      message: "Not quite. Use 86.4 to convert L/s to m³/d. Edit your answer and try again.",
    });
  }

  function resetExample() {
    setAnswer("");
    setFeedback(null);
    setFirstIncorrect(null);
    setSolutionOpen(false);
    inputRef.current?.focus();
  }

  return (
    <aside className="homepage-product-demo" aria-labelledby={`${id}-title`}>
      <div className="homepage-product-demo__topbar">
        <span className="homepage-product-demo__brand">
          <img src={ECHELON_LOGO_URL} alt="" width={28} height={28} />
          <span>Echelon Institute</span>
        </span>
        <button type="button" className="homepage-product-demo__reset" onClick={resetExample}>
          <RotateCcw size={13} aria-hidden="true" /> Reset
        </button>
      </div>

      <div className="homepage-product-demo__body">
        <p className="homepage-product-demo__eyebrow">Interactive example · Water Class 1</p>
        <h2 id={`${id}-title`}>Convert plant flow to daily volume</h2>
        <p className="homepage-product-demo__question" id={`${id}-question`}>
          A plant treats <strong>25 L/s</strong>. What is the daily flow in m³/d?
        </p>

        <form onSubmit={checkAnswer} noValidate>
          <label className="homepage-product-demo__label" htmlFor={`${id}-answer`}>Your answer (m³/d)</label>
          <div className="homepage-product-demo__answer-row">
            <div className="homepage-product-demo__input-wrap">
              <input
                ref={inputRef}
                id={`${id}-answer`}
                name="daily-flow-answer"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                maxLength={40}
                value={answer}
                placeholder="Enter a number"
                aria-describedby={`${id}-question ${id}-feedback`}
                aria-invalid={feedback?.kind === "invalid" || feedback?.kind === "incorrect"}
                onChange={event => { setAnswer(event.target.value); setFeedback(null); }}
              />
              <span aria-hidden="true">m³/d</span>
            </div>
            <button type="submit" className="homepage-product-demo__check">Check answer</button>
          </div>
          <div
            id={`${id}-feedback`}
            className="homepage-product-demo__feedback"
            data-state={feedback?.kind ?? "idle"}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {feedback ? <p>{feedback.message}</p> : <p>Try it here. No account needed; this example isn’t saved.</p>}
          </div>
          {firstIncorrect !== null && (
            <p className="homepage-product-demo__first-attempt">First checked answer: {firstIncorrect} m³/d (incorrect).</p>
          )}
        </form>

        <button
          type="button"
          className="homepage-product-demo__solution-toggle"
          aria-expanded={solutionOpen}
          aria-controls={`${id}-solution`}
          onClick={() => setSolutionOpen(open => !open)}
        >
          {solutionOpen ? "Hide worked solution" : "Show worked solution"}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        <div id={`${id}-solution`} hidden={!solutionOpen}>
          {solutionOpen && <StepSolution steps={WORKED_STEPS} tip="1 L/s = 86.4 m³/d." />}
        </div>
      </div>

      <div className="homepage-product-demo__footer">
        {CLASS_ONE_COURSE && (
          <Link href={CLASS_ONE_COURSE.quizPath} className="homepage-product-demo__course-link">
            Try Class 1 Water practice <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
        <Link href="/courses/oit/interactive" className="homepage-product-demo__games-link">Explore Water OIT games</Link>
      </div>
    </aside>
  );
}
