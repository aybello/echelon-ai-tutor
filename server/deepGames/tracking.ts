import {
  assessmentActivityIssueSchema,
  type AssessmentActivityIssue,
  type AssessmentActivityItem,
} from "../../shared/assessmentActivity";
import { deepSessionResponseSchema, type DeepSessionResponse } from "../../shared/deepGames";

/** Original authored aliases, never shuffled display positions. This is not a scoring manifest. */
export function deepAssessmentIssue(delivered: DeepSessionResponse): AssessmentActivityIssue {
  const session = deepSessionResponseSchema.parse(delivered);
  return assessmentActivityIssueSchema.parse({
    courseKey: session.courseKey,
    mode: session.mode,
    timed: false,
    sourceSessionId: session.sessionId,
    items: session.tasks.map(occurrence => {
      const task = occurrence.task;
      const context = [task.prompt, `Assumptions: ${task.assumptions}`];
      const item: AssessmentActivityItem = {
        id: occurrence.id,
        title: `${session.mode} · ${occurrence.sourceId}@${task.revision} · content version ${session.version}${session.mission ? ` · ${session.mission.title}` : ""}`,
        prompt: "",
        topic: task.topicId,
        options: [],
        steps: [],
      };
      const choices = (options: ReadonlyArray<{ id: string; label: string }>) =>
        options.map(option => ({ id: option.id, text: option.label }));
      switch (task.mode) {
        case "calculation-ladder":
          item.steps = task.choices.map(step => ({ id: step.id, label: step.prompt, options: choices(step.options) }));
          item.steps.push({
            id: "result", label: task.result.prompt, options: [],
            response: { kind: "numeric", unitOptions: task.result.unitOptions.map(({ id, label }) => ({ id, label })) },
          });
          break;
        case "build-process":
          context.push(`Stated configuration: ${task.configuration}`);
          item.steps = task.cards.map((_, index) => ({ id: `slot:${index}`, label: `Position ${index + 1}`, options: choices(task.cards) }));
          break;
        case "find-calculation-error":
          item.steps = [{ id: "first-error", label: "Select the first incorrect working line", options: choices(task.lines) }];
          break;
        case "evidence-detective":
          context.push("Initial observations:", ...task.evidence.map(evidence => evidence.label));
          item.steps = [task.inference, task.nextClue].map(step => ({ id: step.id, label: step.prompt, options: choices(step.options) }));
          break;
      }
      item.prompt = context.join("\n");
      return item;
    }),
  });
}
