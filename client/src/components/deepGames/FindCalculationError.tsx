import type { ErrorTask } from "@shared/deepGames";
import { scoreDeepStep } from "@shared/scoreDeepGame";
import { ChoiceDecision, type DeepTaskInteraction } from "./deepGameUI";

export type FindCalculationErrorProps = DeepTaskInteraction & { task: ErrorTask };

export function FindCalculationError({ task, ...interaction }: FindCalculationErrorProps) {
  const step = { id: "first-error", prompt: "Select the first wrong line in the displayed working.", options: task.lines.map((line, index) => ({ id: line.id, label: `Line ${index + 1}: ${line.label}` })), correctOptionId: task.firstWrongLineId, explanation: task.explanation };
  const correct = scoreDeepStep(task, "first-error", interaction.progress.answers["first-error"]);
  return <div>
    <p className="deep-games__muted">Read from top to bottom. A later line may carry forward an earlier mistake; identify where the working first becomes wrong.</p>
    <ChoiceDecision step={step} correct={correct} {...interaction}>
      <p><strong>Corrected first-error line:</strong> {task.correctedLine}</p>
    </ChoiceDecision>
  </div>;
}
