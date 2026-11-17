import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getCourseByKey } from "@shared/courseRegistry";
import { DRILL_MODES } from "./InteractiveDrill";

/** Extension of the existing blue/black founder overview; no learner identities. */
export default function AdminGamesActivity() {
  const [days, setDays] = useState<7 | 30>(30);
  const query = trpc.admin.gameActivity.useQuery({ days }, { retry: false });
  const data = query.data;
  return <section className="admin-priority-card admin-games-activity" aria-labelledby="games-activity-title">
    <div className="admin-panel-heading">
      <div><h2 id="games-activity-title">Games activity</h2><p>Course games only · Separate from quizzes and readiness</p></div>
      <label>Period <select value={days} onChange={event => setDays(Number(event.target.value) as 7 | 30)}>
        <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
      </select></label>
    </div>
    {query.isError ? <div className="admin-games-message" role="alert"><p>Games activity couldn’t be loaded. Counts are unavailable.</p><button type="button" className="admin-text-action" onClick={() => void query.refetch()}>Try again</button></div>
      : query.isPending ? <p className="admin-games-message" role="status">Loading games activity…</p>
      : data && <>
        {data.roundsStarted === 0 ? <p className="admin-games-message" role="status">No tracked course-game answers in this period. Opening a game does not count as playing.</p> : <>
          <dl className="admin-games-metrics">
            {[["Players (estimate)", data.players], ["Rounds started", data.roundsStarted], ["Rounds completed", data.roundsCompleted], ["Questions answered", data.questionsAnswered], ["Returning players", data.returningPlayers]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString()}</dd></div>)}
          </dl>
          <div className="admin-games-popular">
            <p><strong>Popular courses</strong><br />{data.popularCourses.map(item => `${getCourseByKey(item.key)?.displayName ?? item.key} (${item.rounds})`).join(" · ")}</p>
            <p><strong>Popular modes</strong><br />{data.popularModes.map(item => `${DRILL_MODES.find(mode => mode.id === item.key)?.label ?? item.key} (${item.rounds})`).join(" · ")}</p>
          </div>
        </>}
        <details className="admin-games-message admin-metric-definition"><summary>How these counts work</summary>
          <p>A round starts at its first answered activity—not a page visit. Untimed completion means every delivered activity was answered; timed completion means the timer expired or End round was chosen after at least one answer. Skips do not count as answers. Timed repeats count as separate answers.</p>
          <p>{data.identifiedPlayers.toLocaleString()} identified account/verified-email identities and {data.anonymousBrowsers.toLocaleString()} anonymous browsers in this period. Anonymous counts are browser estimates, not unique people; clearing storage, changing browsers or signing in can count again. No names or emails are shown or stored in game events.</p>
          <p>Returning players answered on at least two distinct UTC days within this period. Popularity counts rounds started. Completion counts finishes in this period, including rounds started earlier. Internal/admin and known test identities are excluded; signed-out internal browsers cannot be recognized. Privacy opt-outs and reporting failures are not counted.</p>
          <p>{data.firstTrackedAt ? `Tracking since ${new Date(data.firstTrackedAt).toLocaleDateString()}.` : "Tracking starts with the first eligible answer after release."} No historical backfill. Public introductory demos are excluded.</p>
          <button type="button" className="admin-text-action" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? "Refreshing…" : "Refresh games activity"}</button>
        </details>
      </>}
  </section>;
}
