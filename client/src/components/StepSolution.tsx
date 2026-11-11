// ECHELON AI TUTOR — data-driven worked solution
import { normalizeQuestionSteps } from "@shared/questionSteps";

interface Props {
  steps: unknown;
  tip?: string;
}

export default function StepSolution({ steps, tip }: Props) {
  const normalizedSteps = normalizeQuestionSteps(steps);
  return (
    <section className="practice-solution" aria-label="Step-by-step solution">
      <h3>Step-by-step solution</h3>
      {normalizedSteps.length === 0 ? (
        <p className="practice-solution-empty">Worked solution steps are unavailable for this question.</p>
      ) : (
        <ol className="practice-solution-list" role="list">
          {normalizedSteps.map((step, index) => (
            <li key={index} className="practice-solution-step" role="listitem">
              <span className="practice-solution-number" aria-hidden="true">{index + 1}</span>
              <div>
                {step.l && <div className="practice-solution-label">{step.l}</div>}
                <div className="practice-solution-body">{step.c}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {tip && <p className="practice-solution-tip"><strong>Tip:</strong> {tip}</p>}
    </section>
  );
}
