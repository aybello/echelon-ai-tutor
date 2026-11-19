import type { DeepTask } from "./deepGames";
import { deepNumericObservationDescriptorSchema, compareNumericAnswer, parseNumericAlias } from "./deepGameNumeric";

/** These aliases are original authored positions, never shuffled display indexes. */
export function deepTaskStepIds(task: DeepTask): string[] {
  switch (task.mode) {
    case "calculation-ladder": return ["formula", "units", "substitution", "result"];
    case "build-process": return task.correctOrder.map((_, index) => `slot:${index}`);
    case "find-calculation-error": return ["first-error"];
    case "evidence-detective": return ["inference", "next-clue"];
  }
}

/** Valid means an issued option/line/unit was actually committed; incorrect answers remain valid attempts. */
function validDeepAnswer(task: DeepTask, stepId: string, chosenAnswer: unknown): chosenAnswer is string {
  if (typeof chosenAnswer !== "string") return false;
  switch (task.mode) {
    case "calculation-ladder": {
      if (stepId === "result") {
        const answer = parseNumericAlias(chosenAnswer);
        return !!answer && task.result.unitOptions.some(unit => unit.id === answer.unitId);
      }
      return task.choices.some(step => step.id === stepId && step.options.some(option => option.id === chosenAnswer));
    }
    case "build-process": return deepTaskStepIds(task).includes(stepId) && task.cards.some(card => card.id === chosenAnswer);
    case "find-calculation-error": return stepId === "first-error" && task.lines.some(line => line.id === chosenAnswer);
    case "evidence-detective": {
      const step = stepId === "inference" ? task.inference : stepId === "next-clue" ? task.nextClue : undefined;
      return !!step?.options.some(option => option.id === chosenAnswer);
    }
  }
}

/** Pure local practice scoring, not a canonical server result or evidence of learner identity. */
export function scoreDeepStep(task: DeepTask, stepId: string, chosenAnswer: string): boolean {
  if (!validDeepAnswer(task, stepId, chosenAnswer)) return false;
  switch (task.mode) {
    case "calculation-ladder": {
      if (stepId === "result") {
        const answer = parseNumericAlias(chosenAnswer)!;
        return compareNumericAnswer(task.result, answer.value, answer.unitId);
      }
      return task.choices.find(step => step.id === stepId)?.correctOptionId === chosenAnswer;
    }
    case "build-process": return task.correctOrder[deepTaskStepIds(task).indexOf(stepId)] === chosenAnswer;
    case "find-calculation-error": return task.firstWrongLineId === chosenAnswer;
    case "evidence-detective": return (stepId === "inference" ? task.inference : task.nextClue).correctOptionId === chosenAnswer;
  }
}

export type DeepTaskScore = {
  complete: boolean;
  correct: boolean;
  steps: Array<{ id: string; answered: boolean; correct: boolean }>;
};

/** Completion is distinct from correctness. A fully populated incorrect permutation is complete,
 * but missing/duplicate cards are not. Call separately with first-attempt and latest-answer maps.
 */
export function scoreDeepTask(task: DeepTask, answers: Readonly<Record<string, string>>): DeepTaskScore {
  const steps = deepTaskStepIds(task).map(id => {
    const answer = Object.hasOwn(answers, id) ? answers[id] : undefined;
    const answered = validDeepAnswer(task, id, answer);
    return { id, answered, correct: answered && scoreDeepStep(task, id, answer) };
  });
  let complete = steps.every(step => step.answered);
  if (task.mode === "build-process") complete = complete && new Set(steps.map(step => answers[step.id])).size === task.cards.length;
  return { complete, correct: complete && steps.every(step => step.correct), steps };
}

/** Explicit allowlist projection for observation snapshots, never spreads expected values/keys. */
export function deepNumericObservationDescriptor(task: Extract<DeepTask, { mode: "calculation-ladder" }>) {
  return deepNumericObservationDescriptorSchema.parse({
    kind: "numeric", unitOptions: task.result.unitOptions.map(({ id, label }) => ({ id, label })),
  });
}
