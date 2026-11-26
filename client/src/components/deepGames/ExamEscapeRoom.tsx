import type { DeepTask, DeepTaskOccurrence, EscapeMission } from "@shared/deepGames";
import { CalculationLadder } from "./CalculationLadder";
import { BuildProcess } from "./BuildProcess";
import { FindCalculationError } from "./FindCalculationError";
import { EvidenceDetective } from "./EvidenceDetective";
import type { DeepTaskInteraction } from "./deepGameUI";

export const deepTaskTitles: Record<DeepTask["mode"], string> = {
  "calculation-ladder": "Calculation Ladder",
  "build-process": "Build the Process",
  "find-calculation-error": "Find the Calculation Error",
  "evidence-detective": "Evidence Detective",
};

/** Both ordinary rounds and missions use this exact renderer and the shared pure checkers. */
export function DeepTaskRenderer({ task, ...interaction }: DeepTaskInteraction & { task: DeepTask }) {
  switch (task.mode) {
    case "calculation-ladder": return <CalculationLadder task={task} {...interaction} />;
    case "build-process": return <BuildProcess task={task} {...interaction} />;
    case "find-calculation-error": return <FindCalculationError task={task} {...interaction} />;
    case "evidence-detective": return <EvidenceDetective task={task} {...interaction} />;
  }
}

export type ExamEscapeRoomProps = DeepTaskInteraction & {
  mission: EscapeMission;
  occurrences: readonly DeepTaskOccurrence[];
  stageIndex: number;
};

export function ExamEscapeRoom({ mission, occurrences, stageIndex, ...interaction }: ExamEscapeRoomProps) {
  const current = occurrences[stageIndex];
  return <section aria-label={mission.title}>
    <p className="deep-games__context"><strong>{mission.title}</strong> · Complete every required stage. This mission does not lock or unlock other practice games.</p>
    <ol className="deep-games__stages" aria-label="Mission stages">{occurrences.map((occurrence, index) => <li key={occurrence.id} aria-current={index === stageIndex ? "step" : undefined}>
      <span>Stage {index + 1}: {deepTaskTitles[occurrence.task.mode]}</span><small>{index < stageIndex ? "Completed" : index === stageIndex ? "Current stage" : "Not started"}</small>
    </li>)}</ol>
    {current && <DeepTaskRenderer key={current.id} task={current.task} {...interaction} />}
  </section>;
}
