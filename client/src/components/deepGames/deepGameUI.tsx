import { useId, useState } from "react";
import type { ChoiceStep } from "@shared/deepGames";

/** Live delivery state only. First answers are never replaced by a retry. */
export type DeepTaskProgress = {
  firstAnswers: Record<string, string>;
  answers: Record<string, string>;
  retrySteps: string[];
  explanations: string[];
  retries: number;
};
export type DeepTaskInteraction = {
  progress: DeepTaskProgress;
  onCheck: (answers: Readonly<Record<string, string>>) => void;
  onRetry: (stepIds: readonly string[]) => void;
  onExplanation: (stepId: string) => void;
};
export const emptyDeepProgress = (): DeepTaskProgress => ({ firstAnswers: {}, answers: {}, retrySteps: [], explanations: [], retries: 0 });
export const hasAnswer = (answers: Readonly<Record<string, string>>, id: string) => Object.hasOwn(answers, id);
export const isChecked = (progress: DeepTaskProgress, id: string) => hasAnswer(progress.answers, id) && !progress.retrySteps.includes(id);

export function Explanation({ stepId, progress, onExplanation, children }: Pick<DeepTaskInteraction, "progress" | "onExplanation"> & { stepId: string; children: React.ReactNode }) {
  const contentId = useId();
  const open = progress.explanations.includes(stepId);
  return <div className="deep-games__explanation">
    <button type="button" className="deep-games__secondary" aria-expanded={open} aria-controls={open ? contentId : undefined} onClick={() => onExplanation(stepId)} disabled={open}>
      {open ? "Explanation opened" : "Show explanation"}
    </button>
    {open && <div id={contentId} className="deep-games__worked">{children}</div>}
  </div>;
}

/** A choice is not an answer until Check is pressed. No expected label is rendered beforehand. */
export function ChoiceDecision({ step, progress, onCheck, onRetry, onExplanation, correct, children }: DeepTaskInteraction & { step: ChoiceStep; correct: boolean; children?: React.ReactNode }) {
  const groupId = useId();
  const feedbackId = useId();
  const [selected, setSelected] = useState("");
  const checked = isChecked(progress, step.id);
  const selectedAnswer = checked ? progress.answers[step.id] : selected;
  const firstCorrect = progress.firstAnswers[step.id] === step.correctOptionId;
  return <fieldset className="deep-games__decision" aria-describedby={checked ? feedbackId : undefined}>
    <legend>{step.prompt}</legend>
    <div className="deep-games__choices">
      {step.options.map(option => <label key={option.id} className={`deep-games__choice${selectedAnswer === option.id ? " is-selected" : ""}`}>
        <input type="radio" name={groupId} value={option.id} checked={selectedAnswer === option.id} disabled={checked} onChange={() => setSelected(option.id)} />
        <span>{option.label}</span>
      </label>)}
    </div>
    {!checked && <button type="button" className="deep-games__primary" disabled={!selected} onClick={() => onCheck({ [step.id]: selected })}>Check answer</button>}
    {checked && <div id={feedbackId} className={`deep-games__feedback${correct ? "" : " is-incorrect"}`} role="status" aria-live="polite">
      <p><strong>{correct ? "Correct." : "Not correct yet."}</strong> {firstCorrect ? "Correct on your first check." : correct ? "Correct after retry; your first answer is preserved." : "Review the explanation, then try this decision again."}</p>
      {children}
      <Explanation stepId={step.id} progress={progress} onExplanation={onExplanation}><p>{step.explanation}</p></Explanation>
      {!correct && <button type="button" className="deep-games__secondary" onClick={() => onRetry([step.id])}>Try again</button>}
    </div>}
  </fieldset>;
}
