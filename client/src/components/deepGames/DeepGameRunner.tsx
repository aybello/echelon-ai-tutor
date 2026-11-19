import { useEffect, useRef, useState } from "react";
import type { AssessmentActivityEvent } from "@shared/assessmentActivity";
import type { DeepSessionResponse } from "@shared/deepGames";
import { deepTaskStepIds, scoreDeepStep, scoreDeepTask } from "@shared/scoreDeepGame";
import { DeepTaskRenderer, ExamEscapeRoom, deepTaskTitles } from "./ExamEscapeRoom";
import { emptyDeepProgress, hasAnswer, isChecked, type DeepTaskProgress } from "./deepGameUI";
import "./DeepGames.css";

export type DeepGameActivity = Omit<AssessmentActivityEvent, "eventId" | "sequence">;
export type DeepGameRunnerProps = {
  /** One validated, server-selected delivery. A different sessionId resets all local state. */
  session: DeepSessionResponse;
  /** Parent owns consent, stable actor, original capability and the existing tracking hook. */
  onActivity?: (event: DeepGameActivity) => void;
  /** Must request a fresh server delivery, never replay a completed capability. */
  onNewRound: () => void;
};

export function DeepGameRunner(props: DeepGameRunnerProps) {
  return <DeepGameDelivery key={props.session.sessionId} {...props} />;
}

function DeepGameDelivery({ session, onActivity, onNewRound }: DeepGameRunnerProps) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [progress, setProgress] = useState<Record<string, DeepTaskProgress>>({});
  const progressRef = useRef(progress);
  const [finished, setFinished] = useState(false);
  const [requestedRound, setRequestedRound] = useState(false);
  const requestedRoundRef = useRef(false);
  const completed = useRef(false);
  const started = useRef(false);
  const presented = useRef(new Set<string>());
  const heading = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);
  // Bind observations to this delivery. Retained handlers cannot adopt a newer callback/capability.
  const observe = useRef(onActivity);
  const emit = (event: DeepGameActivity) => { try { observe.current?.(event); } catch { /* Observation failure must never stop practice. */ } };
  const current = session.tasks[index];
  const state = progress[current?.id] ?? emptyDeepProgress();
  const currentCorrect = !!current && scoreDeepTask(current.task, state.answers).correct;
  const allCorrect = () => session.tasks.length > 0 && session.tasks.every(occurrence => scoreDeepTask(occurrence.task, progressRef.current[occurrence.id]?.answers ?? {}).correct);
  const saveProgress = (itemId: string, next: DeepTaskProgress) => {
    const update = { ...progressRef.current, [itemId]: next };
    progressRef.current = update;
    setProgress(update);
  };

  useEffect(() => {
    if (!current || completed.current) return;
    if (!started.current) { started.current = true; emit({ action: "started" }); }
    if (!presented.current.has(current.id)) { presented.current.add(current.id); emit({ action: "item_presented", itemId: current.id }); }
    if (focusNext.current) { focusNext.current = false; heading.current?.focus(); }
  }, [current?.id]);
  useEffect(() => { if (finished) heading.current?.focus(); }, [finished]);

  if (!current) return <div className="deep-games"><p role="status">No tasks were delivered for this round. Choose a new round to try again.</p><button type="button" className="deep-games__primary" onClick={onNewRound}>New round</button></div>;

  const onCheck = (answers: Readonly<Record<string, string>>) => {
    if (completed.current || requestedRoundRef.current || indexRef.current !== index) return;
    const old = progressRef.current[current.id] ?? emptyDeepProgress();
    const allowed = deepTaskStepIds(current.task);
    const entries = Object.entries(answers);
    if (!entries.length || entries.some(([id]) => !allowed.includes(id) || isChecked(old, id))) return;
    const result = scoreDeepTask(current.task, { ...old.answers, ...answers });
    if (entries.some(([id]) => !result.steps.find(step => step.id === id)?.answered)) return;
    if (current.task.mode === "build-process" && (!result.complete || entries.length !== allowed.length)) return;
    const next: DeepTaskProgress = { ...old, answers: { ...old.answers, ...answers }, firstAnswers: { ...old.firstAnswers }, retrySteps: old.retrySteps.filter(id => !hasAnswer(answers, id)) };
    for (const [stepId, chosenAnswer] of entries) {
      if (!hasAnswer(next.firstAnswers, stepId)) next.firstAnswers[stepId] = chosenAnswer;
    }
    saveProgress(current.id, next);
    for (const [stepId, chosenAnswer] of entries) emit({ action: "step_answer", itemId: current.id, stepId, chosenAnswer, observedCorrect: scoreDeepStep(current.task, stepId, chosenAnswer) });
  };
  const onRetry = (stepIds: readonly string[]) => {
    if (completed.current || requestedRoundRef.current || indexRef.current !== index) return;
    const old = progressRef.current[current.id] ?? emptyDeepProgress();
    const ids = [...new Set(stepIds)];
    if (!ids.length || scoreDeepTask(current.task, old.answers).correct || ids.some(id => !deepTaskStepIds(current.task).includes(id) || !isChecked(old, id))) return;
    saveProgress(current.id, { ...old, retrySteps: [...old.retrySteps, ...ids], retries: old.retries + 1 });
    for (const stepId of ids) emit({ action: "retry", itemId: current.id, stepId });
  };
  const onExplanation = (stepId: string) => {
    if (completed.current || requestedRoundRef.current || indexRef.current !== index) return;
    const old = progressRef.current[current.id] ?? emptyDeepProgress();
    if (!isChecked(old, stepId) || old.explanations.includes(stepId)) return;
    saveProgress(current.id, { ...old, explanations: [...old.explanations, stepId] });
    emit({ action: "explanation_opened", itemId: current.id, stepId });
  };
  const next = () => {
    if (completed.current || indexRef.current !== index || !scoreDeepTask(current.task, progressRef.current[current.id]?.answers ?? {}).correct) return;
    focusNext.current = true;
    indexRef.current = Math.min(index + 1, session.tasks.length - 1);
    setIndex(indexRef.current);
  };
  const finish = () => {
    if (completed.current || !allCorrect()) return;
    completed.current = true;
    emit({ action: "completed" });
    setFinished(true);
  };
  const newRound = () => {
    if (requestedRoundRef.current) return;
    requestedRoundRef.current = true;
    setRequestedRound(true);
    onNewRound();
  };
  const interaction = { progress: state, onCheck, onRetry, onExplanation };
  const firstCorrectSteps = session.tasks.reduce((sum, occurrence) => sum + scoreDeepTask(occurrence.task, progress[occurrence.id]?.firstAnswers ?? {}).steps.filter(step => step.correct).length, 0);
  const eventualCorrectSteps = session.tasks.reduce((sum, occurrence) => sum + scoreDeepTask(occurrence.task, progress[occurrence.id]?.answers ?? {}).steps.filter(step => step.correct).length, 0);
  const totalSteps = session.tasks.reduce((sum, occurrence) => sum + deepTaskStepIds(occurrence.task).length, 0);
  const retries = Object.values(progress).reduce((sum, item) => sum + item.retries, 0);

  return <article className="deep-games" aria-label={session.mode === "exam-escape-room" ? "Exam Escape Room" : deepTaskTitles[current.task.mode]}>
    <div className="deep-games__meta"><span>{session.mode === "exam-escape-room" ? "Exam Escape Room" : deepTaskTitles[current.task.mode]}</span><span>{finished ? "Round complete" : `${session.mode === "exam-escape-room" ? "Stage" : "Task"} ${index + 1} of ${session.tasks.length}`}</span></div>
    {finished ? <section aria-label="Practice round summary">
      <h2 ref={heading} tabIndex={-1}>Practice round complete</h2>
      <dl className="deep-games__summary"><div><dt>Correct on first check</dt><dd>{firstCorrectSteps} / {totalSteps} steps</dd></div><div><dt>Correct after all checks</dt><dd>{eventualCorrectSteps} / {totalSteps} steps</dd></div><div><dt>Explicit retries</dt><dd>{retries}</dd></div></dl>
      <p>These are browser-observed practice results for this round, not verified assessment scores. Your first answers remain separate from retry corrections.</p>
      <button type="button" className="deep-games__primary" disabled={requestedRound} onClick={newRound}>{requestedRound ? "Requesting new round…" : "New round"}</button>
    </section> : <>
      <h2 ref={heading} tabIndex={-1}>{current.task.prompt}</h2>
      <p className="deep-games__context"><strong>Assumptions:</strong> {current.task.assumptions}</p>
      {session.mode === "exam-escape-room" && session.mission
        ? <ExamEscapeRoom key={current.id} mission={session.mission} occurrences={session.tasks} stageIndex={index} {...interaction} />
        : <DeepTaskRenderer key={current.id} task={current.task} {...interaction} />}
      <div className="deep-games__task-footer" aria-live="polite">
        <p>{currentCorrect ? "All required decisions for this task are correct. Review any explanation before continuing." : "Check each required decision and correct any mistakes before continuing."}</p>
        {index < session.tasks.length - 1
          ? <button type="button" className="deep-games__primary" disabled={!currentCorrect} onClick={next}>{session.mode === "exam-escape-room" ? "Next stage" : "Next task"}</button>
          : <button type="button" className="deep-games__primary" disabled={!currentCorrect} onClick={finish}>Finish round</button>}
      </div>
    </>}
  </article>;
}

export default DeepGameRunner;
