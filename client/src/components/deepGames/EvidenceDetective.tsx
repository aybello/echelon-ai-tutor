import type { EvidenceTask } from "@shared/deepGames";
import { scoreDeepStep } from "@shared/scoreDeepGame";
import { ChoiceDecision, type DeepTaskInteraction } from "./deepGameUI";

export type EvidenceDetectiveProps = DeepTaskInteraction & { task: EvidenceTask };

export function EvidenceDetective({ task, ...interaction }: EvidenceDetectiveProps) {
  const nextClueAnswer = interaction.progress.answers["next-clue"];
  return <section aria-label="Fictional evidence case">
    <p className="deep-games__muted">Fictional exam-practice case, not instructions for operating a plant. Choose the best-supported inference, not a claim of certainty.</p>
    <h3>Available observations</h3>
    <ul className="deep-games__observations">{task.evidence.map(item => <li key={item.id}>{item.label}</li>)}</ul>
    <ChoiceDecision key="inference" step={task.inference} correct={scoreDeepStep(task, "inference", interaction.progress.answers.inference)} {...interaction} />
    <ChoiceDecision key="next-clue" step={task.nextClue} correct={scoreDeepStep(task, "next-clue", nextClueAnswer)} {...interaction}>
      {nextClueAnswer && <p><strong>Your requested clue:</strong> {task.clueText[nextClueAnswer]}</p>}
    </ChoiceDecision>
  </section>;
}
