import { useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";
import { getCourseByKey } from "@shared/courseRegistry";
import { LEARNER_ACTIVITY_COVERAGE, type LearnerOption } from "@shared/learnerActivity";
import LearnerAssessmentDetails from "./LearnerAssessmentDetails";
import AdminSignInDirectory, { AdminSignInHistory } from "./AdminSignInDirectory";

// Refetch mounted/enabled queries only, never old learners, windows or action
// pages retained in the cache. Do not reset the selection or open detail cursor.
export function refreshLearnerActivityQueries(admin: ReturnType<typeof trpc.useUtils>["admin"]) {
  const filters = { type: "active" as const };
  const options = { cancelRefetch: false };
  return Promise.all([
    admin.signInPeople.refetch(undefined, filters, options),
    admin.signInHistory.refetch(undefined, filters, options),
    admin.learnerSearch.refetch(undefined, filters, options),
    admin.learnerActivity.refetch(undefined, filters, options),
    admin.learnerAssessments.refetch(undefined, filters, options),
    admin.learnerAssessmentDetails.refetch(undefined, filters, options),
  ]);
}
export function useLearnerActivityRefresh() {
  const utils = trpc.useUtils();
  const searching = useIsFetching({ queryKey: getQueryKey(trpc.admin.learnerSearch) });
  const people = useIsFetching({ queryKey: getQueryKey(trpc.admin.signInPeople) });
  const visits = useIsFetching({ queryKey: getQueryKey(trpc.admin.signInHistory) });
  const timeline = useIsFetching({ queryKey: getQueryKey(trpc.admin.learnerActivity) });
  const sessions = useIsFetching({ queryKey: getQueryKey(trpc.admin.learnerAssessments) });
  const details = useIsFetching({ queryKey: getQueryKey(trpc.admin.learnerAssessmentDetails) });
  return { refresh: () => refreshLearnerActivityQueries(utils.admin), isRefreshing: people + visits + searching + timeline + sessions + details > 0 };
}

const focusSelection = (heading: HTMLHeadingElement | null) => { heading?.focus(); };

function calendarDate(at: Date) {
  return new Date(at.getTime() - at.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function AdminLearnerActivity() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LearnerOption | null>(null);
  const [days, setDays] = useState<7 | 30>(7);
  const [through, setThrough] = useState<number | undefined>();
  function showVisit(at: Date) {
    const end = new Date(at);
    end.setHours(23, 59, 59, 999);
    setThrough(end.getTime() < Date.now() ? end.getTime() : undefined);
  }
  const { refresh, isRefreshing } = useLearnerActivityRefresh();
  const learners = trpc.admin.learnerSearch.useQuery({ query: search }, { enabled: search.length >= 3, retry: false });
  const activity = trpc.admin.learnerActivity.useQuery({ learner: selected?.selection ?? { userId: 1 }, days, through }, { enabled: selected !== null, retry: false });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = (value: Date) => new Date(value).toLocaleString();
  const button = "admin-text-action";
  return <section aria-labelledby="learner-activity-title" className="admin-panel" style={{ padding: 24 }}>
    <h2 id="learner-activity-title">Learners</h2>
    <AdminSignInDirectory selected={selected?.key} onSelect={(learner, at) => { setSelected(learner); showVisit(at); }} />
    <h3>Find a learner</h3>
    <p>Search by account name or email. Older hash-only sign-ins and observed assessment sessions require an exact email, not a prefix.</p>
    <p style={{ fontSize: 13 }}>Refresh re-reads the current search, timeline, observed assessment sessions and any open recorded-actions page. Only saved records are available; timestamps are not a live presence indicator.</p>
    <button type="button" className={button} disabled={isRefreshing} onClick={() => void refresh()}>{isRefreshing ? "Refreshing…" : "Refresh learner activity"}</button>
    <form onSubmit={event => { event.preventDefault(); setSelected(null); setThrough(undefined); setSearch(draft.trim()); }} style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
      <label htmlFor="learner-search">Name or email <input id="learner-search" value={draft} onChange={event => setDraft(event.target.value)} minLength={3} maxLength={320} required placeholder="At least 3 characters" className="admin-input" /></label>
      <button type="submit" className={button} disabled={draft.trim().length < 3}>Search learners</button>
    </form>
    {search && learners.isLoading && <p role="status">Searching learners…</p>}
    {search && learners.isError && <p role="alert">Learner search could not load. <button className={button} onClick={() => void learners.refetch()}>Retry search</button></p>}
    {search && learners.data && <div>
      {learners.data.partial && <p role="status">Search results are limited to 20. Refine the name or use an exact email.</p>}
      {!learners.data.learners.length && <p>No matching learners with supported records. Try an exact email.</p>}
      <ul aria-label="Learner search results" style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
        {learners.data.learners.map(learner => <li key={learner.key}><button type="button" className={button} aria-pressed={selected?.key === learner.key} onClick={() => { setSelected(learner); setThrough(undefined); }}>
          {learner.name ?? ("userId" in learner.selection ? "Account learner" : "Email-only learner")} · {learner.email ?? "No account email"} · {"userId" in learner.selection ? `Account #${learner.selection.userId}` : "Verified email records"}
        </button></li>)}
      </ul>
    </div>}
    <p style={{ fontSize: 13, lineHeight: 1.6 }}>{LEARNER_ACTIVITY_COVERAGE}</p>
    {!selected ? <p>Select a learner to see recorded activity.</p> : <div>
      <h3 key={selected.key} ref={focusSelection} tabIndex={-1}>{selected.name ?? selected.email ?? "Account learner"}</h3>
      <AdminSignInHistory key={selected.key} learner={selected.selection} onVisit={showVisit} />
      <label htmlFor="learner-window">History window </label>
      <select id="learner-window" value={days} onChange={event => setDays(Number(event.target.value) as 7 | 30)}><option value={7}>7 days</option><option value={30}>30 days</option></select>
      <label className="ml-3">Ending on <input type="date" value={calendarDate(new Date(through ?? Date.now()))} max={calendarDate(new Date())}
        onChange={event => { const value = event.target.value; if (value) showVisit(new Date(`${value}T12:00:00`)); }} /></label>
      {through !== undefined && <button className={button} onClick={() => setThrough(undefined)}>Show latest activity</button>}
      <p>Times shown in {timezone}. Newest observations first.</p>
      {activity.isLoading && <p role="status">Loading learner activity…</p>}
      {activity.isError && <p role="alert">Learner activity could not load. <button className={button} onClick={() => void activity.refetch()}>Retry activity</button></p>}
      {activity.data && <>
        {activity.data.partial && <p role="status">Partial history: at most 200 timeline observations are shown, with each source bounded to 200 records. Totals cover displayed observations only.</p>}
        <dl style={{ display: "flex", gap: 32, flexWrap: "wrap" }}><div><dt>Last activity in the timeline below</dt><dd>{activity.data.lastObservedAt ? date(activity.data.lastObservedAt) : "Not available"}</dd></div><div><dt>Recorded active study time (displayed records)</dt><dd>{activity.data.recordedStudySeconds.toLocaleString()} seconds</dd></div></dl>
        <p style={{ fontSize: 13 }}>Observed assessment sessions are listed separately and are not included in this timestamp.</p>
        {!activity.data.items.length ? <p>No supported timeline activity recorded in this window. Check observed assessment sessions separately below.</p> : <ol aria-label="Learner activity timeline" style={{ paddingLeft: 24 }}>
          {activity.data.items.map(item => <li key={item.key} style={{ padding: "16px 0", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
            <strong>{item.label}</strong> · <time dateTime={new Date(item.at).toISOString()}>{date(item.at)}</time>
            {item.course && <div>{getCourseByKey(item.course)?.displayName ?? item.course}</div>}
            <div>{item.detail}</div>
            {item.total !== undefined && <div>{item.correct} / {item.total} correct{item.kind === "practice" ? ` · ${item.total} recorded answers` : ""}</div>}
            {item.activeSeconds !== undefined && <div>{item.activeSeconds} recorded active study seconds</div>}
          </li>)}
        </ol>}
      </>}
      <LearnerAssessmentDetails key={`${selected.key}:${days}:${through ?? "latest"}`} target={{ kind: "admin", learner: selected.selection }} days={days} through={through} />
    </div>}
  </section>;
}
