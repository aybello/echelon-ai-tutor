import { useEffect, useState } from "react";
import { Download, FileCheck2, Printer } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function hours(seconds: number) { return `${(Math.max(0, seconds) / 3600).toFixed(2)} h`; }
function saveCsv(csv: string, filename: string) { const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

export default function TeamTrainingHours() {
  usePageMeta({ title: "Team Training Hours — Echelon Institute", description: "Review and attest verified operator study activity." });
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const summary = trpc.training.managerSummary.useQuery({ from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) }, { retry: false });
  const [selected, setSelected] = useState<{ operatorEmail: string; courseKey: string } | null>(null);
  useEffect(() => { if (!selected && summary.data?.operators[0]) setSelected(summary.data.operators[0]); }, [selected, summary.data]);
  const reportInput = selected ? { ...selected, from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) } : null;
  const report = trpc.training.managerOperatorReport.useQuery(reportInput!, { enabled: !!reportInput, retry: false });
  const csv = trpc.training.managerCsv.useQuery(reportInput!, { enabled: false });
  const attest = trpc.training.attest.useMutation({ onSuccess: (result) => { toast.success(`Record attested: ${result.reportId}`); void report.refetch(); }, onError: (error) => toast.error(error.message) });
  const [form, setForm] = useState({ providerName: "Echelon Institute", instructorName: "", instructorContact: "", signedByName: "", signedRole: "Manager / ORO" });

  if (summary.isError) return <div className="min-h-screen bg-slate-50"><SiteNav currentPath="/team/training-hours" /><main className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-black">Manager verification required</h1><p className="mt-3 text-slate-600">Sign in with the active team manager email.</p><Link href="/account?next=/team/training-hours" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Manager sign in</Link></main></div>;

  const doAttest = () => {
    if (!reportInput) return;
    attest.mutate({ ...reportInput, ...form, confirmed: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav currentPath="/team/training-hours" />
      <style>{`@media print { nav,.manager-actions,.operator-list,.attest-form {display:none!important}.report-card{box-shadow:none!important;border:0!important}body{background:#fff!important} }`}</style>
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><Link href="/team" className="text-sm font-bold text-blue-700">← Team dashboard</Link><h1 className="mt-2 text-3xl font-black">Training Hours</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Review the course already assigned to each operator. No second training assignment is required.</p></div><div className="manager-actions flex gap-2"><label className="text-xs font-bold">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded-lg border p-2" /></label><label className="text-xs font-bold">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded-lg border p-2" /></label></div></div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="operator-list rounded-2xl border bg-white p-4 shadow-sm"><h2 className="font-extrabold">Operators and assigned courses</h2><div className="mt-3 space-y-2">{summary.isLoading && <p className="text-sm text-slate-500">Loading…</p>}{summary.data?.operators.length === 0 && <p className="text-sm text-slate-500">No verified activity in this period.</p>}{summary.data?.operators.map((operator) => { const active = selected?.operatorEmail === operator.operatorEmail && selected?.courseKey === operator.courseKey; return <button key={`${operator.operatorEmail}-${operator.courseKey}`} onClick={() => setSelected(operator)} className={`w-full rounded-xl border p-3 text-left ${active ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}><div className="truncate text-sm font-bold">{operator.operatorEmail}</div><div className="mt-1 text-xs text-slate-600">{operator.courseName}</div><div className="mt-2 text-sm font-black text-blue-800">{hours(operator.activeSeconds)} · {operator.sessionCount} sessions</div></button>; })}</div></aside>

          <section className="report-card rounded-2xl border bg-white p-6 shadow-sm">
            {!report.data ? <p className="text-slate-500">Select an operator to review their record.</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Echelon-verified study activity</div><h2 className="mt-1 text-2xl font-black">{report.data.operatorName || report.data.operatorEmail}</h2><p className="text-sm text-slate-600">{report.data.courseKey} · {new Date(report.data.from).toLocaleDateString()} – {new Date(report.data.to).toLocaleDateString()}</p></div><div className="manager-actions flex gap-2"><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><Printer className="h-4 w-4" />PDF</button><button onClick={async () => { const result = await csv.refetch(); if (result.data) saveCsv(result.data.csv, result.data.filename); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white"><Download className="h-4 w-4" />CSV detail</button></div></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-blue-50 p-4"><div className="text-xs font-bold uppercase text-blue-700">Verified active time</div><div className="mt-1 text-3xl font-black">{hours(report.data.activeSeconds)}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase text-slate-500">Sessions</div><div className="mt-1 text-3xl font-black">{report.data.sessionCount}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase text-slate-500">Activities</div><div className="mt-1 text-sm font-bold">{report.data.byActivity.map((a) => a.label).join(", ") || "—"}</div></div></div>

              {report.data.attestations[0] && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><div className="font-extrabold text-emerald-900">Signed training record</div><div className="mt-1">Signed by {report.data.attestations[0].signedByName} ({report.data.attestations[0].signedRole}) on {new Date(report.data.attestations[0].signedAt).toLocaleDateString()}</div><div className="mt-1">Instructor: {report.data.attestations[0].instructorName} · {report.data.attestations[0].instructorContact}</div><div className="mt-1 font-mono text-[10px] text-slate-500">Record {report.data.attestations[0].reportId} · SHA-256 {report.data.attestations[0].digestSha256}</div></div>}

              <details className="mt-6 rounded-xl border p-4"><summary className="cursor-pointer font-extrabold">Optional session appendix ({report.data.sessions.length})</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Date</th><th>Activity</th><th>Topic</th><th className="text-right">Duration</th></tr></thead><tbody>{report.data.sessions.map((s) => <tr key={s.sessionKey} className="border-b border-slate-100"><td className="py-2">{new Date(s.startedAt).toLocaleString()}</td><td>{s.activityType.replaceAll("_", " ")}</td><td>{s.topic || "—"}</td><td className="text-right font-bold">{Math.round(s.activeSeconds / 60)} min</td></tr>)}</tbody></table></div></details>

              <div className="attest-form mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="flex items-center gap-2 font-extrabold"><FileCheck2 className="h-5 w-5 text-emerald-700" />Manager / ORO attestation</h3><p className="mt-2 text-xs leading-relaxed text-emerald-900">Signing freezes an immutable copy of this period, including the optional session appendix and an integrity digest. Confirm that the activity was job-related and meets your organization’s training requirements.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{([ ["providerName","Training provider"], ["instructorName","Instructor / qualified trainer"], ["instructorContact","Instructor email or phone"], ["signedByName","Your full name"], ["signedRole","Your role"] ] as const).map(([key,label]) => <label key={key} className="text-xs font-bold">{label}<input value={form[key]} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} className="mt-1 w-full rounded-lg border border-emerald-200 bg-white p-2.5 text-sm" /></label>)}</div><button disabled={attest.isPending || !form.instructorName || !form.instructorContact || !form.signedByName || report.data.sessionCount === 0} onClick={doAttest} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-40">{attest.isPending ? "Signing…" : "Sign and freeze this record"}</button></div>
            </>}
          </section>
        </div>
        <p className="mt-5 text-xs text-slate-500">Echelon reports verified active study time; the employer and applicable regulator determine whether it qualifies as OJT or continuing-education credit.</p>
      </main>
    </div>
  );
}
