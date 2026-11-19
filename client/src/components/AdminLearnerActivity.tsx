import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getCourseByKey } from "@shared/courseRegistry";
import { LEARNER_ACTIVITY_COVERAGE, type LearnerOption } from "@shared/learnerActivity";
import LearnerAssessmentDetails from "./LearnerAssessmentDetails";

export default function AdminLearnerActivity() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LearnerOption | null>(null);
  const [days, setDays] = useState<7 | 30>(7);
  const learners = trpc.admin.learnerSearch.useQuery({ query: search }, { enabled: search.length >= 3, retry: false });
  const activity = trpc.admin.learnerActivity.useQuery({ learner: selected?.selection ?? { userId: 1 }, days }, { enabled: selected !== null, retry: false });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = (value: Date) => new Date(value).toLocaleString();
  const button = "admin-text-action";
  return <section aria-labelledby="learner-activity-title" className="admin-panel" style={{ padding: 24 }}>
    <h2 id="learner-activity-title">Learners</h2>
    <p>Find an account by name or email prefix, or use an exact verified email. Email-only records are searched within the last 30 days.</p>
    <form onSubmit={event => { event.preventDefault(); setSelected(null); setSearch(draft.trim()); }} style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
      <label htmlFor="learner-search">Name or email <input id="learner-search" value={draft} onChange={event => setDraft(event.target.value)} minLength={3} maxLength={320} required placeholder="At least 3 characters" className="admin-input" /></label>
      <button type="submit" className={button} disabled={draft.trim().length < 3}>Search learners</button>
    </form>
    {search && learners.isLoading && <p role="status">Searching learners…</p>}
    {search && learners.isError && <p role="alert">Learner search could not load. <button className={button} onClick={() => void learners.refetch()}>Retry search</button></p>}
    {search && learners.data && <div>
      {learners.data.partial && <p role="status">Search results are limited to 20. Refine the name or use an exact email.</p>}
      {!learners.data.learners.length && <p>No matching learners with supported records. Try an exact email.</p>}
      <ul aria-label="Learner search results" style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
        {learners.data.learners.map(learner => <li key={learner.key}><button type="button" className={button} aria-pressed={selected?.key === learner.key} onClick={() => setSelected(learner)}>
          {learner.name ?? ("userId" in learner.selection ? "Account learner" : "Email-only learner")} · {learner.email ?? "No account email"} · {"userId" in learner.selection ? `Account #${learner.selection.userId}` : "Verified email records"}
        </button></li>)}
      </ul>
    </div>}
    <p style={{ fontSize: 13, lineHeight: 1.6 }}>{LEARNER_ACTIVITY_COVERAGE}</p>
    {!selected ? <p>Select a learner to see recorded activity.</p> : <div>
      <h3>{selected.name ?? selected.email ?? "Account learner"}</h3>
      <label htmlFor="learner-window">History window </label>
      <select id="learner-window" value={days} onChange={event => setDays(Number(event.target.value) as 7 | 30)}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select>
      <p>Times shown in {timezone}. Newest observations first.</p>
      {activity.isLoading && <p role="status">Loading learner activity…</p>}
      {activity.isError && <p role="alert">Learner activity could not load. <button className={button} onClick={() => void activity.refetch()}>Retry activity</button></p>}
      {activity.data && <>
        {activity.data.partial && <p role="status">Partial history: at most 200 timeline observations are shown, with each source bounded to 200 records. Totals cover displayed observations only.</p>}
        <dl style={{ display: "flex", gap: 32, flexWrap: "wrap" }}><div><dt>Last observed activity in window</dt><dd>{activity.data.lastObservedAt ? date(activity.data.lastObservedAt) : "Not available"}</dd></div><div><dt>Recorded active study time (displayed records)</dt><dd>{activity.data.recordedStudySeconds.toLocaleString()} seconds</dd></div></dl>
        {!activity.data.items.length ? <p>No supported activity recorded in this window.</p> : <ol aria-label="Learner activity timeline" style={{ paddingLeft: 24 }}>
          {activity.data.items.map(item => <li key={item.key} style={{ padding: "16px 0", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
            <strong>{item.label}</strong> · <time dateTime={new Date(item.at).toISOString()}>{date(item.at)}</time>
            {item.course && <div>{getCourseByKey(item.course)?.displayName ?? item.course}</div>}
            <div>{item.detail}</div>
            {item.total !== undefined && <div>{item.correct} / {item.total} correct{item.kind === "practice" ? ` · ${item.total} recorded answers` : ""}</div>}
            {item.activeSeconds !== undefined && <div>{item.activeSeconds} recorded active study seconds</div>}
          </li>)}
        </ol>}
        <button type="button" className={button} disabled={activity.isFetching} onClick={() => void activity.refetch()}>{activity.isFetching ? "Refreshing…" : "Refresh learner activity"}</button>
      </>}
      <LearnerAssessmentDetails key={`${selected.key}:${days}`} target={{ kind: "admin", learner: selected.selection }} days={days} />
    </div>}
  </section>;
}
