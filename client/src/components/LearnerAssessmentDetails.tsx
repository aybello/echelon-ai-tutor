import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getCourseByKey } from "@shared/courseRegistry";
import { LEARNER_ASSESSMENT_COVERAGE, type LearnerAssessmentTarget, type LearnerAssessmentFeed, type LearnerAssessmentDetail } from "@shared/learnerActivity";

const queryOptions = { retry: false as const, staleTime: 0 };
function AssessmentPage({ target, sessionId, days }: { target: LearnerAssessmentTarget; sessionId: string; days: 7 | 30 }) {
  const [cursor, setCursor] = useState(0);
  const input = { sessionId, days, cursor };
  const admin = trpc.admin.learnerAssessmentDetails.useQuery({ ...input, learner: target.kind === "admin" ? target.learner : { userId: 1 } }, { ...queryOptions, enabled: target.kind === "admin" });
  const annual = trpc.orgIntel.learnerAssessmentDetails.useQuery({ ...input, orgId: target.kind === "annual" ? target.orgId : undefined, memberId: target.kind === "annual" ? target.memberId : 1 }, { ...queryOptions, enabled: target.kind === "annual" });
  const flex = trpc.teamFlex.learnerAssessmentDetails.useQuery({ ...input, orgId: target.kind === "flex" ? target.orgId : 1, licenceId: target.kind === "flex" ? target.licenceId : 1 }, { ...queryOptions, enabled: target.kind === "flex" });
  const query = target.kind === "admin" ? admin : target.kind === "annual" ? annual : flex;
  const data: LearnerAssessmentDetail | undefined = query.data;
  return <div className="mt-3 space-y-3 text-sm">
    {query.isLoading && <p role="status">Loading recorded actions…</p>}
    {query.isError && <p role="alert">Recorded details unavailable. <button className="workspace-text-link" onClick={() => void query.refetch()}>Retry</button></p>}
    {data && <>
      {!data.items && <p>Issued question snapshot unavailable or invalid. Current question-bank text is not substituted.</p>}
      <ol aria-label="Recorded assessment actions" className="space-y-4">
        {data.events.map(event => {
          const item = data.items?.find(value => value.id === event.itemId);
          const step = item?.steps.find(value => value.id === event.stepId);
          const answer = (step?.options ?? item?.options)?.find(value => value.id === event.chosenAnswer);
          return <li key={event.sequence} className="border-t border-slate-200 pt-3">
            <div><strong>{event.action.replaceAll("_", " ")}</strong>{event.firstRecordedAnswer && " · First recorded submitted answer"} · <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time></div>
            <div className="text-xs text-slate-500">Source: observed · Sequence {event.sequence}</div>
            {item && <div className="mt-2 whitespace-pre-wrap break-words"><strong>Issued question:</strong> {item.prompt}{item.topic && <div className="text-xs text-slate-500">Topic: {item.topic}</div>}
              {!!item.options.length && <ul className="list-disc pl-5">{item.options.map(option => <li key={option.id}>{option.id}: {option.text}</li>)}</ul>}
            </div>}
            {step && <div>Issued step: {step.label}<ul className="list-disc pl-5">{step.options.map(option => <li key={option.id}>{option.id}: {option.text}</li>)}</ul></div>}
            {event.chosenAnswer !== null && <div>Recorded response: {answer?.text ?? "Issued response text unavailable"} <span className="text-xs text-slate-500">(alias {event.chosenAnswer})</span></div>}
            {event.observedCorrect !== null && <div>Observed outcome: {event.observedCorrect ? "correct" : "incorrect"} · not server-verified</div>}
          </li>;
        })}
      </ol>
      {!data.events.length && <p>No recorded actions in this page.</p>}
      <div className="flex gap-4"><button className="workspace-text-link" disabled={cursor === 0 || query.isFetching} onClick={() => setCursor(0)}>First page</button><button className="workspace-text-link" disabled={data.nextCursor === null || query.isFetching} onClick={() => setCursor(data.nextCursor!)}>Next 50 actions</button></div>
    </>}
  </div>;
}
export default function LearnerAssessmentDetails({ target, days = 30 }: { target: LearnerAssessmentTarget; days?: 7 | 30 }) {
  const [opened, setOpened] = useState<string | null>(null);
  const admin = trpc.admin.learnerAssessments.useQuery({ learner: target.kind === "admin" ? target.learner : { userId: 1 }, days }, { ...queryOptions, enabled: target.kind === "admin" });
  const annual = trpc.orgIntel.learnerAssessments.useQuery({ orgId: target.kind === "annual" ? target.orgId : undefined, memberId: target.kind === "annual" ? target.memberId : 1, days }, { ...queryOptions, enabled: target.kind === "annual" });
  const flex = trpc.teamFlex.learnerAssessments.useQuery({ orgId: target.kind === "flex" ? target.orgId : 1, licenceId: target.kind === "flex" ? target.licenceId : 1, days }, { ...queryOptions, enabled: target.kind === "flex" });
  const query = target.kind === "admin" ? admin : target.kind === "annual" ? annual : flex;
  const data: LearnerAssessmentFeed | undefined = query.data;
  return <section aria-label="Observed assessment sessions" className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
    <h3 className="font-semibold text-slate-900">Observed assessment sessions</h3>
    <p className="my-2 text-xs leading-relaxed text-slate-500">{LEARNER_ASSESSMENT_COVERAGE}</p>
    {query.isLoading && <p role="status">Loading recorded sessions…</p>}
    {query.isError && <p role="alert">Assessment history unavailable. <button className="workspace-text-link" onClick={() => void query.refetch()}>Retry</button></p>}
    {data && <>
      <p className="text-xs">{data.access ? `Recorded assignment: ${data.access.status} · ${data.access.courses.join(", ")} · ${new Date(data.access.startsAt).toLocaleDateString()} to ${new Date(data.access.endsAt).toLocaleDateString()} (not a live entitlement determination)` : "Access summary unavailable; no entitlement is inferred from activity."}</p>
      <p className="my-2 text-xs">Active assessment time: unavailable. Canonical results are shown separately, never blended across games, modes or timed status.</p>
      {data.partial && <p role="status">Partial history: newest 200 issued sessions only.</p>}
      {!data.sessions.length && <p className="mt-3 text-sm">No attributed sessions recorded in this window. Historical first answers are unavailable.</p>}
      <ul className="mt-3 space-y-3">{data.sessions.map(session => <li key={session.sessionId} className="border-t border-slate-200 pt-3 text-sm">
        <strong>{getCourseByKey(session.courseKey)?.displayName ?? session.courseKey}</strong> · {session.mode} · {session.timed === null ? "Timing unknown" : session.timed ? "Timed" : "Untimed"}
        <div>Recorded state: {session.status === "active" ? session.participated ? "Observed / unfinished" : "Issued / no participation recorded" : session.status} · Last observed {new Date(session.lastObservedAt).toLocaleString()}</div>
        <div className="text-xs text-slate-500">{session.itemCount} issued items · {session.answers} answer submissions · {session.retries} explicit retries · {session.steps} recorded step responses · {session.hints > 0 ? `${session.hints} hints opened` : "No hint use recorded; controls may not be offered"} · {session.explanations} explanations shown · {session.resumes} resumes</div>
        <button type="button" className="workspace-text-link mt-2" aria-expanded={opened === session.sessionId} onClick={() => setOpened(opened === session.sessionId ? null : session.sessionId)}>{opened === session.sessionId ? "Close recorded actions" : "View issued questions and recorded actions"}</button>
        {opened === session.sessionId && <AssessmentPage key={`${JSON.stringify(target)}:${session.sessionId}:${days}`} target={target} sessionId={session.sessionId} days={days} />}
      </li>)}</ul>
    </>}
  </section>;
}
/** The actual FlexProgressDashboard lives in components, outside this unit's owned paths. */
export function FlexLearnerDrilldowns({ orgId }: { orgId: number }) {
  const progress = trpc.teamFlex.getFlexProgress.useQuery({ orgId }, queryOptions);
  const [licenceId, setLicenceId] = useState<number | null>(null);
  const rows = progress.data?.filter(row => row.operatorKey && ["active", "expired"].includes(row.status)) ?? [];
  if (!rows.length) return null;
  return <section className="mt-4"><h3 className="text-sm font-semibold text-slate-800">Course Pass learner details</h3><div className="mt-2 flex flex-wrap gap-3">{rows.map(row => <button className="workspace-text-link text-sm" key={row.licenceId} aria-pressed={licenceId === row.licenceId} onClick={() => setLicenceId(licenceId === row.licenceId ? null : row.licenceId)}>{row.operatorEmail ?? "Account operator"} · {row.courseKey} · Licence #{row.licenceId}</button>)}</div>{licenceId !== null && <LearnerAssessmentDetails key={`${orgId}:${licenceId}`} target={{ kind: "flex", orgId, licenceId }} />}</section>;
}
