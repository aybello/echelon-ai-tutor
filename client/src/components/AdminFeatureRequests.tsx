import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type Status = "new" | "reviewing" | "planned" | "released";
const STATUSES: Status[] = ["new", "reviewing", "planned", "released"];
const label = (value: string) => value[0].toUpperCase() + value.slice(1);

export default function AdminFeatureRequests() {
  const [status, setStatus] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();
  const requests = trpc.featureRequests.list.useQuery({ page, limit: 50, status: status === "all" ? undefined : status });
  const update = trpc.featureRequests.setStatus.useMutation({
    onMutate: () => setMessage(""),
    onSuccess: () => { setMessage("Request status saved."); void utils.featureRequests.list.invalidate(); },
    onError: () => setMessage("Status was not saved. Please try again."),
  });
  return <section aria-label="Feature requests" className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-bold">Feature requests</h2><p className="mt-1 text-sm text-slate-600">Private learner suggestions. These do not affect review ratings.</p></div>
      <Button type="button" variant="outline" className="min-h-11" disabled={requests.isFetching} onClick={() => void requests.refetch()}>Refresh requests</Button>
    </div>
    <div className="my-4 flex flex-wrap items-center gap-3"><label htmlFor="feature-request-status" className="text-sm font-semibold">Status</label><select id="feature-request-status" value={status} onChange={event => { setStatus(event.target.value as Status | "all"); setPage(1); }} className="min-h-11 rounded-md border border-slate-400 bg-white px-3 text-sm"><option value="all">All requests</option>{STATUSES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></div>
    {message && <p role={update.isError ? "alert" : "status"} className={update.isError ? "mb-3 text-sm text-red-700" : "mb-3 text-sm text-blue-800"}>{message}</p>}
    {requests.isLoading && <p role="status">Loading feature requests...</p>}
    {requests.isError && <p role="alert" className="text-sm text-red-700">Feature requests could not be loaded. Use Refresh requests to try again.</p>}
    {requests.data?.items.length === 0 && <p className="py-8 text-sm text-slate-600">No requests on this page for the selected status.</p>}
    <div className="divide-y divide-slate-200">{requests.data?.items.map(row => <article key={row.id} className="py-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-600">#{row.id} · {row.courseKey} · {row.source} · {new Date(row.createdAt).toLocaleString()}</p><label className="flex items-center gap-2 text-sm">Status for request #{row.id}<select aria-label={`Status for request #${row.id}`} value={row.status} disabled={update.isPending} onChange={event => update.mutate({ id: row.id, status: event.target.value as Status })} className="min-h-11 rounded-md border border-slate-400 bg-white px-3">{STATUSES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label></div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold">{row.suggestion}</p>
      {row.problem && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600"><strong>Problem:</strong> {row.problem}</p>}
      <p className="mt-3 break-words text-xs text-slate-600">{row.email ?? (row.userId ? `User #${row.userId}` : "Anonymous")} · {row.pagePath}</p>
      <p className="mt-1 text-xs text-slate-600">{row.followUpAllowed ? "Email follow-up allowed for this suggestion only." : "No email follow-up permission."}</p>
    </article>)}</div>
    <nav aria-label="Feature request pagination" className="mt-4 flex items-center gap-3"><Button type="button" variant="outline" className="min-h-11" disabled={page === 1 || requests.isFetching} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</Button><span className="text-sm" aria-live="polite">Page {page}</span><Button type="button" variant="outline" className="min-h-11" disabled={requests.isFetching || requests.isError || !requests.data?.hasMore || page >= 100000} onClick={() => setPage(value => value + 1)}>Next</Button></nav>
  </section>;
}
