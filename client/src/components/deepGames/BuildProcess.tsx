import { useId, useRef, useState } from "react";
import type { ProcessTask } from "@shared/deepGames";
import { scoreDeepStep, scoreDeepTask } from "@shared/scoreDeepGame";
import { Explanation, isChecked, type DeepTaskInteraction } from "./deepGameUI";

export type BuildProcessProps = DeepTaskInteraction & { task: ProcessTask };

export function BuildProcess({ task, progress, onCheck, onRetry, onExplanation }: BuildProcessProps) {
  const instructionsId = useId();
  const [order, setOrder] = useState(() => task.cards.map(card => card.id));
  const [announcement, setAnnouncement] = useState("");
  const dragId = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const checked = isChecked(progress, "slot:0");
  const correct = checked && scoreDeepTask(task, progress.answers).correct;
  const label = (id: string) => task.cards.find(card => card.id === id)!.label;
  const move = (from: number, to: number, focus = false) => {
    if (checked || from < 0 || to < 0 || from >= order.length || to >= order.length || from === to) return;
    const next = [...order];
    const [card] = next.splice(from, 1); next.splice(to, 0, card);
    setOrder(next);
    setAnnouncement(`${label(card)} moved to position ${to + 1} of ${order.length}.`);
    if (focus) queueMicrotask(() => rowRefs.current.get(card)?.focus());
  };
  return <section aria-label="Arrange the process">
    <p className="deep-games__context"><strong>Stated configuration:</strong> {task.configuration}</p>
    <p id={instructionsId} className="deep-games__muted">Put the named cards in order, starting at position 1. Drag a card onto a position, or use Move up / Move down. Keyboard users can also focus a card and use Alt + Arrow Up / Arrow Down. Only Check order submits your arrangement.</p>
    <ol className="deep-games__process" aria-describedby={instructionsId}>
      {order.map((id, index) => <li key={id} ref={node => { if (node) rowRefs.current.set(id, node); else rowRefs.current.delete(id); }} tabIndex={0} draggable={!checked}
        onKeyDown={event => { if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); move(index, index + (event.key === "ArrowUp" ? -1 : 1), true); } }}
        onDragStart={event => { if (checked) { event.preventDefault(); return; } dragId.current = id; event.dataTransfer.setData("text/plain", id); event.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { dragId.current = null; }}
        onDragOver={event => { if (!checked && dragId.current) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
        onDrop={event => { event.preventDefault(); if (checked || !dragId.current) return; move(order.indexOf(dragId.current), index, true); dragId.current = null; }}>
        <span className="deep-games__position" aria-label={`Position ${index + 1}`}>{index + 1}</span>
        <span className="deep-games__card-label">{label(id)}{checked && <small>{scoreDeepStep(task, `slot:${index}`, id) ? "Correct position" : "Not in the correct position"}</small>}</span>
        <span className="deep-games__move-controls"><button type="button" className="deep-games__secondary" disabled={checked || index === 0} aria-label={`Move ${label(id)} up`} onClick={() => move(index, index - 1)}>Move up</button><button type="button" className="deep-games__secondary" disabled={checked || index === order.length - 1} aria-label={`Move ${label(id)} down`} onClick={() => move(index, index + 1)}>Move down</button></span>
      </li>)}
    </ol>
    <p role="status" aria-live="polite" className="deep-games__announcement">{announcement}</p>
    {!checked && <button type="button" className="deep-games__primary" onClick={() => onCheck(Object.fromEntries(order.map((id, index) => [`slot:${index}`, id])))}>Check order</button>}
    {checked && <div className={`deep-games__feedback${correct ? "" : " is-incorrect"}`} role="status" aria-live="polite">
      <p><strong>{correct ? "The process is in the correct order." : "The order needs another look."}</strong> {correct ? "Your first checked positions remain recorded separately from this arrangement." : "Review the position feedback, then retry and check the full arrangement again."}</p>
      <Explanation stepId="slot:0" progress={progress} onExplanation={onExplanation}><p>{task.explanation}</p></Explanation>
      {!correct && <button type="button" className="deep-games__secondary" onClick={() => onRetry(order.map((_, index) => `slot:${index}`))}>Try order again</button>}
    </div>}
  </section>;
}
