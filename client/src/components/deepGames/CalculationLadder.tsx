import { useId, useRef, useState } from "react";
import type { LadderTask } from "@shared/deepGames";
import { encodeNumericAlias } from "@shared/deepGameNumeric";
import { scoreDeepStep } from "@shared/scoreDeepGame";
import { ChoiceDecision, Explanation, hasAnswer, isChecked, type DeepTaskInteraction } from "./deepGameUI";

export type CalculationLadderProps = DeepTaskInteraction & { task: LadderTask };

export function CalculationLadder({ task, ...interaction }: CalculationLadderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const choice = task.choices[stepIndex];
  const currentId = choice?.id ?? "result";
  const correct = hasAnswer(interaction.progress.answers, currentId) && scoreDeepStep(task, currentId, interaction.progress.answers[currentId]);
  return <div>
    <h3 ref={heading} tabIndex={-1} className="deep-games__step-heading">Step {stepIndex + 1} of 4 · { ["Formula", "Units", "Substitution", "Result"][stepIndex]}</h3>
    {choice ? <ChoiceDecision key={choice.id} step={choice} correct={correct} {...interaction} /> : <NumericResult task={task} {...interaction} />}
    {choice && <button type="button" className="deep-games__primary deep-games__continue" disabled={!correct || !isChecked(interaction.progress, currentId)} onClick={() => { setStepIndex(index => index + 1); queueMicrotask(() => heading.current?.focus()); }}>Next step</button>}
  </div>;
}

function NumericResult({ task, progress, onCheck, onRetry, onExplanation }: CalculationLadderProps) {
  const numberId = useId();
  const unitId = useId();
  const helpId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const checked = isChecked(progress, "result");
  const correct = checked && scoreDeepStep(task, "result", progress.answers.result);
  const check = () => {
    const alias = encodeNumericAlias(value, unit);
    if (!unit) { setError("Choose a unit before checking your result."); return; }
    if (!alias) { setError("Enter a decimal such as 12 or -0.25: up to 18 whole-number digits and 12 decimal places, 32 characters maximum. Do not use spaces, leading zeros, a plus sign, commas, exponents or expressions."); return; }
    setError("");
    onCheck({ result: alias });
  };
  return <fieldset className="deep-games__decision">
    <legend>{task.result.prompt}</legend>
    <p id={helpId} className="deep-games__muted">Use the units and precision requested above. Enter only the number in the result field; choose its unit separately.</p>
    <div className="deep-games__numeric">
      <label htmlFor={numberId}>Numeric result<input id={numberId} type="text" inputMode="decimal" maxLength={32} value={value} disabled={checked} aria-invalid={!!error} aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`} onChange={event => { setValue(event.target.value); setError(""); }} /></label>
      <label htmlFor={unitId}>Result unit<select id={unitId} value={unit} disabled={checked} onChange={event => { setUnit(event.target.value); setError(""); }}><option value="">Choose a unit</option>{task.result.unitOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
    </div>
    {error && <p id={errorId} role="alert" className="deep-games__validation">{error}</p>}
    {!checked && <button type="button" className="deep-games__primary" onClick={check}>Check result</button>}
    {checked && <div className={`deep-games__feedback${correct ? "" : " is-incorrect"}`} role="status" aria-live="polite">
      <p><strong>{correct ? "Correct result." : "Not correct yet."}</strong> {correct && scoreDeepStep(task, "result", progress.firstAnswers.result) ? "Correct on your first check." : correct ? "Correct after retry; your first result is preserved." : "Check the quantities, units and calculation, then retry."}</p>
      <Explanation stepId="result" progress={progress} onExplanation={onExplanation}><p>{task.result.explanation}</p></Explanation>
      {!correct && <button type="button" className="deep-games__secondary" onClick={() => onRetry(["result"])}>Try again</button>}
    </div>}
  </fieldset>;
}
