import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { LearnerOption, LearnerSelection } from "@shared/learnerActivity";

type Cursor = { snapshot: number; before: number };
const date = (value: Date) => new Date(value).toLocaleString();
const button = "admin-text-action";

export default function AdminSignInDirectory({ selected, onSelect }: { selected: string | undefined; onSelect: (learner: LearnerOption, at: Date) => void }) {
  const [pages, setPages] = useState<Cursor[]>([]);
  const query = trpc.admin.signInPeople.useQuery({ cursor: pages.at(-1) }, { retry: false });
  const next = query.data?.next;
  return <section aria-labelledby="sign-in-directory-title">
    <h3 id="sign-in-directory-title">People who signed in</h3>
    <p>Newest sign-ins first. Select a person to see their visits and recorded learning activity.</p>
    {query.isLoading && <p role="status">Loading sign-ins…</p>}
    {query.isError && <p role="alert">The sign-in directory could not load. <button className={button} onClick={() => void query.refetch()}>Retry</button></p>}
    {query.data && <>
      {!query.data.items.length && <p>No sign-ins recorded on this page. The access log starts when this feature is activated.</p>}
      {query.data.items.length > 0 && <div style={{ overflowX: "auto" }}><table className="w-full text-left text-sm">
        <thead><tr>{["Person", "Last sign-in", "Method", "Sign-ins"].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
        <tbody>{query.data.items.map(({ learner, at, method, count }) => <tr key={learner.key}>
          <td className="p-2"><button type="button" className={button} aria-pressed={selected === learner.key} onClick={() => onSelect(learner, at)}>
            {learner.name || learner.email || ("userId" in learner.selection ? `Account #${learner.selection.userId}` : "Verified email")}
          </button>{learner.name && learner.email && <div>{learner.email}</div>}
            <small className="block">{"userId" in learner.selection ? `Account #${learner.selection.userId}` : "Verified email"}</small></td>
          <td className="p-2"><time dateTime={new Date(at).toISOString()}>{date(at)}</time></td><td className="p-2">{method}</td><td className="p-2">{count}</td>
        </tr>)}</tbody>
      </table></div>}
    </>}
    {(pages.length > 0 || next) && <nav aria-label="People pages" className="my-3 flex items-center gap-4">
      <button className={button} disabled={!pages.length || query.isFetching} onClick={() => setPages(value => value.slice(0, -1))}>Previous people</button>
      <span>Page {pages.length + 1}</span><button className={button} disabled={!next || query.isFetching} onClick={() => next && setPages(value => [...value, next])}>More people</button>
    </nav>}
  </section>;
}

export function AdminSignInHistory({ learner, onVisit }: { learner: LearnerSelection; onVisit: (at: Date) => void }) {
  const [pages, setPages] = useState<number[]>([]);
  const query = trpc.admin.signInHistory.useQuery({ learner, before: pages.at(-1) }, { retry: false });
  const next = query.data?.next;
  return <section aria-labelledby="sign-in-history-title" className="my-4">
    <h4 id="sign-in-history-title">Sign-in history</h4>
    {query.isLoading && <p role="status">Loading visits…</p>}
    {query.isError && <p role="alert">Sign-in history could not load. <button className={button} onClick={() => void query.refetch()}>Retry visits</button></p>}
    {query.data?.items.length === 0 && <p>No sign-ins recorded for this person since the access log started.</p>}
    <ul>{query.data?.items.map(visit => <li key={visit.id}><button type="button" className={button} onClick={() => onVisit(visit.at)}>
      <time dateTime={new Date(visit.at).toISOString()}>{date(visit.at)}</time> · {visit.method}
    </button></li>)}</ul>
    {(pages.length > 0 || next) && <nav aria-label="Sign-in history pages" className="flex gap-4">
      <button className={button} disabled={!pages.length || query.isFetching} onClick={() => setPages(value => value.slice(0, -1))}>Newer sign-ins</button>
      <button className={button} disabled={!next || query.isFetching} onClick={() => next && setPages(value => [...value, next])}>Older sign-ins</button>
    </nav>}
  </section>;
}
